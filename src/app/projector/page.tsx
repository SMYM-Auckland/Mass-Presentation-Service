"use client";

import { useState, useEffect } from 'react';
import type { Slide, LayoutType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';

const getLayoutClass = (layoutType: LayoutType | undefined) => {
  switch (layoutType) {
    case '2-col':
      return 'w-full h-full grid grid-cols-2 gap-x-8 items-center';
    case '3-col':
      return 'w-full h-full grid grid-cols-3 gap-x-8 items-center';
    case '4-quad':
      return 'w-full h-full grid grid-cols-2 grid-rows-2 gap-8 items-center';
    default:
      return 'w-full h-full flex flex-col items-center justify-center';
  }
};

const getParagraphClass = (layoutType: LayoutType | undefined) => {
    switch (layoutType) {
        case '2-col':
            return 'text-4xl lg:text-5xl whitespace-pre-wrap leading-tight';
        case '3-col':
            return 'text-3xl lg:text-4xl whitespace-pre-wrap leading-tight';
        case '4-quad':
            return 'text-3xl lg:text-4xl whitespace-pre-wrap leading-tight';
        default:
            return 'text-4xl lg:text-6xl whitespace-pre-wrap leading-tight';
    }
}

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
              <CardHeader className="text-center shrink-0">
                <CardTitle className="text-5xl lg:text-7xl font-bold font-headline">
                  {currentSlide.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center text-center gap-8 min-h-0">
                 <div className={getLayoutClass(currentSlide.layoutType)}>
                    {currentSlide.contents?.map((content, index) => (
                        <div key={index} className="flex items-center justify-center h-full">
                            <p className={getParagraphClass(currentSlide.layoutType)}>
                                {content}
                            </p>
                        </div>
                    ))}
                </div>
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
