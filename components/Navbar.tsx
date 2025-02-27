"use client"
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Music, Menu } from "lucide-react";
import { Session } from 'next-auth';
import { getSession, signIn, signOut } from 'next-auth/react'
import React, { useEffect, useState } from 'react'



export function Navbar() {

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const sessionData = await getSession();
      setSession(sessionData);
      // console.log("🚀", sessionData)
    };
    fetchSession();
  }, []);

  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full bg-black/50 backdrop-blur-lg shadow-md z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <motion.div
          className="flex items-center gap-2 text-white text-xl font-bold"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Music className="text-purple-400" /> Melodex
        </motion.div>

        <div className="hidden md:flex items-center gap-6 text-white text-lg">
          <a href="#features" className="hover:text-purple-400 transition">Features</a>
          <a href="#pricing" className="hover:text-purple-400 transition">Pricing</a>
          <a href="#about" className="hover:text-purple-400 transition">About</a>
          <div>
            {!session?.user && <button className='p-2' onClick={() => signIn()}>signin</button>}
            {session?.user && <button className='p-2' onClick={() => signOut()}>logout</button>}
          </div>
        </div>

        <div className="md:hidden">
        <div>
            {!session?.user && <button className='p-2' onClick={() => signIn()}>signin</button>}
            {session?.user && <button className='p-2' onClick={() => signOut()}>logout</button>}
          </div>
        </div>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-black/80 text-white p-4 flex flex-col space-y-4 items-center"
        >
          <a href="#features" className="hover:text-purple-400 transition">Features</a>
          <a href="#pricing" className="hover:text-purple-400 transition">Pricing</a>
          <a href="#about" className="hover:text-purple-400 transition">About</a>
          <div>
            {!session?.user && <button className='p-2' onClick={() => signIn()}>signin</button>}
            {session?.user && <button className='p-2' onClick={() => signOut()}>logout</button>}
          </div>
        </motion.div>
      )}
    </nav>
  );
}
