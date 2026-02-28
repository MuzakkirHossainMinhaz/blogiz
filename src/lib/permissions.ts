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

      // Dashboard permissions
      viewDashboard: false,
      viewAdminDashboard: false,
      viewSuperAdminDashboard: false,
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
