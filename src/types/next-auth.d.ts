import type { UserRole } from "@/lib/permissions";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      email?: string | null;
      name?: string | null;
      avatar?: string | null;
      isApproved?: boolean;
      emailVerified?: boolean;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    sessionVersion?: number;
    isApproved?: boolean;
    avatar?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    sessionVersion?: number;
    isApproved?: boolean;
    emailVerified?: boolean;
    avatar?: string;
    invalid?: boolean;
  }
}
