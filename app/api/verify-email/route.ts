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
        const user = await prisma.user.findFirst({
            where: {
                email,
                verificationCode,
                isVerified: false,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid verification code or email" },
                { status: 400 }
            );
        }

        // Update the user to mark as verified and optionally clear the verification code
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationCode: null,
            },
        });

        return NextResponse.json(
            { message: "Email verified successfully!", user: updatedUser },
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
