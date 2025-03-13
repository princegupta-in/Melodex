import { NextResponse } from "next/server";
import { prisma } from "@/lib/connectToDatabase";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { z } from "zod";

// Define the expected input schema
const signupSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters long"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});

export async function POST(request: Request) {
    try {
        // Parse and validate the request body
        const body = await request.json();
        const result = signupSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.flatten().fieldErrors },
                { status: 400 }
            );
        }
        const { username, email, password } = result.data;

        // Check if username is already taken
        const existingUser = await prisma.user.findFirst({
            where: {
                email: email,
                isVerified: true,
            },
        });
        // console.log("😶‍🌫️", existingUser)
        if (existingUser) {
            return NextResponse.json(
                { error: "Username already exists" },
                { status: 400 }
            );
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

        // Create the new user in the database
        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                verificationCode,
                isVerified: false,
                provider: "Melodex"
            },
        });

        // Set up nodemailer transport (example using Gmail)
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Prepare email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify your email",
            text: `Enter this temporary verification code to continue : ${verificationCode}`,
        };

        // Send the verification email
        await transporter.sendMail(mailOptions);

        return NextResponse.json(
            { message: "Signup successful! Please check your email to verify your account.", user: newUser },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
