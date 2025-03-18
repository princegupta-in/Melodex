import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions';
import { prisma } from "@/lib/connectToDatabase";
import { z } from 'zod';

// Define the input schema for room creation using Zod
const roomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
});

export async function POST(request: Request) {
  // Get the current session
  const session = await getServerSession(authOptions);
  console.log("🔥from /api/rooms", session);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    // Validate input data with Zod
    const e = roomSchema.safeParse(body);
    if (!e.success) {
      console.error(e.error.errors);
      return NextResponse.json({ message: "Invalid room name" }, { status: 400 });
    }

    // Create the room in the database with the current user as the creator
    const room = await prisma.room.create({
      data: {
        name: e.data.name,
        creatorId: session.user.id,
      },
    });
    //add this creator of room as a participant
    await prisma.roomParticipant.create({
      data: {
        name: session.user.name ?? session.user.username!,
        roomId: room.id,
        userId: session.user.id,
        role: "CREATOR"
      },
    });
    return NextResponse.json({ room, message: "room created" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.errors || error.message }, { status: 400 });
  }
}
