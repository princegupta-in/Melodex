"use client"
import { Session } from 'next-auth';
import { getSession, signIn, signOut } from 'next-auth/react'
import React, { useEffect, useState } from 'react'

const AppBar = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const sessionData = await getSession();
      setSession(sessionData);
      // console.log("🚀", sessionData)
    };
    fetchSession();
  }, []); return (
    <div className='flex justify-between items-center p-4 bg-purple-700'>
      <div className='text-white p-4'>
        melodex
      </div>
      <div>
        {!session?.user && <button className='p-2' onClick={() => signIn()}>signin</button>}
        {session?.user && <button className='p-2' onClick={() => signOut()}>logout</button>}

      </div>
    </div>
  )
}

export default AppBar
