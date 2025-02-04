import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/connectToDatabase";
import { getServerSession } from "next-auth";


// Zod Schema for validating upvote request
const upvoteSchema = z.object({
    streamId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
    const session = await getServerSession();

    if (!session?.user?.id) {
        return NextResponse.json({ message: "You must be logged in to upvote a stream" }, { status: 401 });
    }
    try {
        // Validate request body
        const e = upvoteSchema.parse(await req.json());


        // Check if user already upvoted this stream
        const existingUpvote = await prisma.upvote.findUnique({
            where: {
                userId_streamId: {
                    userId: session.user.id,
                    streamId: e.streamId
                }
            }, // Unique constraint lookup
        });

        if (existingUpvote) {
            return NextResponse.json({ message: "You have already upvoted this stream" }, { status: 400 });
        }

        // Create a new upvote
        const upvote = await prisma.upvote.create({
            data: {
                userId: session.user.id,
                streamId: e.streamId,
            }
        });

        return NextResponse.json({ message: "Stream upvoted successfully" }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input" }, { status: 200 });
        }
        console.error("Error upvoting stream:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 200 });
    }
}
