import { prisma } from "@/lib/connectToDatabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";


const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)/;
const spotifyRegex = /^(https?:\/\/)?(open\.spotify\.com\/(track|playlist|album|artist)|spotify:)/;

const urlSchema = z.string().regex(youtubeRegex, "Invalid YouTube or Spotify URL").or(
    z.string().regex(spotifyRegex, "Invalid YouTube or Spotify URL")
);

//do a zod schema validation here
const validRequestSchema = z.object({
    userId: z.string().nonempty(),
    url: urlSchema,
});

export async function POST(req: NextRequest) {

    const e = validRequestSchema.safeParse(await req.json());
    try {
        if (!e.success) {
            console.error(e.error.errors);
            return NextResponse.json({ message: "Invalid request" }, { status: 400 });
        }

        //create stream
        prisma.stream.create({
            data: {
                userId: e.data.userId,
                url: e.data.url,
                extractedId: e.data.url.split("?v=")[1],
                type: "Youtube"
            }
        });


    } catch (error) {
        console.error("❌", error);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });

    }
}