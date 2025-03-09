"use client"
import React from "react"
import { SessionProvider } from "next-auth/react"
import { SocketProvider } from "@/lib/socket/SocketContext";

export const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <SessionProvider>
            <SocketProvider>
                {children}
            </SocketProvider>
        </SessionProvider>
    )
}