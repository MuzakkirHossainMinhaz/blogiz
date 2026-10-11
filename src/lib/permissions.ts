export type UserRole = "admin" | "author" | "reader";

export interface Permission {
  can: {
    createBlog: boolean;
    editOwnBlog: boolean;
    editAnyBlog: boolean;
    deleteOwnBlog: boolean;
    deleteAnyBlog: boolean;

    createComment: boolean;
    editOwnComment: boolean;
    editAnyComment: boolean;
    deleteOwnComment: boolean;
    deleteAnyComment: boolean;
    moderateOwnBlogComments: boolean;

    viewUsers: boolean;
    editOwnProfile: boolean;
    editAnyProfile: boolean;
    deactivateUser: boolean;
    deleteUser: boolean;
    changeUserRole: boolean;
    resetUserPassword: boolean;
    suspendCommenting: boolean;
    reviewRoleUpgrades: boolean;

    viewDashboard: boolean;
    viewAdminDashboard: boolean;
  };
}

export const rolePermissions: Record<UserRole, Permission> = {
  admin: {
    can: {
      createBlog: true,
      editOwnBlog: true,
      editAnyBlog: true,
      deleteOwnBlog: true,
      deleteAnyBlog: true,

      createComment: true,
      editOwnComment: true,
      editAnyComment: true,
      deleteOwnComment: true,
      deleteAnyComment: true,
      moderateOwnBlogComments: true,

      viewUsers: true,
      editOwnProfile: true,
      editAnyProfile: true,
      deactivateUser: true,
      deleteUser: true,
      changeUserRole: true,
      resetUserPassword: true,
      suspendCommenting: true,
      reviewRoleUpgrades: true,

      viewDashboard: true,
      viewAdminDashboard: true,
    },
  },

  author: {
    can: {
      createBlog: true,
      editOwnBlog: true,
      editAnyBlog: false,
      deleteOwnBlog: true,
      deleteAnyBlog: false,

      createComment: true,
      editOwnComment: true,
      editAnyComment: false,
      deleteOwnComment: true,
      deleteAnyComment: false,
      moderateOwnBlogComments: true,

      viewUsers: false,
      editOwnProfile: true,
      editAnyProfile: false,
      deactivateUser: false,
      deleteUser: false,
      changeUserRole: false,
      resetUserPassword: false,
      suspendCommenting: false,
      reviewRoleUpgrades: false,

      viewDashboard: true,
      viewAdminDashboard: false,
    },
  },

  reader: {
    can: {
      createBlog: false,
      editOwnBlog: false,
      editAnyBlog: false,
      deleteOwnBlog: false,
      deleteAnyBlog: false,

      createComment: true,
      editOwnComment: true,
      editAnyComment: false,
      deleteOwnComment: true,
      deleteAnyComment: false,
      moderateOwnBlogComments: false,

      viewUsers: false,
      editOwnProfile: true,
      editAnyProfile: false,
      deactivateUser: false,
      deleteUser: false,
      changeUserRole: false,
      resetUserPassword: false,
      suspendCommenting: false,
      reviewRoleUpgrades: false,

      viewDashboard: true,
      viewAdminDashboard: false,
    },
  },
};

export function hasPermission(userRole: UserRole, permission: keyof Permission["can"]): boolean {
  return rolePermissions[userRole]?.can[permission] || false;
}

export function canPerformAction(
  userRole: UserRole,
  action: keyof Permission["can"],
  resourceOwnerId?: string,
  currentUserId?: string
): boolean {
  const basePermission = hasPermission(userRole, action);

  if (action.includes("Own") && resourceOwnerId && currentUserId) {
    return basePermission && resourceOwnerId === currentUserId;
  }

  if (action.includes("Any")) {
    return basePermission;
  }

  return basePermission;
}

export const roleHierarchy: Record<UserRole, number> = {
  admin: 3,
  author: 2,
  reader: 1,
};

export function hasHigherOrEqualRole(userRole: UserRole, targetRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[targetRole];
}

/** True only when the actor outranks the target. Equal roles cannot manage each other. */
export function canManageRole(actor: UserRole, target: UserRole): boolean {
  return roleHierarchy[actor] > roleHierarchy[target];
}

const USER_ROLES: UserRole[] = ["admin", "author", "reader"];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

/**
 * Proxy gate. Authentication is required for /dashboard.
 * Admin path prefixes require viewAdminDashboard.
 * Authoring routes require createBlog.
 */
export function dashboardAccess(role: UserRole | undefined, pathname: string): "ok" | "login" | "forbidden" {
  if (!pathname.startsWith("/dashboard")) return "ok";
  if (!role) return "login";
  if (!hasPermission(role, "viewDashboard")) return "forbidden";

  if (pathname === "/dashboard/admin" || pathname.startsWith("/dashboard/admin/")) {
    return hasPermission(role, "viewAdminDashboard") ? "ok" : "forbidden";
  }

  const authoring =
    pathname.startsWith("/dashboard/blogs") ||
    pathname === "/dashboard/analytics" ||
    pathname.startsWith("/dashboard/analytics/");
  if (authoring && !hasPermission(role, "createBlog")) {
    return "forbidden";
  }

  return "ok";
}
