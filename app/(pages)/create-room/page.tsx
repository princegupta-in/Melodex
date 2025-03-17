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
        <div className="relative h-full w-full">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]"><div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#C9EBFF,transparent)]"></div></div>
            <main className="min-h-screen bg-gradient-to-br pt-10  flex flex-col items-center justify-center p-4 relative overflow-hidden">

                <div className="min-w-full mt-8 mb-4 text-center bg-black/10 backdrop-blur-sm p-2 rounded-lg flex flex-col items-center py-10">
                    <p className="text-black text-xl max-w-4xl">
                        Welcome to Melodex – your 😍 collaborative music hub! Create or join rooms, share YouTube tracks, and 🎛️ control the playlist with real-time upvotes. Enjoy synchronized playback with friends, whether you're signing in or joining as a guest! ❤️
                    </p>
                    <p className="text-black text-lg mt-2">Create & share your Melodex Room now:</p>

                    {/* Create Form */}
                    <form onSubmit={handleCreateRoom} className="flex items-stretch">
                        {/* Prefix Label */}
                        <span className="flex items-end px-20 py-5 text-black/80 border border-r-0 border-gray-300 bg-gray-50 rounded-l text-2xl">
                            melodex.tech/
                        </span>
                        <input
                            type="text"
                            className="border border-gray-300 rounded-r-none px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 w-64"
                            placeholder="Enter Room Name"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                        />
                        <button
                            type="submit"
                            className=" text-white font-semibold px-5 py-2 rounded-r  transition-colors uppercase  bg-gradient-to-r from-black to-blue-500 hover:from-black hover:to-blue-600"
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

