"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { ThumbsUp } from "lucide-react"
import { useParams } from 'next/navigation';
import YouTube from 'react-youtube';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";



// Types
interface Song {
    id: string
    title: string
    thumbnail: string
    extractedId: string
    upvotes: up[],
    type: string,
    active: boolean,
    userId: null | string,
    url: string,
    roomId: string,
}
interface up {
    id: string,
    value: number,
    userId: null | string,
    participantId: string,
    streamId: string
}

interface Participant {
    id: string
    name: string
    roomId: string
    role: "CREATOR" | "SUBCREATOR"
    userId: null | string
    avatarUrl: string
}

export default function MusicRoomPage() {
    // Room ID would typically come from URL params or props
    const params = useParams();
    const { roomId } = params;
    const session = useSession();
    const router = useRouter();



    //get all the streams of that particular room
    // useEffect(()=>{
    //     axios.get(`/api/rooms/${roomId}/streams`)
    //     .then((streams)=>{
    //         console.log(res.data)
    //     })
    // },[])    // const roomId = "example-room-123"

    // State
    const [currentSong, setCurrentSong] = useState<Song | null>(null)
    const [songQueue, setSongQueue] = useState<Song[]>([])
    const [participants, setParticipants] = useState<Participant[]>([])
    const [newSongUrl, setNewSongUrl] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState({
        songs: false,
        participants: false,
    })

    // State for YouTube player controls
    const [player, setPlayer] = useState<any>(null);
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(50);
    //prince

    // Check if the user is joined (for guests, check localStorage; authenticated users are auto-joined)
    useEffect(() => {
        const storedParticipantId = localStorage.getItem('participantId');
        if (!session.data?.user && !storedParticipantId) {
            router.push(`/room/${roomId}/join`)
        }
    }, [session]);

    // Fetch songs and participants on component mount
    useEffect(() => {
        fetchSongs()
        fetchParticipants()
    }, [])

    // Fetch songs from API
    const fetchSongs = async () => {
        setLoading((prev) => ({ ...prev, songs: true })) //keep all of prev and mark song loading true
        setError(null)

        try {
            const response = await axios.get(`/api/rooms/${roomId}/streams`)
            const songs = response.data.streams || []

            // If songs exist, set the first song as current (if none is playing)
            if (songs.length > 0) {
                if (!currentSong) {
                    setCurrentSong(songs[0])
                    setSongQueue(songs.slice(1))
                } else {
                    // Exclude currentSong from the queue
                    setSongQueue(songs.filter((song: Song) => song.id !== currentSong.id))
                }
            }
        } catch (err) {
            setError("Failed to load songs. Please try again later.")
        } finally {
            setLoading((prev) => ({ ...prev, songs: false }))
        }
    }

    // Fetch participants from API
    const fetchParticipants = async () => {
        setLoading((prev) => ({ ...prev, participants: true }))

        try {
            const response = await axios.get(`/api/rooms/${roomId}/participants`)
            setParticipants(response.data.participants || [])
        } catch (err) {
            console.error(err)
            setError("Failed to load participants. Please try again later.")
        } finally {
            setLoading((prev) => ({ ...prev, participants: false }))
        }
    }

    // Handle adding a new song
    const handleAddSong = async () => {
        if (!newSongUrl.trim()) return

        try {
            await axios.post(`/api/rooms/${roomId}/streams`, {
                url: newSongUrl,
            })

            setNewSongUrl("")

            // Refresh song list to get actual data
            fetchSongs()
        } catch (err) {
            setError("Failed to add song. Please try again.")
        }
    }

    // Handle upvoting a song with optimistic UI update and reordering queue
    const handleUpvote = async (songId: string) => {
        console.log("Upvoting song with ID:", songId)
        try {
            // Check if user is authenticated or guest
            if (session.data?.user) {
                // Authenticated user: no extra payload needed
                await axios.post(`/api/rooms/${roomId}/streams/${songId}/vote`)
            } else {
                // Guest: get participantId from local storage
                const storedParticipantId = localStorage.getItem('participantId')
                await axios.post(`/api/rooms/${roomId}/streams/${songId}/vote`, {
                    participantId: storedParticipantId,
                })
            }
            // After toggling vote, refresh song list to update vote counts and ordering
            fetchSongs()
        } catch (err) {
            console.error(err)
            setError("Failed to upvote. Please try again.")
            fetchSongs()
        }
    }

    return (
        <div className="flex h-screen bg-background pt-20">
            {/* Left Column - Player and Queue */}
            <div className="w-1/2 flex flex-col p-4 border-r border-gray-200 bg-orange-400">
                {/* YouTube Player */}
                <div className="w-full h-1/3 bg-red-600 mb-4 rounded-md overflow-hidden flex items-center">
                    {currentSong && (
                        <YouTube
                            videoId={currentSong.extractedId}
                            opts={{
                                height: "100%",
                                width: '100%',
                                playerVars: {
                                    autoplay: 1,
                                    controls: 0,
                                    modestbranding: 1,          //remove the YouTube logo
                                    rel: 0,                     //disable related videos at the end
                                    fs: 1,
                                    iv_load_policy: 3,
                                    // loop:0,
                                    // playlist: currentSong.extractedId,
                                },
                            }}
                        />
                    )}
                    <div className="pl-2 flex flex-col h-full pt-4">
                        <h2 className="text-xl font-bold mb-4">Now Playing</h2>
                        <p className="text-muted-foreground">{currentSong?.title || "No song playing"}</p>
                    </div>
                </div>

                {/* Song Queue */}
                <div className="flex-1 overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Up Next</h2>

                    {error && <p className="text-red-500 mb-4">{error}</p>}

                    {loading.songs ? (
                        <p>Loading songs...</p>
                    ) : (
                        <ul className="space-y-3">
                            {songQueue.map((song) => (
                                <li key={song.id} className="flex items-center p-3 bg-white rounded-md shadow-sm">
                                    <img
                                        src={song.thumbnail || "/placeholder.svg"}
                                        alt={song.title}
                                        className="w-20 h-14 object-cover rounded mr-3"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{song.title}</p>
                                    </div>
                                    <div className="flex items-center ml-4">
                                        <button
                                            onClick={() => handleUpvote(song.id)}
                                            className="flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                                        >
                                            <ThumbsUp className="w-4 h-4" />
                                            <span>{song.upvotes.length}</span>
                                        </button>
                                    </div>
                                </li>
                            ))}

                            {songQueue.length === 0 && !loading.songs && (
                                <p className="text-gray-500">No songs in queue. Add one!</p>
                            )}
                        </ul>
                    )}
                </div>
            </div>


            {/* Right Column - Add Song and Participants */}
            <div className="w-1/2 flex flex-col p-4">
                {/* Add Song Section */}
                <div className="flex-1 mb-4">
                    <h2 className="text-xl font-bold mb-4">Add a Song</h2>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newSongUrl}
                            onChange={(e) => setNewSongUrl(e.target.value)}
                            placeholder="Paste YouTube URL here"
                            className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                            onClick={handleAddSong}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                            Add Song
                        </button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Paste a YouTube video URL to add it to the queue. The community can upvote songs to change their order.
                    </p>
                </div>

                {/* Participants Section */}
                <div className="flex-1 overflow-hidden">
                    <h2 className="text-xl font-bold mb-4">Room Participants</h2>

                    {loading.participants ? (
                        <p>Loading participants...</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[calc(50vh-8rem)]">
                            {participants.map((participant) => (
                                <div key={participant.id} className="flex items-center p-3 bg-card rounded-md shadow-sm">
                                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                                        {participant.avatarUrl ? (
                                            <img
                                                src={participant.avatarUrl || "/placeholder.svg"}
                                                alt={participant.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                {participant.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <span className="truncate">{participant.name}</span>
                                </div>
                            ))}

                            {participants.length === 0 && !loading.participants && (
                                <p className="text-muted-foreground col-span-3">No participants yet.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

