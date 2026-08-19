import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      login: string | null;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    login?: string | null;
  }
}
