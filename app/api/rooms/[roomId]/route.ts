import { NextResponse } from 'next/server'
import { prisma } from "@/lib/connectToDatabase";
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions';

export async function GET(request: Request, { params }: { params: { roomId: string } }) {
    try {
        // Optionally, check auth if you want to restrict access
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ message: "You must be logged in" }, { status: 401 });
        }

        const room = await prisma.room.findUnique({
            where: { id: params.roomId },
            include: {
                participants: {
                    include: {
                        user: true,
                    },
                },
                streams: true,
            },
        })

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        }

        return NextResponse.json(room)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
