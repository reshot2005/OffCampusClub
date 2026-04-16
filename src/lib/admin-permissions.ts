export type AdminLevel = "SUPER_ADMIN" | "MODERATOR" | null;

export type AdminModule =
  | "clubs"
  | "users"
  | "posts"
  | "events"
  | "gigs"
  | "orbit"
  | "approvals"
  | "audit"
  | "security"
  | "settings"
  | "export"
  | "analytics"
  | "roles"
  | "moderation"
  | "feature_flags"
  | "broadcasts"
  | "announcement_schedule"
  | "compliance";

export type AdminAction =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "suspend"
  | "role_change"
  | "admin_promote"
  | "approve"
  | "reject"
  | "approve_applications"
  | "resolve"
  | "csv_users"
  | "csv_posts"
  | "csv_clubs"
  | "csv_events"
  | "csv_gigs"
  | "export_data";

const SUPER_ADMIN_PERMISSIONS: Record<AdminModule, AdminAction[]> = {
  clubs: ["read", "create", "update", "delete"],
  users: ["read", "create", "update", "delete", "suspend", "role_change", "admin_promote"],
  posts: ["read", "update", "delete"],
  events: ["read", "create", "update", "delete"],
  gigs: ["read", "create", "update", "delete", "approve_applications"],
  orbit: ["read", "create", "update", "delete"],
  approvals: ["read", "approve", "reject"],
  audit: ["read"],
  security: ["read", "resolve"],
  settings: ["read", "update"],
  export: ["read", "csv_users", "csv_posts", "csv_clubs", "csv_events", "csv_gigs"],
  analytics: ["read"],
  roles: ["read", "create", "update", "delete"],
  moderation: ["read", "update", "resolve", "approve", "reject"],
  feature_flags: ["read", "update"],
  broadcasts: ["read", "create"],
  announcement_schedule: ["read", "create", "update", "delete"],
  compliance: ["read", "export_data"],
};

const MODERATOR_PERMISSIONS: Record<AdminModule, AdminAction[]> = {
  clubs: ["read"],
  users: ["read", "suspend", "role_change", "admin_promote"],
  posts: ["read", "update", "delete"],
  events: ["read", "create", "update", "delete"],
  gigs: ["read"],
  orbit: ["read"],
  approvals: ["read", "approve", "reject"],
  audit: [],
  security: [],
  settings: [],
  export: [],
  analytics: ["read"],
  roles: [],
  moderation: ["read", "update"],
  feature_flags: [],
  broadcasts: [],
  announcement_schedule: [],
  compliance: [],
};

/** When true, all modules/actions allowed (legacy super admin without DB template). */
export type EffectiveAdminAccess =
  | { fullAccess: true }
  | { fullAccess: false; matrix: Record<string, string[]> };

export function buildMatrixFromLevel(adminLevel: AdminLevel): Record<string, string[]> {
  const src =
    !adminLevel || adminLevel === "SUPER_ADMIN" ? SUPER_ADMIN_PERMISSIONS : MODERATOR_PERMISSIONS;
  const out: Record<string, string[]> = {};
  (Object.keys(src) as AdminModule[]).forEach((m) => {
    out[m] = [...(src[m] ?? [])];
  });
  return out;
}

export function parseTemplatePermissions(raw: unknown): Record<string, string[]> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(o)) {
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
      out[k] = v as string[];
    }
  }
  return Object.keys(out).length ? out : null;
}

export function resolveEffectiveAccess(params: {
  adminLevel: string | null | undefined;
  templatePermissions: unknown;
}): EffectiveAdminAccess {
  // Security default: never treat missing adminLevel as SUPER_ADMIN.
  const level = ((params.adminLevel ?? "MODERATOR") as AdminLevel) || "MODERATOR";
  const parsed = parseTemplatePermissions(params.templatePermissions);
  if (parsed) {
    return { fullAccess: false, matrix: parsed };
  }
  if (!level || level === "SUPER_ADMIN") {
    return { fullAccess: true };
  }
  return { fullAccess: false, matrix: buildMatrixFromLevel(level) };
}

export function can(access: EffectiveAdminAccess, module: AdminModule, action: AdminAction): boolean {
  if (access.fullAccess) {
    return SUPER_ADMIN_PERMISSIONS[module]?.includes(action) ?? false;
  }
  const list = access.matrix[module];
  return Array.isArray(list) && list.includes(action);
}

/** @deprecated use resolveEffectiveAccess + can */
export function hasPermission(adminLevel: AdminLevel, module: AdminModule, action: AdminAction): boolean {
  return can(resolveEffectiveAccess({ adminLevel, templatePermissions: null }), module, action);
}

export function getModulePermissions(
  adminLevel: AdminLevel,
  module: AdminModule,
): AdminAction[] {
  const access = resolveEffectiveAccess({ adminLevel, templatePermissions: null });
  if (access.fullAccess) {
    return SUPER_ADMIN_PERMISSIONS[module] ?? [];
  }
  return (access.matrix[module] as AdminAction[] | undefined) ?? [];
}

export const ALL_MODULES: { key: AdminModule; label: string; icon: string }[] = [
  { key: "clubs", label: "Clubs", icon: "Grid3X3" },
  { key: "users", label: "Users", icon: "Users" },
  { key: "posts", label: "Posts", icon: "FileText" },
  { key: "events", label: "Events", icon: "Calendar" },
  { key: "orbit", label: "Orbit", icon: "Orbit" },
  { key: "gigs", label: "Gigs", icon: "Briefcase" },
  { key: "approvals", label: "Approvals", icon: "CheckCircle2" },
  { key: "analytics", label: "Analytics", icon: "TrendingUp" },
  { key: "audit", label: "Audit Log", icon: "ScrollText" },
  { key: "security", label: "Security", icon: "ShieldAlert" },
  { key: "settings", label: "Settings", icon: "Settings" },
  { key: "export", label: "Export", icon: "Download" },
  { key: "roles", label: "Roles", icon: "Shield" },
  { key: "moderation", label: "Moderation", icon: "Flag" },
  { key: "feature_flags", label: "Feature flags", icon: "ToggleLeft" },
  { key: "broadcasts", label: "Broadcasts", icon: "Radio" },
  { key: "announcement_schedule", label: "Scheduled banners", icon: "Clock" },
  { key: "compliance", label: "Compliance", icon: "FileKey" },
];
