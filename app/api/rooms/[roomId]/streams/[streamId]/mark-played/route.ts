import { NextResponse } from "next/server";
import { prisma } from "@/lib/connectToDatabase";

export async function PATCH(request: Request, { params }: { params: Promise<{ roomId: string; streamId: string }> }): Promise<NextResponse> {
  const { streamId } = await params

  try {
    const updatedSong = await prisma.stream.update({
      where: { id: streamId },
      data: { played: true },
    });
    return NextResponse.json({ message: "Song marked as played", song: updatedSong }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
