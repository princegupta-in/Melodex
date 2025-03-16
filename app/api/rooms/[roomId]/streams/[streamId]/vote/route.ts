import { NextResponse } from 'next/server';
import { prisma } from "@/lib/connectToDatabase";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

// For guest votes, require a participantId (if no session is available)
const guestVoteSchema = z.object({
    participantData: z.object({
        id: z.string().min(1),
        name: z.string().min(1),
    })
});

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string, streamId: string }> }): Promise<NextResponse> {
    // Attempt to get session for authenticated users.
    const session = await getServerSession(authOptions);
    const { roomId, streamId } = await params

    let identifierField: 'userId' | 'participantId';
    let identifierValue: string;

    if (session && session.user) {
        // Authenticated user: use their ID
        identifierField = 'userId';
        identifierValue = session.user.id;
    } else {
        // For guests, we expect a participantId in the request body.
        const body = await request.json();
        const e = guestVoteSchema.safeParse(body);
        if (!e.success) {
            return NextResponse.json({ error: e.error.flatten().fieldErrors }, { status: 400 });
        }
        identifierField = 'participantId';
        identifierValue = e.data.participantData.id;
        // console.log("👋👋",identifierValue)
    }

    // Check if an upvote already exists for this identifier and stream.
    try {
        let existingVote;
        if (identifierField === 'userId') {
            existingVote = await prisma.upvote.findUnique({
                where: {
                    userId_streamId: {
                        userId: identifierValue,
                        streamId: streamId,
                    },
                },
            });
        } else {
            existingVote = await prisma.upvote.findUnique({
                where: {
                    participantId_streamId: {
                        participantId: identifierValue!,
                        streamId: streamId,
                    },
                },
            });
        }

        if (existingVote) {
            // Vote exists: remove it (toggle off)
            await prisma.upvote.delete({ where: { id: existingVote.id } });// Fetch the updated upvotes after deletion
            const updatedUpvotes = await prisma.upvote.findMany({
                where: { streamId },
            });
            return NextResponse.json({ upvotes: updatedUpvotes, message: 'Upvote removed' }, { status: 200 });
        } else {
            // No vote exists: create one (toggle on)
            const voteData: any = {
                streamId: streamId,
                value: 1,
            };
            voteData[identifierField] = identifierValue;
            const newVote = await prisma.upvote.create({ data: voteData });
            // Fetch the updated upvotes after creation
            const updatedUpvotes = await prisma.upvote.findMany({
                where: { streamId },
            });
            // return NextResponse.json({ newVote, message: "Upvote added" }, { status: 200 });
            return NextResponse.json({ upvotes: updatedUpvotes, message: "Upvote added" }, { status: 200 });
        }
    } catch (error) {
        //@ts-ignore
        console.error(error.stack);
        //@ts-ignore
        return NextResponse.json({ error: error.message }, { status: 500 });

    }
}
