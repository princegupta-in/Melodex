"use client"

import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";

export default function JoinRoom() {
    const router = useRouter();
    const { roomId } = useParams();

    const [guestName, setGuestName] = useState('');
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [roomData, setRoomData] = useState<{ id: string; name: string; creatorId: string; createdAt?: string } | null>(null);
    const [isCreator, setIsCreator] = useState(false);

    const session = useSession();

    // Effect to fetch room details
    useEffect(() => {
        if (!roomId) return;
        axios.get(`/api/rooms/${roomId}`)
            .then(res => {
                // Assuming API returns { room: { ... } }
                setRoomData(res.data.room);
            })
            .catch(err => {
                setError("Failed to load room details");
            });
    }, [roomId]);

    // Effect to check if the authenticated user is the room creator
    useEffect(() => {
        if (session.data?.user && roomData) {
            if (session.data.user.id === roomData.creatorId) {
                setIsCreator(true);
                router.push(`/room/${roomId}`);
            } else {
                setIsCreator(false);
            }
        }
    }, [session, roomData, roomId, router]);

    // Effect to retrieve participant data from local storage
    useEffect(() => {
        const storedParticipantData = localStorage.getItem('participantData');
        if (storedParticipantData) {
            const { id, name } = JSON.parse(storedParticipantData);
            if (name) {
                handleJoinRoomWithName(name);
            }
        }
    }, [roomId]);

    // Helper function to join room with provided name
    const handleJoinRoomWithName = async (name: string) => {
        setError('');
        try {
            // Check if participant data already exists in local storage(to stop creating double entries on every /join req)
            const storedParticipantData = localStorage.getItem('participantData');
            if (storedParticipantData) {
                const { id, name: storedName } = JSON.parse(storedParticipantData);
                if (id && storedName === name) {
                    // If participant already exists, navigate to the room
                    setParticipantId(id);
                    router.push(`/room/${roomId}`);
                    return;
                }
            }

            // If no valid participant data, proceed with API call
            const res = await axios.post(`/api/rooms/${roomId}/join`, { name });
            const participant = res.data.participant;
            localStorage.setItem('participantData', JSON.stringify({ id: participant.id, name: participant.name }));
            setParticipantId(participant.id);
            router.push(`/room/${roomId}`);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        }
    };

    // Form submit handler (if user needs to enter name manually)
    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        handleJoinRoomWithName(guestName);
    };

    return (
        <div className="relative h-full w-full">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
                <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#C9EBFF,transparent)]"></div>
            </div>
            <main className="min-h-screen bg-gradient-to-br pt-10  flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="min-w-full mt-8 mb-4 text-center bg-black/10 backdrop-blur-sm p-2 rounded-lg flex flex-col items-center py-10">
                    <p className="text-black/80 text-lg max-w-2xl">
                        {/* enter your name to join the room: {roomData.name} */}
                        Enter Your Name to Join The Room:
                    </p>
                    <p className="text-black/80 text-lg mt-2">Create & share your Melodex Room now:</p>

                    {/* Render join form only if the user is not the creator */}
                    {(!session.data?.user || (session.data?.user && !isCreator)) && (
                        <form onSubmit={handleJoinRoom} className="flex items-stretch">
                            {/* Prefix Label */}
                            <span className="flex items-end px-20 py-5 text-black/80 border border-r-0 border-gray-300 bg-gray-50 rounded-l text-2xl">
                                Your Name:
                            </span>
                            <input
                                type="text"
                                className="border border-gray-300 rounded-r-none px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 w-64"
                                placeholder="Enter Your Name"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                            />
                            <button
                                type="submit"
                                className=" text-white font-semibold px-5 py-2 rounded-r  transition-colors uppercase  bg-gradient-to-r from-black to-blue-500 hover:from-black hover:to-blue-600"
                            >
                                Join
                            </button>
                        </form>
                    )}

                    {error && <p className="text-red-500 mt-2">{error}</p>}
                </div>
            </main>
        </div>
    );
}
