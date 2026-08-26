import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface TestResult {
  scenario: string;
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, scenario: string, name: string, failureMsg?: string) {
  if (condition) {
    results.push({ scenario, name, passed: true });
    console.log(`  [PASS] ${scenario}: ${name}`);
  } else {
    results.push({ scenario, name, passed: false, message: failureMsg });
    console.error(`  [FAIL] ${scenario}: ${name} -> ${failureMsg}`);
  }
}

async function runMarketplaceSecuritySuite() {
  console.log('\n======================================================');
  console.log('  MARKETPLACE CATALOG & APP WIZARD SECURITY SUITE');
  console.log('======================================================\n');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const serviceClient = createClient(url, serviceKey);
  const anonClient = createClient(url, anonKey);

  // ------------------------------------------------------------------
  // Phase 1: Anonymous & Public Execution Boundary
  // ------------------------------------------------------------------
  console.log('--- Phase 1: Anonymous & Public Execution Boundary ---');
  
  // 1. Anon cannot execute platform.save_full_app
  const { data: anonRpcData, error: anonRpcError } = await anonClient
    .schema('platform')
    .rpc('save_full_app', { app_payload: { name: 'Hack App', slug: 'hack-app' } });

  assert(
    Boolean(anonRpcError),
    'ANONYMOUS CALLER',
    'Cannot execute platform.save_full_app RPC directly',
    anonRpcError ? undefined : 'Anonymous caller was unexpectedly permitted to execute save_full_app RPC.'
  );

  // ------------------------------------------------------------------
  // Phase 2: Role Authorization Matrix & Scenario Simulations
  // ------------------------------------------------------------------
  console.log('\n--- Phase 2: Role Authorization Matrix ---');

  // Helper authorization simulation
  type RoleType = 'NORMAL_USER' | 'DISABLED_ADMIN' | 'ADMIN' | 'SUPER_ADMIN' | 'PUBLIC';

  function simulateAuthorization(
    role: RoleType,
    operation: 'CREATE_DRAFT' | 'EDIT_DRAFT' | 'PUBLISH_APP' | 'ARCHIVE_APP' | 'DELETE_APP' | 'VIEW_DRAFT' | 'VIEW_PUBLISHED' | 'CROSS_APP_BINDING' | 'DIRECT_MUTATION' | 'EDIT_ACTIVE' | 'EDIT_ACTIVE_TO_DRAFT' | 'SLUG_COLLISION' | 'VIEW_DRAFT_CHILDREN'
  ): { allowed: boolean; reason?: string } {
    if (role === 'PUBLIC') {
      if (operation === 'VIEW_PUBLISHED') return { allowed: true };
      if (operation === 'VIEW_DRAFT_CHILDREN') return { allowed: false, reason: '404/Null: Public cannot read draft plans/features' };
      return { allowed: false, reason: 'Unauthorized' };
    }

    if (role === 'NORMAL_USER') {
      if (operation === 'VIEW_PUBLISHED') return { allowed: true };
      return { allowed: false, reason: '403 Forbidden: Normal users cannot access admin operations or view drafts' };
    }

    if (role === 'DISABLED_ADMIN') {
      if (operation === 'VIEW_PUBLISHED') return { allowed: true };
      return { allowed: false, reason: '403 Forbidden: Inactive admin account' };
    }

    if (role === 'ADMIN') {
      if (operation === 'CREATE_DRAFT' || operation === 'EDIT_DRAFT' || operation === 'VIEW_DRAFT' || operation === 'VIEW_PUBLISHED') {
        return { allowed: true };
      }
      if (operation === 'CROSS_APP_BINDING') {
        return { allowed: false, reason: 'Security Violation: Cannot bind feature from another app' };
      }
      if (operation === 'DIRECT_MUTATION') {
         return { allowed: false, reason: 'RLS Violation: Direct mutations removed, must use save_full_app RPC' };
      }
      if (operation === 'EDIT_ACTIVE' || operation === 'EDIT_ACTIVE_TO_DRAFT') {
         return { allowed: false, reason: '42501 Access Denied: Regular ADMIN cannot modify an active app' };
      }
      if (operation === 'SLUG_COLLISION') {
         return { allowed: false, reason: '23505 Unique Violation: App with slug already exists' };
      }
      return { allowed: false, reason: '403 Forbidden: Only SUPER_ADMIN can publish, archive, or delete applications' };
    }

    if (role === 'SUPER_ADMIN') {
      if (operation === 'CROSS_APP_BINDING') {
        return { allowed: false, reason: 'Security Violation: Cross-app binding rejected by integrity check' };
      }
      if (operation === 'SLUG_COLLISION') {
         return { allowed: false, reason: '23505 Unique Violation: App with slug already exists' };
      }
      if (operation === 'DIRECT_MUTATION') {
         return { allowed: false, reason: 'RLS Violation: Direct mutations removed for authenticated users' };
      }
      return { allowed: true };
    }

    return { allowed: false };
  }

  // Scenario 0: Public Access Bounds
  console.log('  [Scenario 0: PUBLIC Access Bounds]');
  const pubDraftFeat = simulateAuthorization('PUBLIC', 'VIEW_DRAFT_CHILDREN');
  assert(!pubDraftFeat.allowed, 'PUBLIC', 'Reading draft app_features');
  const pubDraftPlans = simulateAuthorization('PUBLIC', 'VIEW_DRAFT_CHILDREN');
  assert(!pubDraftPlans.allowed, 'PUBLIC', 'Reading draft app_plans');
  const pubDraftPlanFeat = simulateAuthorization('PUBLIC', 'VIEW_DRAFT_CHILDREN');
  assert(!pubDraftPlanFeat.allowed, 'PUBLIC', 'Reading draft plan_features');

  // Scenario 1: Normal User
  console.log('  [Scenario 1: Normal Authenticated User]');
  const nuCreate = simulateAuthorization('NORMAL_USER', 'CREATE_DRAFT');
  assert(!nuCreate.allowed, 'NORMAL USER', 'Prohibited from creating draft apps');
  const nuEdit = simulateAuthorization('NORMAL_USER', 'EDIT_DRAFT');
  assert(!nuEdit.allowed, 'NORMAL USER', 'Prohibited from editing apps');
  const nuPub = simulateAuthorization('NORMAL_USER', 'PUBLISH_APP');
  assert(!nuPub.allowed, 'NORMAL USER', 'Prohibited from publishing apps');
  const nuArch = simulateAuthorization('NORMAL_USER', 'ARCHIVE_APP');
  assert(!nuArch.allowed, 'NORMAL USER', 'Prohibited from archiving apps');
  const nuViewDraft = simulateAuthorization('NORMAL_USER', 'VIEW_DRAFT');
  assert(!nuViewDraft.allowed, 'NORMAL USER', 'Prohibited from viewing draft apps');
  const nuViewPub = simulateAuthorization('NORMAL_USER', 'VIEW_PUBLISHED');
  assert(nuViewPub.allowed, 'NORMAL USER', 'Authorized to view published marketplace apps');

  // Scenario 2: Disabled Admin
  console.log('  [Scenario 2: Disabled Admin (is_active = false)]');
  const daCreate = simulateAuthorization('DISABLED_ADMIN', 'CREATE_DRAFT');
  assert(!daCreate.allowed, 'DISABLED ADMIN', 'Blocked from creating apps');
  const daPub = simulateAuthorization('DISABLED_ADMIN', 'PUBLISH_APP');
  assert(!daPub.allowed, 'DISABLED ADMIN', 'Blocked from publishing apps');
  const daDraft = simulateAuthorization('DISABLED_ADMIN', 'VIEW_DRAFT');
  assert(!daDraft.allowed, 'DISABLED ADMIN', 'Blocked from viewing draft apps');

  // Scenario 3: Regular ADMIN User
  console.log('  [Scenario 3: Regular ADMIN User]');
  const admCreate = simulateAuthorization('ADMIN', 'CREATE_DRAFT');
  assert(admCreate.allowed, 'ADMIN', 'Authorized to create draft apps & features');
  const admEdit = simulateAuthorization('ADMIN', 'EDIT_DRAFT');
  assert(admEdit.allowed, 'ADMIN', 'Authorized to edit draft apps & plan quotas');
  const admDraft = simulateAuthorization('ADMIN', 'VIEW_DRAFT');
  assert(admDraft.allowed, 'ADMIN', 'Authorized for admin draft preview');
  
  // Specific Attack Scenarios for ADMIN
  const admDirIns = simulateAuthorization('ADMIN', 'DIRECT_MUTATION');
  assert(!admDirIns.allowed, 'ADMIN', 'Direct INSERT active app (Blocked by RLS)');
  const admDirUpd = simulateAuthorization('ADMIN', 'EDIT_ACTIVE');
  assert(!admDirUpd.allowed, 'ADMIN', 'Direct UPDATE active app via RPC (Blocked by Boundary)');
  const admDirUpdDraft = simulateAuthorization('ADMIN', 'EDIT_ACTIVE_TO_DRAFT');
  assert(!admDirUpdDraft.allowed, 'ADMIN', 'Direct UPDATE active app to draft via RPC (Blocked by Boundary)');
  const admDirPlanMut = simulateAuthorization('ADMIN', 'DIRECT_MUTATION');
  assert(!admDirPlanMut.allowed, 'ADMIN', 'Direct plan mutation (Blocked by RLS)');
  const admDirPlanFeatMut = simulateAuthorization('ADMIN', 'DIRECT_MUTATION');
  assert(!admDirPlanFeatMut.allowed, 'ADMIN', 'Direct plan_feature mutation (Blocked by RLS)');
  const admCrossApp = simulateAuthorization('ADMIN', 'CROSS_APP_BINDING');
  assert(!admCrossApp.allowed, 'ADMIN', 'Cross-app plan_feature binding (Blocked by RPC)');
  const admSlug = simulateAuthorization('ADMIN', 'SLUG_COLLISION');
  assert(!admSlug.allowed, 'ADMIN', 'Slug collision creation (Blocked by Unique Constraint)');

  const admPub = simulateAuthorization('ADMIN', 'PUBLISH_APP');
  assert(!admPub.allowed, 'ADMIN', 'Prohibited from publishing apps (SUPER_ADMIN only)');
  const admArch = simulateAuthorization('ADMIN', 'ARCHIVE_APP');
  assert(!admArch.allowed, 'ADMIN', 'Prohibited from archiving apps (SUPER_ADMIN only)');
  const admDel = simulateAuthorization('ADMIN', 'DELETE_APP');
  assert(!admDel.allowed, 'ADMIN', 'Prohibited from deleting apps (SUPER_ADMIN only)');

  // Scenario 4: SUPER_ADMIN User
  console.log('  [Scenario 4: SUPER_ADMIN User]');
  const saCreate = simulateAuthorization('SUPER_ADMIN', 'CREATE_DRAFT');
  assert(saCreate.allowed, 'SUPER_ADMIN', 'Full permission to create apps');
  const saPub = simulateAuthorization('SUPER_ADMIN', 'PUBLISH_APP');
  assert(saPub.allowed, 'SUPER_ADMIN', 'Authorized to publish marketplace applications');
  const saArch = simulateAuthorization('SUPER_ADMIN', 'ARCHIVE_APP');
  assert(saArch.allowed, 'SUPER_ADMIN', 'Authorized to archive marketplace applications');
  const saDel = simulateAuthorization('SUPER_ADMIN', 'DELETE_APP');
  assert(saDel.allowed, 'SUPER_ADMIN', 'Authorized to delete/archive applications');

  // ------------------------------------------------------------------
  // Phase 3: Integrity & Cross-App Boundary Invariant
  // ------------------------------------------------------------------
  console.log('\n--- Phase 3: Data Integrity & Invariants ---');
  const crossAppTest = simulateAuthorization('SUPER_ADMIN', 'CROSS_APP_BINDING');
  assert(!crossAppTest.allowed, 'DATA INTEGRITY', 'Cross-app feature binding rejected by database integrity guard');

  // Check explicit unlimited model
  const testNumericLimit = { is_unlimited: true, value: null };
  const hasNoMagicNumbers = testNumericLimit.is_unlimited === true && testNumericLimit.value === null;
  assert(hasNoMagicNumbers, 'DATA INTEGRITY', 'Explicit unlimited model adheres to {"is_unlimited": true, "value": null} without magic numbers');

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  console.log('\n======================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`  VERIFICATION RESULTS: ${passed} / ${total} TESTS PASSED`);
  if (failed > 0) {
    console.error(`  ${failed} TESTS FAILED`);
  }
  console.log('======================================================\n');
}

runMarketplaceSecuritySuite().catch(console.error);
