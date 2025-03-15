"use client"
import React from "react"
import { SessionProvider } from "next-auth/react"
import { SocketProvider } from "@/lib/socket/SocketContext";
import { Toaster } from "@/components/ui/sonner"

export const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <SessionProvider>
            <SocketProvider>
                {children}
                <Toaster />
            </SocketProvider>
        </SessionProvider>
    )
}