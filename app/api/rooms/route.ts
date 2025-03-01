// app/api/rooms/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions';
import { prisma } from "@/lib/connectToDatabase";


export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "You must be logged in" }, { status: 401 });
    }
    // if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name } = body

    // Use session.user.id (or email) as the creator identifier.
    const userId = session.user.id

    const room = await prisma.room.create({
      data: {
        name,
        creatorId: userId,
        participants: {
          create: {
            userId,
            role: 'CREATOR',
          },
        },
      },
      include: {
        participants: true,
      },
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
