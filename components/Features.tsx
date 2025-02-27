"use client"

import { motion } from "framer-motion"
import { Music, Users, Zap, Headphones } from "lucide-react"

const features = [
  {
    icon: <Music className="w-6 h-6" />,
    title: "Fan-Curated Playlists",
    description: "Let your audience choose the tracks, creating a truly interactive music experience.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Engage Your Community",
    description: "Build stronger connections with your fans through shared musical experiences.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Real-Time Interaction",
    description: "Respond to song requests and chat with your audience in real-time.",
  },
  {
    icon: <Headphones className="w-6 h-6" />,
    title: "High-Quality Audio",
    description: "Stream crystal-clear audio to deliver the best listening experience for your fans.",
  },
]

export default function Features() {
  return (
    <section className="py-20 px-4 md:px-6">
      <div className="container mx-auto">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          Empower Your Streams with FanTune
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white/5 p-6 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="bg-purple-500 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-white/60">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

