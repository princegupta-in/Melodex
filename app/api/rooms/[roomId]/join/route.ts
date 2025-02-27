//This endpoint allows a user to join a room as a participant. The authenticated user is automatically registered as a SUBCREATOR.
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/connectToDatabase'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'

export async function POST(request: Request, { params }: { params: { roomId: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const userId = session.user.id

        // Ensure the room exists.
        const room = await prisma.room.findUnique({
            where: { id: params.roomId },
        })
        if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

        // Create participant record, handling duplicate entry gracefully.
        const participant = await prisma.roomParticipant.upsert({
            where: {
                roomId_userId: {
                    roomId: params.roomId,
                    userId,
                },
            },
            update: {},
            create: {
                roomId: params.roomId,
                userId,
                role: 'SUBCREATOR',
            },
        })

        return NextResponse.json(participant, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
