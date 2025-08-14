import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@bmad-aigrowise/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
	providers: [
		Credentials({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) return null;
				const user = await prisma.user.findUnique({ where: { email: credentials.email } });
				if (!user) return null;
				const ok = await bcrypt.compare(credentials.password, user.passwordHash);
				if (!ok) return null;
				return { id: user.id, name: user.name ?? user.email, email: user.email, role: user.role } as any;
			},
		}),
	],
	session: { strategy: "jwt" },
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.role = (user as any).role ?? token.role;
			}
			// refresh from DB on subsequent calls
			if (!user && token.email) {
				const dbUser = await prisma.user.findUnique({ where: { email: token.email as string }, select: { role: true } });
				if (dbUser) token.role = dbUser.role;
			}
			return token;
		},
		async session({ session, token }) {
			(session.user as any).role = token.role;
			return session;
		},
	},
	pages: { signIn: "/login" },
	secret: process.env.NEXTAUTH_SECRET,
};
