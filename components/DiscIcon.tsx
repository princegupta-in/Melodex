import React from 'react'
import { Disc3 } from 'lucide-react'

const GradientDisc3 = () => {
    return (
        <svg className="h-96 w-96" viewBox="0 0 24 24">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(0, 0, 0, 0.8)" />
                    <stop offset="50%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="rgba(0, 0, 0, 0.8)" />
                </linearGradient>
            </defs>
            <Disc3 stroke="url(#grad)" fill="none" />
        </svg>
    )
}

export default GradientDisc3
