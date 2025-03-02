// this file is an async server component that fetches room details from the api, then it renders the room details along with client components for joining the room and displaying the stream list
"use client"
import React,{useState} from 'react';
import { notFound } from 'next/navigation';
import axios from 'axios';
import JoinRoomForm from './JoinRoomForm';
import StreamList from './StreamList';
import InviteLink from './InviteLink';
import AddSongForm from './AddSongForm';

// Using axios to fetch room data on the server side
async function getRoomData(roomId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await axios.get(`${baseUrl}/api/rooms/${roomId}`);
    // console.log("❌❌", res.data);
    return res.data;
  } catch (error) {
    console.error('Error fetching room data:', error);
    return null;
  }
}

export default async function RoomPage({ params }: { params: { roomId: string } }) {
  const { roomId } = await params;
  const roomData = await getRoomData(roomId);

  if (!roomData) {
    notFound();
  }

  return (
    <div className="pt-80">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Room: {roomData.name}</h1>
          <p>Room ID: {roomData.id}</p>
        </div>
        <InviteLink roomId={roomId} />
      </header>
      {/* If the user is a guest and hasn't joined yet, display the join form */}
      <JoinRoomForm roomId={roomId} />
      {/* Form to add a new song */}
      <AddSongFormWrapper roomId={roomId} />
      {/* Display the song queue */}
      <StreamList roomId={roomId} />
      {/* Optionally, add a YouTube player here in the future */}
    </div>
  );
}

// Client component wrapper for AddSongForm
function AddSongFormWrapper({ roomId }: { roomId: string }) {
  const [songs, setSongs] = useState([]);

  const onSongAdded = () => {
    // Logic to handle song added
    // For example, you can fetch the updated song list and update the state
    //@ts-ignore
    setSongs([...songs, {}]); // Update with actual song data
  };

  return <AddSongForm roomId={roomId} onSongAdded={onSongAdded} />;
}
