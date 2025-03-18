import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./connectToDatabase";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";


export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
        }),

        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text", placeholder: "prince@gmail.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                const user = await prisma.user.findUnique({
                    where: { email: credentials?.email }
                });
                if (!user) {
                    throw new Error("Provided email/username does not exist");
                } else {
                    // Verify the password
                    const isValidPassword = await bcrypt.compare(credentials!.password, user.password!);
                    if (isValidPassword) {
                        console.log("🌸🌸", user)
                        // Any object returned will be saved in `user` property of the JWT
                        return { ...user, username: user.username ?? undefined };
                    } else {
                        throw new Error("Incorrect Password");
                    }
                }
            }
        })
    ],
    callbacks: {
        async session({ session, token }) {
            session.user.id = token.id as string
            if (token.username) {
                session.user.username = token.username as string
            }
            return session
        },
        async jwt({ token, user, account }) {
            if (account?.provider === "google") {
                if (user) {
                    token.id = user.id
                }
            }
            if (account?.provider === "credentials") {
                if (user) {
                    token.id = user.id
                    token.username = user.username
                }
            }
            return token
        },

        async signIn({ user, account }) {
            //only run for google provider to store data
            if (account?.provider === "google") {
                const { email, name, image, id } = user;
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
            }
            return true; // Allow sign in
        },
    },
    pages: {
        signIn: "/sign-in",
        error: "/sign-in"
    },
    session: {
        strategy: "jwt",
        maxAge: 10 * 24 * 60 * 60,
    },
    // secret: process.env.NEXTAUTH_SECRET
}
