import { NextResponse } from 'next/server';
import { prisma } from '@/lib/connectToDatabase';

export async function GET(
    request: Request,
    { params }: { params: { roomId: string  } }
) {
    try {
        const { roomId } = await params

        const room = await prisma.room.findUnique({
            where: { id: roomId },
        });
        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }
        return NextResponse.json({ room }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
