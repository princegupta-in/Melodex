import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google";


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
        }
    },
    // pages: {
    //     signIn: "/login",
    //     error: "/login"
    // },
    // session: {
    //     strategy: "jwt",
    //     maxAge: 30 * 24 * 60 * 60,
    // // },
    // secret: process.env.NEXTAUTH_SECRET
}
