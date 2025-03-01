import { prisma } from "@/lib/connectToDatabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";


const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)/;
const spotifyRegex = /^(https?:\/\/)?(open\.spotify\.com\/(track|playlist|album|artist)|spotify:)/;

const urlSchema = z.union([
    z.string().regex(youtubeRegex, "Invalid YouTube URL"),
    z.string().regex(spotifyRegex, "Invalid Spotify URL"),
]);

//do a zod schema validation here
const validRequestSchema = z.object({
    userId: z.string().nonempty(),
    url: urlSchema,
});

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Function to extract video ID
function extractYouTubeId(url: string): string | null {
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.hostname.includes("youtube.com")) {
            return parsedUrl.searchParams.get("v");
        }
        if (parsedUrl.hostname.includes("youtu.be")) {
            return parsedUrl.pathname.substring(1);
        }
    } catch (error) {
        console.error("Invalid YouTube URL:", error);
    }
    return null;
}

// Function to fetch video details from YouTube API
async function fetchYouTubeDetails(videoId: string) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
        throw new Error("Invalid YouTube video ID or video not found");
    }

    const video = data.items[0].snippet;
    return {
        title: video.title,
        thumbnail: video.thumbnails.high.url,
    };
}

// API Route
export async function POST(req: NextRequest) {
    try {
        const e = validRequestSchema.safeParse(await req.json());
        if (!e.success) {
            console.error(e.error.errors);
            return NextResponse.json({ message: "Invalid request" }, { status: 400 });
        }

        const videoId = extractYouTubeId(e.data.url);

        if (!videoId) {
            return NextResponse.json({ message: "Could not extract YouTube video ID" }, { status: 400 });
        }

        // Fetch video details from YouTube API
        const { title, thumbnail } = await fetchYouTubeDetails(videoId);

        //create stream
        await prisma.stream.create({
            data: {
                userId: e.data.userId,
                url: e.data.url,
                extractedId: videoId,
                type: "Youtube",
                title,
                thumbnail,
                roomId: "xxxx",
            }
        });
        return NextResponse.json({ message: "Music added successfully", title, thumbnail, }, { status: 200 });


    } catch (error) {
        //@ts-ignore
        console.error("❌", error.stack);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });

    }
}

//get all streams
export async function GET(req: NextRequest) {
    const creatorId = req.nextUrl.searchParams.get('creatorId')
    try {
        const streams = await prisma.stream.findMany({
            where: {
                userId: creatorId ?? "",
            },
        });
        return NextResponse.json({ streams }, { status: 200 });
    } catch (error) {
        console.error("❌", error);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}