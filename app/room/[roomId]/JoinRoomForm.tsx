'use client';
//thought process is that this is a client component that allows a guest to join the room by entering their name. it will call /api/rooms/[roomId]/join endpoint. when successful, it stores the returned participantId in local storage so it can be used later matlab for upvoting.

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface JoinRoomFormProps {
  roomId: string;
}

export default function JoinRoomForm({ roomId }: JoinRoomFormProps) {
  const [name, setName] = useState('');
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if a participantId is already stored in local storage
    const storedParticipantId = localStorage.getItem('participantId');
    if (storedParticipantId) {
      setParticipantId(storedParticipantId);
    }
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`/api/rooms/${roomId}/join`, { name });
      const participant = res.data.participant;
      // Save participant ID to local storage
      localStorage.setItem('participantId', participant.id);
      setParticipantId(participant.id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error joining room');
    }
  };

  if (participantId) {
    return (
      <p className="mt-4 text-green-600">
        You have joined this room (Guest ID: {participantId})
      </p>
    );
  }

  return (
    <form onSubmit={handleJoin} className="flex flex-col space-y-2 mt-4">
      <input
        type="text"
        placeholder="Enter your name"
        className="border p-2 rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        Join Room
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
