"use client"

import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";


export default function JoinRoom() {

    const router = useRouter();
    const { roomId } = useParams();
    // console.log("🤖",roomId);

    const [guestName, setGuestName] = useState('');
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [roomData, setRoomData] = useState({ id: "", name: "", creatorId: "" });

    const session = useSession();
    // console.log("🤖", session.data.user);
    useEffect(() => {
        if (session.data?.user) {
            router.push(`/room/${roomId}`);
        }
    }, [session, router, roomId]);

    //if user is authenticated or guest id is already stored in local storage, then redirect to room page
    useEffect(() => {
        // Check if a participantId is already stored in local storage
        const storedParticipantData = localStorage.getItem('participantData');
        if (storedParticipantData) {
            const { id } = JSON.parse(storedParticipantData);
            setParticipantId(id);
        }
    }, [roomId]);

    // /room/[roomId]/join client side
    useEffect(() => {
        //can also use to display msg like join room created by user...
        axios.get(`/api/rooms/${roomId}`)
            .then(res => {
                // console.log(res.data);
                setRoomData(res.data.room);
            })
            .catch(err => {
                console.error("Error fetching room data:", err);
            });
    }, [roomId]);

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Clear any previous error
        try {
            const res = await axios.post(`/api/rooms/${roomId}/join`, { name: guestName });
            const participant = res.data.participant;
            // Save participant Data to local storage
            //Since localStorage only supports strings, you need to use JSON.stringify() when saving objects and JSON.parse() when retrieving them.
            localStorage.setItem('participantData', JSON.stringify({ id: participant.id, name: participant.name }));
            setParticipantId(participant.id);
            // Redirect to the new room's page
            router.push(`/room/${roomId}`);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        }
    };

    return (
        <div className="relative h-full w-full bg-slate-950">
            <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>
            <div className="absolute bottom-0 right-[-20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>
            <main className="min-h-screen bg-gradient-to-br pt-10 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="min-w-full mt-12 mb-8 text-center bg-white/10 backdrop-blur-sm p-8 rounded-lg flex flex-col items-center">
                    <p className="text-white text-lg max-w-2xl">
                        {/* enter your name to join the room: {roomData.name} */}
                        enter your name to join the room:
                    </p>
                    <p className="text-white text-lg mt-2">Create & share your Melodex Room now:</p>

                    {/* Create Form */}
                    <form onSubmit={handleJoinRoom} className="flex items-stretch">
                        {/* Prefix Label */}
                        <span className="inline-flex items-center px-3 text-gray-500 border border-r-0 border-gray-300 bg-gray-50 rounded-l">
                            melodex.in/
                        </span>
                        <input
                            type="text"
                            className="border border-gray-300 rounded-r-none px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 w-64"
                            placeholder="Enter your name"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="bg-green-500 text-white font-semibold px-5 py-2 rounded-r hover:bg-green-600 transition-colors uppercase"
                        >
                            Enter your name
                        </button>
                    </form>
                    {error && <p className="text-red-500 mt-2">{error}</p>}
                </div>
            </main>
        </div>
    );
}
