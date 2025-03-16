import { prisma } from "@/lib/connectToDatabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';


const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)/;
const spotifyRegex = /^(https?:\/\/)?(open\.spotify\.com\/(track|playlist|album|artist)|spotify:)/;

const urlSchema = z.union([
    z.string().regex(youtubeRegex, "Invalid YouTube URL"),
    z.string().regex(spotifyRegex, "Invalid Spotify URL"),
]);

//do a zod schema validation here
const validRequestSchema = z.object({
    // userId: z.string().nonempty(),
    url: urlSchema,
});

//if the user is creater of the room, i.e. the user is authenticated
//get the user id from the session

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
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
        throw new Error("Invalid YouTube video ID or video not found");
    }

    const video = data.items[0].snippet;
    const videoContentDetails = data.items[0].contentDetails;
    const durationInSeconds = parseISO8601Duration(videoContentDetails.duration);

    return {
        title: video.title,
        thumbnail: video.thumbnails.high.url,
        duration: durationInSeconds
    };
}

//Function to convert the duration string into seconds(Convert the ISO 8601 Duration to Seconds)
function parseISO8601Duration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);
    return hours * 3600 + minutes * 60 + seconds;
}


// API Route
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const { roomId } = await params;

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
        const { title, thumbnail, duration } = await fetchYouTubeDetails(videoId);
        // console.log("Video details⚡⚡:", title, thumbnail, duration);

        //create stream
        const stream = await prisma.stream.create({
            data: {
                userId: session?.user.id || null,//will be null for guests
                url: e.data.url,
                extractedId: videoId,
                type: "Youtube",
                title,
                thumbnail,
                roomId,
                duration,
            },
            include: {
                upvotes: true, // this will return an empty array if no upvotes exist yet
            },
        });
        return NextResponse.json({ message: "Music added successfully", title, thumbnail, duration, stream }, { status: 200 });


    } catch (error) {
        //@ts-ignore
        console.error("❌", error.stack);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });

    }
}

export async function GET(request: Request, { params }: { params: Promise<{ roomId: string }> }): Promise<NextResponse> {
    try {
        const { roomId } = await params;
        const streams = await prisma.stream.findMany({
            where: { roomId: roomId },
            orderBy: [
                {
                    upvotes: {
                        _count: 'desc', // streams with the most upvotes come first
                    },
                },
                {
                    createdAt: 'asc', // if upvotes are equal, fcfs
                },
            ],
            include: {
                upvotes: true, // optional: include upvotes if want to display vote details
            },
        });
        return NextResponse.json({ streams }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, message: "An error occurred" }, { status: 500 });
    }
}