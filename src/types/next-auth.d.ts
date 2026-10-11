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
      emailVerified?: boolean;
      commentSuspended?: boolean;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    sessionVersion?: number;
    avatar?: string | null;
    commentSuspended?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    sessionVersion?: number;
    emailVerified?: boolean;
    avatar?: string;
    commentSuspended?: boolean;
    invalid?: boolean;
  }
}
