"use client";

import { useState, useEffect } from 'react';
import type { Slide } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';

export default function ProjectorPage() {
  const [currentSlide, setCurrentSlide] = useState<Slide | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel('divine-deck');
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SLIDE_CHANGE') {
        setCurrentSlide(event.data.slide);
      }
    };

    channel.addEventListener('message', handleMessage);

    // Request initial state
    channel.postMessage({ type: 'REQUEST_SLIDE' });

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-black text-white flex items-center justify-center p-8 overflow-hidden">
      <AnimatePresence mode="wait">
        {currentSlide ? (
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="w-full h-full flex flex-col items-center justify-center"
          >
            <Card className="w-full h-full flex flex-col bg-black border-0 shadow-none text-white">
              <CardHeader className="text-center">
                <CardTitle className="text-5xl lg:text-7xl font-bold font-headline">
                  {currentSlide.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center text-center">
                <p className="text-4xl lg:text-6xl whitespace-pre-wrap leading-tight">
                  {currentSlide.content}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="text-4xl text-gray-500">
            Waiting for presenter...
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Minimal Framer Motion for smooth transitions
const framer = {
    install: () => {
        try {
            require('framer-motion');
        } catch (e) {
            // This is a dev-time check
        }
    }
};
framer.install();
