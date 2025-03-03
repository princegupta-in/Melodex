"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { ThumbsUp } from "lucide-react"

// Types
interface Song {
    id: string
    title: string
    thumbnailUrl: string
    youtubeId: string
    upvotes: number
}

interface Participant {
    id: string
    name: string
    avatarUrl?: string
}

export default function MusicRoomPage() {
    // Room ID would typically come from URL params or props
    const roomId = "example-room-123"

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

    // Fetch songs and participants on component mount
    useEffect(() => {
        fetchSongs()
        fetchParticipants()
    }, [])

    // Fetch songs from API
    const fetchSongs = async () => {
        setLoading((prev) => ({ ...prev, songs: true }))
        setError(null)

        try {
            const response = await axios.get(`/api/rooms/${roomId}/songs`)
            const songs = response.data.songs || []

            if (songs.length > 0) {
                // Set the first song as current song if none is playing
                if (!currentSong) {
                    setCurrentSong(songs[0])
                    setSongQueue(songs.slice(1))
                } else {
                    setSongQueue(songs.filter((song: Song) => song.id !== currentSong.id))
                }
            }
        } catch (err) {
            setError("Failed to load songs. Please try again later.")
            // Use placeholder data for demo purposes
            const placeholderSongs: Song[] = [
                {
                    id: "1",
                    title: "Rick Astley - Never Gonna Give You Up",
                    thumbnailUrl: "/placeholder.svg?height=90&width=120",
                    youtubeId: "dQw4w9WgXcQ",
                    upvotes: 15,
                },
                {
                    id: "2",
                    title: "Toto - Africa",
                    thumbnailUrl: "/placeholder.svg?height=90&width=120",
                    youtubeId: "FTQbiNvZqaY",
                    upvotes: 12,
                },
                {
                    id: "3",
                    title: "Queen - Bohemian Rhapsody",
                    thumbnailUrl: "/placeholder.svg?height=90&width=120",
                    youtubeId: "fJ9rUzIMcZQ",
                    upvotes: 10,
                },
                {
                    id: "4",
                    title: "Daft Punk - Get Lucky",
                    thumbnailUrl: "/placeholder.svg?height=90&width=120",
                    youtubeId: "5NV6Rdv1a3I",
                    upvotes: 8,
                },
            ]

            setCurrentSong(placeholderSongs[0])
            setSongQueue(placeholderSongs.slice(1))
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
            // Use placeholder data for demo purposes
            setParticipants([
                { id: "1", name: "Jane Doe", avatarUrl: "/placeholder.svg?height=50&width=50" },
                { id: "2", name: "John Smith", avatarUrl: "/placeholder.svg?height=50&width=50" },
                { id: "3", name: "Alex Johnson", avatarUrl: "/placeholder.svg?height=50&width=50" },
                { id: "4", name: "Sam Wilson", avatarUrl: "/placeholder.svg?height=50&width=50" },
                { id: "5", name: "Taylor Brown", avatarUrl: "/placeholder.svg?height=50&width=50" },
                { id: "6", name: "Jordan Lee", avatarUrl: "/placeholder.svg?height=50&width=50" },
            ])
        } finally {
            setLoading((prev) => ({ ...prev, participants: false }))
        }
    }

    // Handle adding a new song
    const handleAddSong = async () => {
        if (!newSongUrl.trim()) return

        try {
            // Extract YouTube ID from URL (simplified example)
            const youtubeId = newSongUrl.includes("v=") ? newSongUrl.split("v=")[1].split("&")[0] : newSongUrl

            await axios.post(`/api/rooms/${roomId}/songs`, {
                youtubeUrl: newSongUrl,
            })

            // Optimistically update UI
            const newSong: Song = {
                id: Date.now().toString(), // Temporary ID
                title: "New Song Added", // Placeholder title
                thumbnailUrl: `/placeholder.svg?height=90&width=120`,
                youtubeId,
                upvotes: 0,
            }

            setSongQueue((prev) => [...prev, newSong])
            setNewSongUrl("")

            // Refresh song list to get actual data
            fetchSongs()
        } catch (err) {
            setError("Failed to add song. Please try again.")
        }
    }

    // Handle upvoting a song
    const handleUpvote = async (songId: string) => {
        try {
            await axios.post(`/api/rooms/${roomId}/songs/${songId}/upvote`)

            // Optimistically update UI
            setSongQueue((prev) => prev.map((song) => (song.id === songId ? { ...song, upvotes: song.upvotes + 1 } : song)))
        } catch (err) {
            setError("Failed to upvote. Please try again.")
        }
    }

    return (
        <div className="flex h-screen bg-background">
            {/* Left Column - Player and Queue */}
            <div className="w-1/2 flex flex-col p-4 border-r border-border">
                {/* YouTube Player */}
                <div className="w-full aspect-video bg-muted mb-4 rounded-md overflow-hidden">
                    {currentSong && (
                        <iframe
                            src={`https://www.youtube.com/embed/${currentSong.youtubeId}?autoplay=1`}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    )}
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
                                <li key={song.id} className="flex items-center p-3 bg-card rounded-md shadow-sm">
                                    <img
                                        src={song.thumbnailUrl || "/placeholder.svg"}
                                        alt={song.title}
                                        className="w-20 h-14 object-cover rounded mr-3"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{song.title}</p>
                                    </div>
                                    <div className="flex items-center ml-4">
                                        <button
                                            onClick={() => handleUpvote(song.id)}
                                            className="flex items-center gap-1 px-2 py-1 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                                        >
                                            <ThumbsUp className="w-4 h-4" />
                                            <span>{song.upvotes}</span>
                                        </button>
                                    </div>
                                </li>
                            ))}

                            {songQueue.length === 0 && !loading.songs && (
                                <p className="text-muted-foreground">No songs in queue. Add one!</p>
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

