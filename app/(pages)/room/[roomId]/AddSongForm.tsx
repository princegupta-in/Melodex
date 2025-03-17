'use client';

import React, { useState } from 'react';
import axios from 'axios';

interface AddSongFormProps {
    roomId: string;
    onSongAdded: () => void;
}

export default function AddSongForm({ roomId, onSongAdded }: AddSongFormProps) {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');

    const handleAddSong = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post(`/api/rooms/${roomId}/streams`, { url });
            setUrl('');
            onSongAdded();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error adding song');
        }
    };

    return (
        <form onSubmit={handleAddSong} className="flex items-center space-x-2 mt-4">
            <input
                type="text"
                placeholder="Enter YouTube URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="border p-2 rounded w-full"
            />
            <button type="submit" className="bg-green-500 text-white p-2 rounded">
                Add Song
            </button>
            {error && <p className="text-red-500">{error}</p>}
        </form>
    );
}
