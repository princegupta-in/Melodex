import { NextResponse } from 'next/server';
import { prisma } from '@/lib/connectToDatabase';

export async function GET(
    request: Request,
    { params }: { params: { roomId: string } }
) {
    const { roomId } = await params;
    try {
        const participants = await prisma.roomParticipant.findMany({
            where: { roomId: roomId },
        });
        return NextResponse.json({ participants }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
