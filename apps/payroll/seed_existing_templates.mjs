import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Helper to get initials from a company name
function getCompanyInitials(companyName) {
  const cleanName = companyName.trim().toUpperCase().replace(/[^A-Z\s]/g, "");
  const words = cleanName.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).slice(0, 2);
  } else if (words.length === 1) {
    const word = words[0];
    if (word.length >= 2) {
      return word.slice(0, 2);
    } else if (word.length === 1) {
      return word + "X";
    }
  }
  return "DA";
}

// Helper to build/generate a department ID
function generateDeptId(companyInitials, sequenceNum) {
  const seqStr = String(sequenceNum).padStart(4, "0");
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  return `${companyInitials}${seqStr}DEPT${yearSuffix}`;
}

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL="([^"]+)"/)[1];
const supabaseKey = envLocal.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]+)"/)[1];
const sb = createClient(supabaseUrl, supabaseKey);

const templates = [
  {
    name: 'Management',
    description: 'Responsible for global strategy, business development, leadership, and operational overview.',
    designations: ['Chief Executive Officer', 'Chief Operating Officer', 'Director', 'General Manager']
  },
  {
    name: 'Human Resources',
    description: 'Manages employee relations, talent acquisition, recruitment, benefits, compliance, and training.',
    designations: ['HR Manager', 'HR Generalist', 'Recruiter', 'Talent Acquisition Specialist']
  },
  {
    name: 'Finance & Accounts',
    description: 'Manages company banking accounts, equity allocations, financial reporting, budgeting, audit, and tax compliance.',
    designations: ['Finance Manager', 'Chief Accountant', 'Accounts Executive', 'Financial Analyst']
  },
  {
    name: 'Operations',
    description: 'Manages day-to-day operations, supply chain logistics, service delivery, and project management.',
    designations: ['Operations Director', 'Operations Manager', 'Project Manager', 'Operations Executive']
  },
  {
    name: 'Administration',
    description: 'Manages office administration, corporate services, clerical support, IT support, and facilities.',
    designations: ['Office Administrator', 'Administrative Assistant', 'IT Support Analyst', 'Receptionist']
  }
];

async function run() {
  console.log("Starting department seeding for existing companies...");

  const { data: companies, error: compErr } = await sb
    .from('company_settings')
    .select('company_id, company_name');

  if (compErr) {
    throw new Error(`Failed to fetch companies: ${compErr.message}`);
  }

  console.log(`Found ${companies.length} companies to process.`);

  for (const company of companies) {
    console.log(`\n----------------------------------------`);
    console.log(`Processing company: "${company.company_name}" (${company.company_id})`);

    const { data: existingDepts, error: deptErr } = await sb
      .from('departments')
      .select('*')
      .eq('company_id', company.company_id);

    if (deptErr) {
      console.error(`Error fetching departments for company ${company.company_id}: ${deptErr.message}`);
      continue;
    }

    // Determine missing template departments
    const missingTemplates = templates.filter(t => {
      return !existingDepts.some(ed => ed.name.trim().toLowerCase() === t.name.toLowerCase());
    });

    if (missingTemplates.length === 0) {
      console.log(`All template departments already exist for this company.`);
      continue;
    }

    console.log(`Missing ${missingTemplates.length} templates: ${missingTemplates.map(t => t.name).join(', ')}`);

    // Calculate maximum sequence number across existing departments for this company
    let maxSeq = 0;
    existingDepts.forEach(d => {
      if (d.dept_id) {
        const match = d.dept_id.match(/[A-Z]+(\d+)DEPT\d+/i);
        if (match) {
          const seq = parseInt(match[1], 10);
          if (seq > maxSeq) maxSeq = seq;
        } else {
          const genericMatch = d.dept_id.match(/\d+/);
          if (genericMatch) {
            const seq = parseInt(genericMatch[0], 10);
            if (seq > maxSeq) maxSeq = seq;
          }
        }
      }
    });

    console.log(`Current maximum sequence number for department IDs: ${maxSeq}`);

    const initials = getCompanyInitials(company.company_name);

    for (const template of missingTemplates) {
      maxSeq += 1;
      const generatedDeptId = generateDeptId(initials, maxSeq);

      console.log(`Inserting template "${template.name}" with ID "${generatedDeptId}"...`);

      const { data: inserted, error: insertErr } = await sb
        .from('departments')
        .insert({
          company_id: company.company_id,
          name: template.name,
          description: template.description,
          designations: template.designations,
          dept_id: generatedDeptId,
          head_id: null,
          delegation_config: {
            parent_id: null,
            claims: { main: "", sub: "" },
            attendance: { main: "", sub: "" },
            leave: { main: "", sub: "" },
            events: { main: "", sub: "" }
          }
        })
        .select('*');

      if (insertErr) {
        console.error(`Failed to insert department "${template.name}":`, insertErr.message);
      } else {
        console.log(`Successfully created department "${template.name}" (ID: ${inserted[0].id})`);
      }
    }
  }

  console.log("\n----------------------------------------");
  console.log("Seeding process completed.");
}

run().catch(console.error);
