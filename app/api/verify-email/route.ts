import { NextResponse } from "next/server";
import { prisma } from "@/lib/connectToDatabase";
import { z } from "zod";

// Define the expected input schema for verification
const verifySchema = z.object({
    email: z.string().email("Invalid email address"),
    verificationCode: z.string().length(6, "Verification code must be 6 digits"),
});

export async function POST(request: Request) {
    try {
        // Parse and validate the request body
        const body = await request.json();
        const parsed = verifySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }
        const { email, verificationCode } = parsed.data;

        // Find a user with the provided email, verificationCode, and not verified yet
        const tempUser = await prisma.tempUser.findFirst({
            where: {
                email,
                verificationCode,
                isVerified: false,
            },
        });

        if (!tempUser) {
            return NextResponse.json(
                { error: "Invalid verification code or email" },
                { status: 400 }
            );
        }

        // creating the newUser in permanent user table
        const user = await prisma.user.create({
            data: {
                id: tempUser.id,
                email: tempUser.email,
                provider: tempUser.provider,
                username: tempUser.username,
                password: tempUser.password,
            },
        });

        return NextResponse.json(
            { message: "Email verified successfully!", user },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Email verification error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
