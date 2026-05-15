import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email:     { label: "Email",             type: "email" },
        mecNumber: { label: "Número Mecânico",   type: "text"  },
        password:  { label: "Palavra-passe",     type: "password" },
      },
      async authorize(credentials) {
        const password = credentials?.password as string | undefined;
        const email    = credentials?.email    as string | undefined;
        const mecNumber = credentials?.mecNumber as string | undefined;

        if (!password || password.length < 6) return null;

        let user;
        if (email) {
          const parsed = z.string().email().safeParse(email);
          if (!parsed.success) return null;
          user = await prisma.user.findUnique({ where: { email } });
        } else if (mecNumber) {
          if (!mecNumber.trim()) return null;
          user = await prisma.user.findUnique({ where: { mecNumber } });
        } else {
          return null;
        }

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name,
          role: user.role,
          mecNumber: user.mecNumber ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
        token.mecNumber = (user as { mecNumber?: string }).mecNumber;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const u = session.user as { role?: string; id?: string; mecNumber?: string };
        u.role = token.role as string;
        u.id = token.id as string;
        u.mecNumber = token.mecNumber as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
