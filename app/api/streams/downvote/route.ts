import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/connectToDatabase";
import { getServerSession } from "next-auth";


// Zod Schema for validating downvote request
const downvoteSchema = z.object({
    streamId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
    const session = await getServerSession();

    if (!session?.user?.id) {
        return NextResponse.json({ message: "You must be logged in to downvote a stream" }, { status: 401 });
    }
    try {
        // Validate request body
        const e = downvoteSchema.parse(await req.json());


        // Check if user have upvote on this stream or not
        const existingUpvote = await prisma.upvote.findUnique({
            where: {
                userId_streamId: {
                    userId: session.user.id,
                    streamId: e.streamId
                }
            }, // Unique constraint lookup
        });

        if (!existingUpvote) {
            return NextResponse.json({ message: "Do upvote first" }, { status: 400 });
        }

        // delete the upvote
        const downvote = await prisma.upvote.delete({
            where: {
                userId_streamId: {
                    userId: session.user.id,
                    streamId: e.streamId,
                }
            }
        });

        return NextResponse.json({ message: "Stream downvoted successfully" }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input" }, { status: 200 });
        }
        console.error("Error downvoting stream:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 200 });
    }
}
