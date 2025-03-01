import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./connectToDatabase";


export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
        })
    ],
    callbacks: {
        async session({ session, token }) {
            session.user.id = token.id as string

            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },

        async signIn({ user }) {
            const { email, name, image,id } = user;
            // console.log("🌸🌸",user)

            if (!email) return false; // Ensure email is present

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });// If user does not exist, create a new record
            if (!existingUser) {
                await prisma.user.create({
                    data: {
                        email,
                        id,
                        provider: "Google",
                    },
                });
            }

            return true; // Allow sign in
        },
    },
    // pages: {
    //     signIn: "/login",
    //     error: "/login"
    // },
    session: {
        strategy: "jwt",
        maxAge: 10 * 24 * 60 * 60,
    },
    // secret: process.env.NEXTAUTH_SECRET
}
