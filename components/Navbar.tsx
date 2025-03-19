"use client"
import { motion } from 'framer-motion';
import { Disc3, Linkedin, Github } from "lucide-react";
import { Session } from 'next-auth';
import { getSession, signIn, signOut } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import Link from 'next/link';

export function Navbar() {

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const sessionData = await getSession();
      setSession(sessionData);
    };
    fetchSession();
  }, []);

  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full bg-gradient-to-br from-white via-blue-100 to-white backdrop-blur-lg shadow-md z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <motion.div
          className="flex items-center gap-2 text-white text-xl font-bold"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link href="/" className="flex items-center gap-2">

            <Disc3 className="text-blue-600" /> <p className='text-black/80'>Melodex</p>
          </Link>
        </motion.div>

        <div className="hidden md:flex items-center gap-6 text-white text-lg">
          {/* <a href="#features" className="text-black hover:text-blue-400 transition">Features</a> */}
          <a
            href="https://github.com/princegupta-in/melodex"
            target="_blank"
            rel="github url"
            className="inline-flex"
          >
            <Github
              className="h-6 w-6  text-black transition-colors hover:text-blue-600 hover:cursor-pointer  dark:hover:text-neutral-400"
              strokeWidth={1.5}
            />
          </a>
          <a
            href="https://linkedin.com/in/princegupta-in"
            target="_blank"
            rel="github url"
            className="inline-flex"
          >
            <Linkedin
              className="h-6 w-6 text-black transition-colors hover:text-blue-600 hover:cursor-pointer dark:text-neutral-200 dark:hover:text-neutral-400"
              strokeWidth={1.5}
            /></a>
          <div>
            {!session?.user && <button className='p-2 text-black transition-colors hover:text-blue-600 border-b-2' onClick={() => signIn()}>signin</button>}
            {session?.user && <button className='p-2 text-black transition-colors hover:text-blue-600 border-b-2' onClick={() => signOut()}>logout</button>}
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
          <a
            href="https://github.com/princegupta-in/melodex"
            target="_blank"
            rel="github url"
            className="inline-flex"
          >
            <Github
              className="h-6 w-6  text-black transition-colors hover:text-blue-600 hover:cursor-pointer  dark:hover:text-neutral-400"
              strokeWidth={1.5}
            />
          </a>
          <a
            href="https://linkedin.com/in/princegupta-in"
            target="_blank"
            rel="github url"
            className="inline-flex"
          >
            <Linkedin
              className="h-6 w-6 text-black transition-colors hover:text-blue-600 hover:cursor-pointer dark:text-neutral-200 dark:hover:text-neutral-400"
              strokeWidth={1.5}
            /></a>
          <div>
            {!session?.user && <button className='p-2 text-black transition-colors hover:text-blue-600 border-b-2' onClick={() => signIn()}>signin</button>}
            {session?.user && <button className='p-2 text-black transition-colors hover:text-blue-600 border-b-2' onClick={() => signOut()}>logout</button>}
          </div>
        </motion.div>
      )}
    </nav>
  );
}
