"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";

// Zod schema for verification code
const verificationSchema = z.object({
    code: z.string().min(6, "Verification code is required"),
});

export default function VerifyEmailPage() {
    const params = useParams();
    const { email } = params;
    const decodedEmail = decodeURIComponent(email as string); // => "ppp@gmail.com"

    const [verificationCode, setVerificationCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [resendTimer, setResendTimer] = useState(0); // Countdown timer in seconds

    // Start a 5-minute timer when component mounts to prevent immediate resend
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prevTimer) => prevTimer - 1);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [resendTimer]);

    // Format the remaining time as MM:SS
    const formatRemainingTime = () => {
        const minutes = Math.floor(resendTimer / 60);
        const seconds = resendTimer % 60;
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const result = verificationSchema.safeParse({ code: verificationCode });
        if (!result.success) {
            setError(result.error.errors[0].message);
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post("/api/verify-email", {
                email: decodedEmail,
                verificationCode,
            });

            if (response.status === 200) {
                setIsSuccess(true);
            } else {
                setError("Verification failed");
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendEmail = async () => {
        try {
            // RESEND LOGIC TO BE IMPLEMENTED HERE
            alert("Verification email resent!");

            // Start 5-minute countdown (300 seconds)
            setResendTimer(300);
        } catch (err) {
            console.error("Error resending email:", err);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen px-4">
                <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
                    <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#C9EBFF,transparent)]"></div>
                </div>
                <div className="w-full max-w-md p-8 space-y-8 text-center bg-white rounded-lg shadow-sm">
                    <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-8 h-8 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Email Verified!</h1>
                    <p className="text-gray-600">Your email has been successfully verified.</p>
                    <Link
                        href="/sign-in"
                        className="inline-block w-full px-4 py-3 mt-4 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        Continue to SignIn
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
                <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#C9EBFF,transparent)]"></div>
            </div>
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-sm">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-8 h-8 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                    <h1 className="mt-4 text-2xl font-bold text-gray-900">Check your inbox</h1>
                    <p className="mt-2 text-gray-600">
                        Enter the verification code we just sent to <br />
                        {decodedEmail}.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                            Code
                        </label>
                        <input
                            id="code"
                            name="code"
                            type="text"
                            value={verificationCode} // use verificationCode state here
                            onChange={(e) => setVerificationCode(e.target.value)}
                            required
                            className="block w-full px-3 py-3 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter verification code"
                        />
                        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex justify-center w-full px-4 py-3 text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {isLoading ? "Verifying..." : "Continue"}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    {resendTimer > 0 ? (
                        <div className="text-gray-500">
                            Resend available in {formatRemainingTime()}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={handleResendEmail}
                            className="text-blue-600 hover:text-blue-500"
                        >
                            Resend email
                        </button>
                    )}
                </div>

                <div className="flex justify-center space-x-4 text-sm text-gray-500">
                    <Link href="#" className="hover:text-blue-600">
                        Terms of Use
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="#" className="hover:text-blue-600">
                        Privacy Policy
                    </Link>
                </div>
            </div>
        </div>
    );
}
