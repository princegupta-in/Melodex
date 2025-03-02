'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Stream {
    id: string;
    title: string;
    url: string;
    // You can include vote count and other fields as needed.
}

interface StreamListProps {
    roomId: string;
}

export default function StreamList({ roomId }: StreamListProps) {
    const [streams, setStreams] = useState<Stream[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStreams = async () => {
        try {
            const res = await axios.get(`/api/rooms/${roomId}/streams`);
            setStreams(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error fetching streams');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStreams();
    }, [roomId]);

    if (loading) return <p>Loading streams...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="mt-4">
            <h2 className="text-xl font-bold">Song Queue</h2>
            {streams.length === 0 ? (
                <p>No songs added yet.</p>
            ) : (
                <ul>
                    {streams.map((stream) => (
                        <li key={stream.id} className="border p-2 my-2">
                            <strong>{stream.title}</strong>
                            <p>{stream.url}</p>
                            {/* Here, you can integrate an upvote button and show vote counts */}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
