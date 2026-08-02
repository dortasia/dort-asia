// ─── Types ───────────────────────────────────────────────────────────────────
export interface OrgEmployee {
  id: string;
  full_name: string;
  role: string;
  department: string;
  profile_image: string | null;
  manager_id: string | null;
  status: string; // 'active' | 'inactive' | 'on-leave'
  company_id: string;
  is_head?: boolean;
  email?: string;
  mobile?: string;
}

export interface OrgNode {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string | null;
  status: string;
  manager_id: string | null;
  isHead?: boolean;
  email?: string;
  mobile?: string;
  children?: OrgNode[];
}

// ─── Flat → Tree conversion ───────────────────────────────────────────────────
/**
 * Converts a flat employee list into a tree of OrgNodes.
 *
 * Handles:
 * - Multiple roots (manager_id = null) → wrapped in a virtual root
 * - Missing managers (orphaned nodes) → treated as roots
 * - Circular references → detected and broken
 */
// ─── Role level map for authority-chain inference ────────────────────────────
const ROLE_LEVELS: Record<string, number> = {
  "super admin": 0,
  "admin":       1,
  "sub admin":   2,
  "subadmin":    2,
  "employee":    3,
};

function getRoleLevel(role: string): number {
  const key = role?.toLowerCase().trim() ?? "employee";
  // exact match first
  if (key in ROLE_LEVELS) return ROLE_LEVELS[key];
  // partial match (e.g. "Sub-Admin", "HR Admin")
  for (const [k, v] of Object.entries(ROLE_LEVELS)) {
    if (key.includes(k)) return v;
  }
  return 3; // default → employee level
}

export function buildOrgTree(employees: OrgEmployee[]): OrgNode {
  const nodeMap = new Map<string, OrgNode>();

  for (const emp of employees) {
    nodeMap.set(emp.id, {
      id: emp.id,
      name: emp.full_name,
      role: emp.role,
      department: emp.department,
      avatar: emp.profile_image,
      status: emp.status,
      manager_id: emp.manager_id,
      isHead: emp.is_head ?? false,
      email: emp.email,
      mobile: emp.mobile,
      children: [],
    });
  }

  // ── Fallback when NO manager_id is set in the DB ──────────────────────────
  const anyHasManager = employees.some(e => e.manager_id != null);

  if (!anyHasManager) {
    // ── STEP 1: Role-based authority chain ───────────────────────────────────
    // Bucket nodes by their role level (0=SuperAdmin … 3=Employee)
    const byLevel = new Map<number, OrgNode[]>();
    for (const node of nodeMap.values()) {
      const lvl = getRoleLevel(node.role);
      if (!byLevel.has(lvl)) byLevel.set(lvl, []);
      byLevel.get(lvl)!.push(node);
    }

    const sortedLevels = [...byLevel.keys()].sort((a, b) => a - b);

    // Each level's nodes become children of the level above (round-robin)
    for (let i = 1; i < sortedLevels.length; i++) {
      const parentLevel  = sortedLevels[i - 1];
      const childLevel   = sortedLevels[i];
      const parents      = byLevel.get(parentLevel)!;
      const children     = byLevel.get(childLevel)!;

      if (parents.length === 0) continue;

      children.forEach((child, idx) => {
        // round-robin across parents at the level above
        const parent = parents[idx % parents.length];
        child.manager_id = parent.id;
      });
    }

    // ── STEP 2: Within the same role level, is_head employees parent others ──
    // (secondary refinement — dept heads own their dept peers at the same level)
    const deptHeadMap = new Map<string, string>(); // dept → head node id
    for (const emp of employees) {
      if ((emp.is_head ?? false) && emp.department) {
        deptHeadMap.set(emp.department, emp.id);
      }
    }
    for (const node of nodeMap.values()) {
      // override only if both are at the same role level and the node isn't already assigned
      if (node.department && !node.isHead) {
        const headId = deptHeadMap.get(node.department);
        if (headId && headId !== node.id) {
          const headLevel  = getRoleLevel(nodeMap.get(headId)!.role);
          const nodeLevel  = getRoleLevel(node.role);
          // only override if they share the same role level
          // (avoids admins being parented under dept employees)
          if (headLevel === nodeLevel && node.manager_id && getRoleLevel(nodeMap.get(node.manager_id!)?.role ?? "") !== headLevel - 1) {
            node.manager_id = headId;
          }
        }
      }
    }
  }

  // ── Cycle detection ───────────────────────────────────────────────────────
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function hasCycle(id: string): boolean {
    if (inStack.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    inStack.add(id);
    const node = nodeMap.get(id);
    if (node?.manager_id && nodeMap.has(node.manager_id)) {
      if (hasCycle(node.manager_id)) return true;
    }
    inStack.delete(id);
    return false;
  }

  for (const id of nodeMap.keys()) {
    if (hasCycle(id)) nodeMap.get(id)!.manager_id = null;
  }

  // ── Build tree ────────────────────────────────────────────────────────────
  const roots: OrgNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.manager_id && nodeMap.has(node.manager_id)) {
      nodeMap.get(node.manager_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  if (roots.length === 1) return roots[0];

  return {
    id: "__virtual_root__",
    name: "Organization",
    role: "",
    department: "",
    avatar: null,
    status: "active",
    manager_id: null,
    children: roots,
  };
}




// ─── Flatten tree (for search) ────────────────────────────────────────────────
export function flattenOrgTree(node: OrgNode): OrgNode[] {
  const result: OrgNode[] = [node];
  for (const child of node.children ?? []) {
    result.push(...flattenOrgTree(child));
  }
  return result;
}

// ─── Find node by id ──────────────────────────────────────────────────────────
export function findOrgNode(root: OrgNode, id: string): OrgNode | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findOrgNode(child, id);
    if (found) return found;
  }
  return null;
}

// ─── Collect all ancestor ids for a given node ───────────────────────────────
export function getAncestorIds(root: OrgNode, targetId: string): Set<string> {
  const result = new Set<string>();
  function dfs(node: OrgNode, path: string[]): boolean {
    if (node.id === targetId) {
      path.forEach(id => result.add(id));
      return true;
    }
    for (const child of node.children ?? []) {
      if (dfs(child, [...path, node.id])) return true;
    }
    return false;
  }
  dfs(root, []);
  return result;
}

// ─── Collect all descendant ids for a given node ─────────────────────────────
export function getDescendantIds(node: OrgNode): Set<string> {
  const result = new Set<string>();
  function dfs(n: OrgNode) {
    for (const child of n.children ?? []) {
      result.add(child.id);
      dfs(child);
    }
  }
  dfs(node);
  return result;
}
