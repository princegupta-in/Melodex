"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { ThumbsUp } from "lucide-react"
import { useParams } from 'next/navigation';
import YouTube from 'react-youtube';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MediaControl from "./MediaControl";
import { useSocket } from "@/lib/socket/SocketContext";

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
    duration: number
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
    const params = useParams();
    const { roomId } = params;
    const session = useSession();
    const router = useRouter();
    const socket = useSocket();

    const [currentSong, setCurrentSong] = useState<Song | null>(null)
    const [songQueue, setSongQueue] = useState<Song[]>([])
    const [participants, setParticipants] = useState<Participant[]>([])
    const [newSongUrl, setNewSongUrl] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isCreator, setIsCreator] = useState(false)
    const [loading, setLoading] = useState({
        songs: false,
        participants: false,
    })

    // State for YouTube player controls
    const [player, setPlayer] = useState<any>(null);
    const [playing, setPlaying] = useState(false);
    const [syncTime, setSyncTime] = useState(0);

    // Check if the user is joined (for guests, check localStorage; authenticated users are auto-joined)
    useEffect(() => {
        const storedParticipantData = localStorage.getItem('participantData')
        if (!session.data?.user && !storedParticipantData) {
            router.push(`/room/${roomId}/join`)
        } if (session.data?.user) {
            setIsCreator(true)
        }
    }, [session]);

    // Fetch songs and participants on component mount
    useEffect(() => {
        fetchSongs()
        fetchParticipants()
    }, [])

    // [SOCKET] SOCKET.IO INTEGRATION: Conditional joinRoom and event listeners
    useEffect(() => {
        if (!socket) return;

        // Retrieve stored participant data from localStorage
        const storedParticipantData = (localStorage.getItem("participantData"));
        const participant = storedParticipantData ? JSON.parse(storedParticipantData) : null;
        console.log("🍭", participant)

        if (session.data?.user) {
            socket.emit("joinRoom", roomId);
        }
        else if (participant?.id) {
            socket.emit("joinRoom", roomId);
            socket.emit("participantJoined", { roomId, id: participant.id, name: participant.name, avatarUrl: "" });
        }
        const handleParticipantJoined = (data: any) => {
            if (data.roomId === roomId) {
                console.log("Socket event - participantJoined:", data);
                // Avoid duplicates by checking if the participant already exists
                setParticipants(prev => {
                    if (!prev.find((p) => p.id === data?.id)) {
                        return [...prev, { id: data.id, name: data.name, roomId: data.roomId, role: "SUBCREATOR", userId: null, avatarUrl: data.avatarUrl }];
                    }
                    return prev;
                });
            }
        };

        // Define event handler for new songs added via socket
        const handleSongAdded = (data: any) => {
            if (data.roomId === roomId) {
                setSongQueue(prev => {
                    return [...prev, data.song.stream]
                });
                setCurrentSong((prev) => prev ?? data.song.stream);
            }
        };

        const handleVoteUpdated = (data: any) => {
            console.log("Socket event - voteUpdated:", data);
            if (data.roomId === roomId) {
                setSongQueue((prev) => {
                    // Replace upvotes for the matching song
                    const newQueue = prev.map((song) =>
                        song.id === data.streamId
                            ? { ...song, upvotes: data.upvotes }
                            : song
                    );
                    // Optionally re-sort by upvote count
                    newQueue.sort((a, b) => b.upvotes.length - a.upvotes.length);
                    return newQueue;
                });
            }
        };

        const handleCurrentSongChanged = (data: any) => {
            if (data.roomId === roomId) {
                console.log("Socket event - currentSongChanged:", data);
                setCurrentSong(data.currentSong);
            }
        };

        // Register socket event listeners
        socket.on("songAdded", handleSongAdded);
        socket.on("voteUpdated", handleVoteUpdated);
        socket.on("participantJoined", handleParticipantJoined);
        socket.on("currentSongChanged", handleCurrentSongChanged);

        // Cleanup function to remove listeners on unmount or dependency change
        return () => {
            console.log("Cleaning up socket event listeners for MusicRoomPage");
            socket.off("songAdded", handleSongAdded);
            socket.off("voteUpdated", handleVoteUpdated);
            socket.off("participantJoined", handleParticipantJoined);
            socket.off("currentSongChanged", handleCurrentSongChanged);
        };
    }, [socket, roomId, session]);

    useEffect(() => {
        if (!socket) return;

        const handlePlaybackUpdate = (data: any) => {
            if (data.roomId === roomId && !isCreator && player) {
                console.log("Received playback update:", data);
                if (data.state === "pause") {
                    player.pauseVideo();
                    setPlaying(false); // Update guest UI state to "paused"
                } else if (data.state === "play") {
                    player.playVideo();
                    setPlaying(true); // Update guest UI state to "playing"
                } else if (data.state === "seek") {
                    player.seekTo(data.currentTime, true);
                }
            }
        };

        socket.on("playbackUpdate", handlePlaybackUpdate);
        return () => {
            socket.off("playbackUpdate", handlePlaybackUpdate);
        };
    }, [socket, roomId, isCreator, player]);

    useEffect(() => {
        if (!socket) return;

        const handlePlaybackUpdate = (data: any) => {
            if (data.roomId === roomId && !isCreator) {
                setSyncTime(data.currentTime);
                if (player) {
                    player.seekTo(data.currentTime, true);
                }
            }
        };

        socket.on("playbackUpdate", handlePlaybackUpdate);
        return () => {
            socket.off("playbackUpdate", handlePlaybackUpdate);
        };
    }, [socket, roomId, isCreator, player]);

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
            const response = await axios.post(`/api/rooms/${roomId}/streams`, {
                url: newSongUrl,
            })
            setNewSongUrl("")
            // Emit the new song event with the new song data
            socket?.emit("newSong", { roomId, song: response.data });
            // Refresh song list to get actual data
            // fetchSongs()
        } catch (err) {
            setError("Failed to add song. Please try again.")
        }
    }

    // Handle upvoting a song with optimistic UI update and reordering queue
    const handleUpvote = async (songId: string) => {
        console.log("Upvoting song with ID:", songId)
        try {
            let res;
            // Check if user is authenticated or guest
            if (session.data?.user) {
                // Authenticated user: no extra payload needed
                res = await axios.post(`/api/rooms/${roomId}/streams/${songId}/vote`)
            } else {
                // Guest: get participantId from local storage
                const storedParticipantData = localStorage.getItem('participantData')
                if (storedParticipantData) {
                    const participantData = JSON.parse(storedParticipantData);
                    res = await axios.post(`/api/rooms/${roomId}/streams/${songId}/vote`, {
                        participantData
                    })
                }
            }
            // Emit the vote update event after upvoting
            socket?.emit("voteUpdate", { roomId, streamId: songId, upvotes: res?.data.upvotes });
            // After toggling vote, refresh song list to update vote counts and ordering
            // fetchSongs()
        } catch (err) {
            console.error(err)
            setError("Failed to upvote. Please try again.")
            // fetchSongs()
        }
    }
    const handleSongEnd = () => {
        // console.log("Current song ended!🤘🤘");
        // When current song finishes, remove it and set the next song.
        if (songQueue.length > 0) {
            const nextSong = songQueue[0];
            setCurrentSong(nextSong);
            setSongQueue(songQueue.slice(1));
            // Optionally, emit a socket event to notify all clients about the change.
            // socket?.emit("currentSongChanged", { roomId, currentSong: nextSong });
        } else {
            // No more songs in queue.
            setCurrentSong(null);
        }
    };
    const handlePlayerStateChange = (event: any) => {
        // Player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), etc.
        if (event.data === 1) { // Playing
            setPlaying(true);
        } else if (event.data === 2) { // Paused
            setPlaying(false);
        }
        // Optionally, update current time if needed:
        // setCurrentTime(player.getCurrentTime());
    };

    const handleForwardSong = () => {
        if (songQueue.length > 0) {
            const nextSong = songQueue[0];
            setCurrentSong(nextSong);
            setSongQueue(songQueue.slice(1));
            // Emit a socket event to update all clients
            socket?.emit("currentSongChanged", { roomId, currentSong: nextSong });
        } else {
            // if no song left,can set currentSong to null or do nothing
            setCurrentSong(null);
        }
    };

    return (

        <div>
            <div className="flex h-screen pt-20 pb-16">
                {/* Left Column - Player and Queue */}
                <div className="w-1/2 flex flex-col p-4 border-r border-gray-200">
                    {/* YouTube Player */}
                    <div className="w-full h-1/3 mb-4 rounded-md overflow-hidden flex items-center border-2 px-2">
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
                                onEnd={handleSongEnd}
                                onReady={(e) => setPlayer(e.target)}
                                onStateChange={handlePlayerStateChange}  // <--- Added this line
                            />
                        )}
                        <div className="pl-2 flex flex-col h-full pt-4">
                            <h2 className="text-xl font-bold mb-4">Now Playing</h2>
                            <p className="text-muted-foreground">{currentSong?.title || "No song playing"}</p>
                        </div>
                    </div>

                    {/* Song Queue */}
                    <div className="flex-1 overflow-y-auto border-2 px-4 rounded-md">
                        <h2 className="text-xl font-bold mb-4 text-white pt-1">Up Next</h2>

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
                    <div className="h-1/3 mb-4 border-2 px-4 py-2 rounded-md">
                        <h2 className="text-xl font-bold mb-4 text-white">Add a Song</h2>
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
                    <div className="flex-1 overflow-y-auto border-2 px-4 rounded-md">
                        <h2 className="text-xl font-bold mb-4 text-white pt-1">Room Participants</h2>

                        {loading.participants ? (
                            <p>Loading participants...</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto ">
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
            {/* media control */}
            <div className="fixed bottom-0 left-0 right-0 z-50">
                {/* Pass the player instance to MediaControl */}
                <MediaControl player={player} videoDuration={currentSong?.duration || 0} isCreator={isCreator} roomId={roomId as string} playing={playing} videoId={currentSong?.extractedId || ""} onForwardSong={handleForwardSong} syncTime={syncTime} />
            </div>
        </div>
    )
}
