import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    GitHub({
      authorization: {
        params: {
          scope: "read:user public_repo",
        },
      },
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          login: profile.login,
        };
      },
    }),
  ],
  events: {
    async signIn({ user, profile }) {
      const login =
        profile && "login" in profile
          ? String((profile as { login?: string }).login ?? "")
          : "";

      if (!user.id || !login) return;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          login,
          name: user.name ?? login,
          image: user.image,
        },
      });
    },
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.login =
          (user as { login?: string | null }).login ??
          session.user.name ??
          null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  trustHost: true,
});
