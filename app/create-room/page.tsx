"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function CreateRoomPage() {
    const router = useRouter();
    const [roomName, setRoomName] = useState('');
    const [error, setError] = useState('');

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Clear any previous error
        try {
            const response = await axios.post('/api/rooms', { name: roomName });
            const roomData = response.data.room;
            // Redirect to the new room's page
            router.push(`/room/${roomData.id}`);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        }
    };


    return (
        <div className="relative h-full w-full bg-slate-950"><div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div><div className="absolute bottom-0 right-[-20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>
            <main className="min-h-screen bg-gradient-to-br pt-10  flex flex-col items-center justify-center p-4 relative overflow-hidden">

                <div className="min-w-full mt-12 mb-8 text-center bg-white/10 backdrop-blur-sm p-8 rounded-lg flex flex-col items-center">
                    <p className="text-white text-lg max-w-2xl">
                        Melodex is a social media player that lets you share music across limitless people, devices and speakers,
                        whether they're in the same room or halfway across the world.
                    </p>
                    <p className="text-white text-lg mt-2">Create & share your Melodex Room now:</p>

                    {/* Create Form */}
                    <form onSubmit={handleCreateRoom} className="flex items-stretch">
                        {/* Prefix Label */}
                        <span className="inline-flex items-center px-3 text-gray-500 border border-r-0 border-gray-300 bg-gray-50 rounded-l">
                            melodex.in/
                        </span>
                        <input
                            type="text"
                            className="border border-gray-300 rounded-r-none px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 w-64"
                            placeholder="enter room name"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="bg-green-500 text-white font-semibold px-5 py-2 rounded-r hover:bg-green-600 transition-colors uppercase"
                        >
                            Create
                        </button>
                    </form>
                    {error && <p className="text-red-500 mt-2">{error}</p>}
                </div>
            </main>
        </div>
    )
}

