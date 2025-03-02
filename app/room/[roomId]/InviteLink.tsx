'use client';

import React from 'react';

export default function InviteLink({ roomId }: { roomId: string }) {
    const handleCopy = () => {
        const inviteUrl = window.location.origin + `/room/${roomId}`;
        navigator.clipboard.writeText(inviteUrl)
            .then(() => alert('Invite link copied to clipboard!'))
            .catch(() => alert('Failed to copy invite link.'));
    };

    return (
        <button onClick={handleCopy} className="bg-blue-500 text-white p-2 rounded">
            Copy Invite Link
        </button>
    );
}
