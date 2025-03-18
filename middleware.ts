import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Main middleware function
export default withAuth(
    (req) => {
        const { pathname } = req.nextUrl;
        // If a token exists (user is authenticated) and they try to access sign-in or sign-up pages, redirect them
        if ((pathname === "/sign-in" || pathname === "/sign-up") && req.nextauth.token) {
            return NextResponse.redirect(new URL("/", req.url));
        }
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl;

                // Allow public API and authentication routes
                if (
                    pathname.startsWith("/api/auth") ||
                    pathname === "/" ||
                    pathname.startsWith("/room") || // room pages are public for guests
                    pathname.startsWith("/public") ||
                    pathname.startsWith("/sign-in") ||
                    pathname.startsWith("/sign-up")
                ) {
                    return true;
                }

                // For any other route, require a token
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        // Apply to all routes except for static files
        "/((?!_next/static|_next/image|favicon.ico|public/).*)",
    ],
};
