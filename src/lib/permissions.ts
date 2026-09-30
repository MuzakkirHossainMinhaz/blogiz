// Role-based permissions system
export type UserRole = "superadmin" | "admin" | "author" | "user";

export interface Permission {
  can: {
    // Blog permissions
    createBlog: boolean;
    editOwnBlog: boolean;
    editAnyBlog: boolean;
    deleteOwnBlog: boolean;
    deleteAnyBlog: boolean;
    approveBlog: boolean;
    rejectBlog: boolean;

    // Comment permissions
    createComment: boolean;
    editOwnComment: boolean;
    editAnyComment: boolean;
    deleteOwnComment: boolean;
    deleteAnyComment: boolean;
    approveComment: boolean;
    rejectComment: boolean;

    // User permissions
    viewUsers: boolean;
    editOwnProfile: boolean;
    editAnyProfile: boolean;
    approveUser: boolean;
    deactivateUser: boolean;
    changeUserRole: boolean;

    // Dashboard permissions
    viewDashboard: boolean;
    viewAdminDashboard: boolean;
    viewSuperAdminDashboard: boolean;

    // Site content
    manageBanners: boolean;
  };
}

export const rolePermissions: Record<UserRole, Permission> = {
  superadmin: {
    can: {
      // Blog permissions
      createBlog: true,
      editOwnBlog: true,
      editAnyBlog: true,
      deleteOwnBlog: true,
      deleteAnyBlog: true,
      approveBlog: true,
      rejectBlog: true,

      // Comment permissions
      createComment: true,
      editOwnComment: true,
      editAnyComment: true,
      deleteOwnComment: true,
      deleteAnyComment: true,
      approveComment: true,
      rejectComment: true,

      // User permissions
      viewUsers: true,
      editOwnProfile: true,
      editAnyProfile: true,
      approveUser: true,
      deactivateUser: true,
      changeUserRole: true,

      // Dashboard permissions
      viewDashboard: true,
      viewAdminDashboard: true,
      viewSuperAdminDashboard: true,

      manageBanners: true,
    },
  },

  admin: {
    can: {
      // Blog permissions
      createBlog: true,
      editOwnBlog: true,
      editAnyBlog: false,
      deleteOwnBlog: true,
      deleteAnyBlog: false,
      approveBlog: true,
      rejectBlog: true,

      // Comment permissions
      createComment: true,
      editOwnComment: true,
      editAnyComment: false,
      deleteOwnComment: true,
      deleteAnyComment: false,
      approveComment: true,
      rejectComment: true,

      // User permissions
      viewUsers: true,
      editOwnProfile: true,
      editAnyProfile: false,
      approveUser: true,
      deactivateUser: false,
      changeUserRole: false,

      // Dashboard permissions
      viewDashboard: true,
      viewAdminDashboard: true,
      viewSuperAdminDashboard: false,

      manageBanners: true,
    },
  },

  author: {
    can: {
      // Blog permissions
      createBlog: true,
      editOwnBlog: true,
      editAnyBlog: false,
      deleteOwnBlog: true,
      deleteAnyBlog: false,
      approveBlog: false,
      rejectBlog: false,

      // Comment permissions
      createComment: true,
      editOwnComment: true,
      editAnyComment: false,
      deleteOwnComment: true,
      deleteAnyComment: false,
      approveComment: false,
      rejectComment: false,

      // User permissions
      viewUsers: false,
      editOwnProfile: true,
      editAnyProfile: false,
      approveUser: false,
      deactivateUser: false,
      changeUserRole: false,

      // Dashboard permissions
      viewDashboard: true,
      viewAdminDashboard: false,
      viewSuperAdminDashboard: false,

      manageBanners: false,
    },
  },

  user: {
    can: {
      // Blog permissions
      createBlog: false,
      editOwnBlog: false,
      editAnyBlog: false,
      deleteOwnBlog: false,
      deleteAnyBlog: false,
      approveBlog: false,
      rejectBlog: false,

      // Comment permissions
      createComment: true,
      editOwnComment: true,
      editAnyComment: false,
      deleteOwnComment: true,
      deleteAnyComment: false,
      approveComment: false,
      rejectComment: false,

      // User permissions
      viewUsers: false,
      editOwnProfile: true,
      editAnyProfile: false,
      approveUser: false,
      deactivateUser: false,
      changeUserRole: false,

      // Dashboard permissions — readers get a simple account dashboard
      viewDashboard: true,
      viewAdminDashboard: false,
      viewSuperAdminDashboard: false,

      manageBanners: false,
    },
  },
};

// Helper function to check if a user has a specific permission
export function hasPermission(userRole: UserRole, permission: keyof Permission["can"]): boolean {
  return rolePermissions[userRole]?.can[permission] || false;
}

// Helper function to check if a user can perform an action on a resource
export function canPerformAction(
  userRole: UserRole,
  action: keyof Permission["can"],
  resourceOwnerId?: string,
  currentUserId?: string
): boolean {
  const basePermission = hasPermission(userRole, action);

  // If it's an "own" action, check if user owns the resource
  if (action.includes("Own") && resourceOwnerId && currentUserId) {
    return basePermission && resourceOwnerId === currentUserId;
  }

  // If it's an "any" action, just check the base permission
  if (action.includes("Any")) {
    return basePermission;
  }

  return basePermission;
}

// Role hierarchy for role-based access
export const roleHierarchy: Record<UserRole, number> = {
  superadmin: 4,
  admin: 3,
  author: 2,
  user: 1,
};

// Check if a user has higher or equal role than another
export function hasHigherOrEqualRole(userRole: UserRole, targetRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[targetRole];
}

/** True only when the actor outranks the target. Equal roles cannot manage each other. */
export function canManageRole(actor: UserRole, target: UserRole): boolean {
  return roleHierarchy[actor] > roleHierarchy[target];
}

const USER_ROLES: UserRole[] = ["superadmin", "admin", "author", "user"];

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
