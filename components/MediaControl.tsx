"use client";

import { useEffect, useRef, useState } from "react";
import {
    FastForward,
    Pause,
    Play,
    Rewind,
    Volume,
    Volume1,
    Volume2,
    VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { useSocket } from "@/lib/socket/SocketContext";

// Updated props: isCreator and roomId added
interface MediaControlProps {
    player: any; // YouTube player instance from react-youtube
    videoDuration: number; // Video duration in seconds, from your stream record
    isCreator: boolean; // True if this user is the room creator
    roomId: string;     // Room ID used for broadcasting playback updates
    playing: boolean;  // new prop for playback state from parent
    videoId: string;    // NEW: current video id, used to reapply mute/volume on video change
    onForwardSong: () => void;
    syncTime: number;
}

export default function MediaControl({ player, videoDuration, isCreator, roomId, playing, videoId, onForwardSong, syncTime }: MediaControlProps) {
    const socket = useSocket();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(75);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const previousVolume = useRef(volume);

    // Update currentTime every second if player exists and video is playing
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (player && isPlaying) {
            interval = setInterval(() => {
                const time = player.getCurrentTime();
                setCurrentTime(time);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [player, isPlaying]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isCreator && player && socket) {
            interval = setInterval(() => {
                const currentTime = player.getCurrentTime();
                socket.emit("playbackUpdate", {
                    roomId,
                    state: "playing",
                    currentTime,
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isCreator, player, socket, roomId]);

    // Format seconds to MM:SS
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    // [SYNC] Function to emit playback update if creator
    const syncPlayback = (state: "play" | "pause" | "seek", newTime?: number) => {
        if (isCreator && socket) {
            socket.emit("playbackUpdate", {
                roomId,
                state,
                currentTime: newTime !== undefined ? newTime : player?.getCurrentTime() || currentTime,
            });
        }
    };

    useEffect(() => {
        if (playing) {
            setIsPlaying(true)
        }
    }, [playing])
    // Toggle play/pause using the passed player instance
    const togglePlayPause = () => {
        if (!player) return;
        if (isPlaying) {
            player.pauseVideo();
            setIsPlaying(false);
            if (isCreator) syncPlayback("pause");
        } else {
            player.playVideo();
            setIsPlaying(true);
            if (isCreator) syncPlayback("play");
        }
    };

    // When user seeks, update currentTime and call player.seekTo
    const handleSeekChange = (value: number[]) => {
        const newTime = value[0];
        setCurrentTime(newTime);
        if (player) {
            player.seekTo(newTime, true);
        }
        if (isCreator) {
            syncPlayback("seek", newTime);
        }
    };

    // Handle volume change: update state and set player's volume
    const handleVolumeChange = (value: number[]) => {
        const newVolume = value[0];
        setVolume(newVolume);
        if (player) {
            player.setVolume(newVolume);
        }
        if (newVolume > 0 && isMuted) {
            setIsMuted(false);
        }
    };

    // Toggle mute: update volume state and call player.setVolume
    const toggleMute = () => {
        if (!player) return;
        if (isMuted) {
            // Unmute locally
            setIsMuted(false);
            setVolume(previousVolume.current);
            player.setVolume(previousVolume.current);
            // If creator, broadcast unmute event to all participants
            if (isCreator && socket) {
                socket.emit("muteUpdate", { roomId, mute: false });
            }
        } else {
            // Mute locally
            previousVolume.current = volume;
            setIsMuted(true);
            setVolume(0);
            player.setVolume(0);
            // If creator, broadcast mute event to all participants
            if (isCreator && socket) {
                socket.emit("muteUpdate", { roomId, mute: true });
            }
        }
    };


    // Get volume icon based on volume level
    const getVolumeIcon = () => {
        if (isMuted || volume === 0) return <VolumeX className="h-5 w-5" />;
        if (volume < 33) return <Volume className="h-5 w-5" />;
        if (volume < 66) return <Volume1 className="h-5 w-5" />;
        return <Volume2 className="h-5 w-5" />;
    };

    // NEW EFFECT: Reapply mute/volume when videoId changes (i.e. new song)
    useEffect(() => {
        if (player) {
            setTimeout(() => {
                if (isMuted) {
                    player.mute();
                } else {
                    player.unMute();
                }
                player.setVolume(volume);
            }, 300);
        }
    }, [player, videoId, isMuted, volume]);

    useEffect(() => {
        if (!socket || isCreator || !player) return;

        const handleMuteUpdate = (data: any) => {
            if (data.roomId === roomId) {
                console.log("Received mute update on guest:", data);
                // Update the UI state for mute
                setIsMuted(data.mute);
                // Apply the mute change to the player as well
                if (data.mute) {
                    player.mute();
                    player.setVolume(0);
                } else {
                    player.unMute();
                    player.setVolume(volume);
                }
            }
        };

        socket.on("muteUpdate", handleMuteUpdate);
        return () => {
            socket.off("muteUpdate", handleMuteUpdate);
        };
    }, [socket, roomId, isCreator, player, volume]);

    useEffect(() => {
        if (!isCreator && player) {
            setCurrentTime(syncTime);
        }
    }, [syncTime, isCreator, player]);

    return (
        <div className="w-full mx-auto px-4 pt-1 pb-0.5 bg-background shadow-sm border">
            <div className="space-y-4 relative">
                {/* Seek bar */}
                <div className="space-y-1">
                    <Slider
                        value={[currentTime]}
                        min={0}
                        max={videoDuration} //use videoDuration from props
                        step={1}
                        onValueChange={handleSeekChange}
                        className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground absolute w-full px-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(videoDuration)}</span>
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
                            aria-label={playing ? "Pause" : "Play"}
                        >
                            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </button>


                        {/* Next track button */}
                        {isCreator && (
                            <button
                                onClick={onForwardSong}
                                className="p-2 rounded-full hover:bg-muted transition-colors"
                                aria-label="Next track"
                            >
                                <FastForward className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    {/* Volume control */}
                    <div
                        className="absolute right-4 flex items-center"
                        onMouseEnter={() => setShowVolumeSlider(true)}
                        onMouseLeave={() => {
                            setTimeout(() => {
                                if (!document.querySelector(".volume-container:hover")) {
                                    setShowVolumeSlider(false);
                                }
                            }, 300);
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
                                    showVolumeSlider ? "opacity-100 w-24" : "opacity-0 w-0 pointer-events-none"
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
    );
}
