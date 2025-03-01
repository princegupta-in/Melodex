//room joining by authencated user and guests
//No authentication is required here since guests can join
//A new RoomParticipant record is created.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/connectToDatabase';
import { z } from 'zod';

const joinSchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

export async function POST(
    request: Request,
    { params }: { params: { roomId: string } }
) {
    try {
        const body = await request.json();
        const { name } = joinSchema.parse(body);

        // Create a new RoomParticipant record for the joining user/guest
        const participant = await prisma.roomParticipant.create({
            data: {
                name,
                roomId: params.roomId,
            },
        });
        return NextResponse.json({ message: `welcome ${name}!!`, participant }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.errors || error.message }, { status: 400 });
    }
}
