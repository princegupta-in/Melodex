"use client"

import { useRef, useState } from "react"
import { FastForward, Pause, Play, Rewind, Volume, Volume1, Volume2, VolumeX } from "lucide-react"

import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"

export default function MediaControl() {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(100)
    const [volume, setVolume] = useState(75)
    const [showVolumeSlider, setShowVolumeSlider] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const previousVolume = useRef(volume)

    // Toggle play/pause
    const togglePlayPause = () => {
        setIsPlaying(!isPlaying)
    }

    // Handle seek bar change
    const handleSeekChange = (value: number[]) => {
        setCurrentTime(value[0])
    }

    // Handle volume change
    const handleVolumeChange = (value: number[]) => {
        setVolume(value[0])
        if (value[0] > 0 && isMuted) {
            setIsMuted(false)
        }
    }

    // Toggle mute
    const toggleMute = () => {
        if (isMuted) {
            setIsMuted(false)
            setVolume(previousVolume.current)
        } else {
            previousVolume.current = volume
            setIsMuted(true)
            setVolume(0)
        }
    }

    // Get volume icon based on volume level
    const getVolumeIcon = () => {
        if (isMuted || volume === 0) return <VolumeX className="h-5 w-5" />
        if (volume < 33) return <Volume className="h-5 w-5" />
        if (volume < 66) return <Volume1 className="h-5 w-5" />
        return <Volume2 className="h-5 w-5" />
    }

    // Format time (seconds) to MM:SS
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = Math.floor(seconds % 60)
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
    }

    return (
        <div className="w-full max-w-3xl mx-auto p-4 bg-background rounded-lg shadow-sm border">
            <div className="space-y-4 relative">
                {/* Seek bar */}
                <div className="space-y-1">
                    <Slider
                        value={[currentTime]}
                        min={0}
                        max={duration}
                        step={1}
                        onValueChange={handleSeekChange}
                        className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center">
                    <div className="flex items-center gap-4">
                        {/* Previous track button */}
                        <button className="p-2 rounded-full hover:bg-muted transition-colors" aria-label="Previous track">
                            <Rewind className="h-5 w-5" />
                        </button>

                        {/* Play/Pause button */}
                        <button
                            className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            onClick={togglePlayPause}
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </button>

                        {/* Next track button */}
                        <button className="p-2 rounded-full hover:bg-muted transition-colors" aria-label="Next track">
                            <FastForward className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Volume control */}
                    <div
                        className="absolute right-4 flex items-center"
                        onMouseEnter={() => setShowVolumeSlider(true)}
                        onMouseLeave={() => {
                            // Add a small delay before hiding to prevent accidental hiding
                            setTimeout(() => {
                                if (!document.querySelector(".volume-container:hover")) {
                                    setShowVolumeSlider(false)
                                }
                            }, 300)
                        }}
                    >
                        <div className="volume-container flex items-center">
                            <button
                                className="p-2 rounded-full hover:bg-muted transition-colors"
                                onClick={toggleMute}
                                aria-label={isMuted ? "Unmute" : "Mute"}
                            >
                                {getVolumeIcon()}
                            </button>

                            <div
                                className={cn(
                                    "transition-all duration-200 ease-in-out pl-2",
                                    showVolumeSlider ? "opacity-100 w-24" : "opacity-0 w-0 pointer-events-none",
                                )}
                            >
                                <Slider
                                    value={[volume]}
                                    min={0}
                                    max={100}
                                    step={1}
                                    onValueChange={handleVolumeChange}
                                    className="cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

