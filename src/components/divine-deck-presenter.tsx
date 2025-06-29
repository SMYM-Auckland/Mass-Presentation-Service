"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  FilePlus,
  Tv,
  Clock,
  Mic,
  Search,
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  Save,
  FolderOpen,
  ChevronsRight,
  ChevronsLeft,
  Edit,
  EyeOff,
  BookOpen,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { Deck, Slide, MassSetup, Section } from '@/lib/types';
import { mockDecks, mockVerses } from '@/lib/mock-data';

export default function DivineDeckPresenter() {
  const { toast } = useToast();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [queue, setQueue] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [setups, setSetups] = useState<MassSetup[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);

  const channelRef = useRef<BroadcastChannel>();
  const projectorWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    // Load initial data and setups
    setDecks(mockDecks);
    const savedSetups = localStorage.getItem('divineDeckSetups');
    if (savedSetups) {
      setSetups(JSON.parse(savedSetups));
    }

    // Initialize BroadcastChannel
    const channel = new BroadcastChannel('divine-deck');
    channelRef.current = channel;

    const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'REQUEST_SLIDE' && currentIndex >= 0) {
            channel.postMessage({ type: 'SLIDE_CHANGE', slide: queue[currentIndex] });
        }
    };
    channel.addEventListener('message', handleMessage);

    return () => {
      channel.close();
    };
  }, []);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);
  
  const currentSlide = useMemo(() => queue[currentIndex] || null, [queue, currentIndex]);
  const nextSlide = useMemo(() => queue[currentIndex + 1] || null, [queue, currentIndex]);

  useEffect(() => {
    if(channelRef.current) {
        channelRef.current.postMessage({ type: 'SLIDE_CHANGE', slide: currentSlide });
    }
  }, [currentSlide]);

  const allSlides = useMemo(() => {
    const slidesFromDecks = decks.flatMap(deck => deck.sections.flatMap(section => section.slides));
    return [...slidesFromDecks, ...mockVerses];
  }, [decks]);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return allSlides.filter(slide =>
      slide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slide.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allSlides]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const openProjectorView = () => {
    const projector = window.open('/projector', 'DivineDeckProjector', 'width=800,height=600');
    projectorWindowRef.current = projector;
    toast({ title: "Projector view opened", description: "Control the presentation from this window." });
  };
  
  const handleAddToQueue = (slide: Slide) => {
    setQueue(prev => [...prev, slide]);
    toast({ title: `Added "${slide.title}" to queue.` });
  };

  const handleRemoveFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleMoveInQueue = (index: number, direction: 'up' | 'down') => {
    const newQueue = [...queue];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newQueue.length) {
      [newQueue[index], newQueue[targetIndex]] = [newQueue[targetIndex], newQueue[index]];
      setQueue(newQueue);
    }
  };

  const handleNext = () => setCurrentIndex(prev => Math.min(prev + 1, queue.length - 1));
  const handlePrev = () => setCurrentIndex(prev => Math.max(prev - 1, -1));

  const handleSaveSetup = () => {
    const name = prompt("Enter a name for this setup:", `Mass ${new Date().toLocaleDateString()}`);
    if (name) {
      const newSetup: MassSetup = {
        id: `setup-${Date.now()}`,
        name,
        queue,
        createdAt: new Date().toISOString(),
      };
      const updatedSetups = [...setups, newSetup];
      setSetups(updatedSetups);
      localStorage.setItem('divineDeckSetups', JSON.stringify(updatedSetups));
      toast({ title: "Setup Saved!", description: `"${name}" has been saved.`});
    }
  };
  
  const handleLoadSetup = (setupId: string) => {
    const setup = setups.find(s => s.id === setupId);
    if(setup) {
        setQueue(setup.queue);
        setCurrentIndex(-1);
        toast({ title: "Setup Loaded", description: `"${setup.name}" is ready.`});
    }
  };

  const handleEditSlide = (slide: Slide) => {
    setEditingSlide(slide);
    setIsEditorOpen(true);
  };
  
  const handleUpdateSlide = (updatedSlide: Slide) => {
    const updateInArray = (arr: Slide[]) => arr.map(s => s.id === updatedSlide.id ? updatedSlide : s);
    setQueue(updateInArray);
    
    // This is a deep update, which is complex. For mock data, we can fake it.
    // In a real app, this would be an API call.
    const newDecks = decks.map(deck => ({
        ...deck,
        sections: deck.sections.map(section => ({
            ...section,
            slides: section.slides.map(s => s.id === updatedSlide.id ? updatedSlide : s)
        }))
    }));
    setDecks(newDecks);
    
    setIsEditorOpen(false);
    setEditingSlide(null);
    toast({ title: "Slide Updated", description: `Changes to "${updatedSlide.title}" have been saved.`});
  };

  const SlideDisplay = ({ slide, className, isNext }: { slide: Slide | null, className?: string, isNext?: boolean }) => (
    <Card className={`flex flex-col overflow-hidden transition-all duration-300 ${className}`}>
        <CardHeader>
            <CardTitle className={`font-headline ${isNext ? 'text-2xl' : 'text-4xl'}`}>{slide?.title || (isNext ? 'End of Queue' : 'Select a Slide')}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            {slide ? (
                <>
                  <p className={`whitespace-pre-wrap ${isNext ? 'text-lg' : 'text-3xl'}`}>
                      {slide.content}
                  </p>
                  {slide.additionalContent1 && <p className={`whitespace-pre-wrap ${isNext ? 'text-base' : 'text-xl'} text-muted-foreground`}>{slide.additionalContent1}</p>}
                  {slide.additionalContent2 && <p className={`whitespace-pre-wrap ${isNext ? 'text-base' : 'text-xl'} text-muted-foreground`}>{slide.additionalContent2}</p>}
                </>
            ) : <div className="text-muted-foreground"></div>}
        </CardContent>
    </Card>
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-background font-body">
        <header className="flex items-center justify-between p-2 border-b h-16 shrink-0">
            <div className="flex items-center gap-2">
                <Logo className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold font-headline">Divine Deck</h1>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => toast({ title: "Importing...", description: "This feature is for demonstration."})}>
                    <FilePlus className="mr-2 h-4 w-4"/> Import .pptx
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast({ title: "Importing...", description: "This feature is for demonstration."})}>
                    <BookOpen className="mr-2 h-4 w-4"/> Import Verses
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveSetup}><Save className="mr-2 h-4 w-4"/> Save Setup</Button>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm"><FolderOpen className="mr-2 h-4 w-4"/> Load Setup</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Load a Previous Setup</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-96">
                            <div className="flex flex-col gap-2 p-4">
                            {setups.length > 0 ? setups.map(s => (
                                <Card key={s.id} className="p-3 hover:bg-muted cursor-pointer" onClick={() => handleLoadSetup(s.id)}>
                                    <p className="font-semibold">{s.name}</p>
                                    <p className="text-sm text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</p>
                                </Card>
                            )) : <p>No saved setups.</p>}
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={openProjectorView}>
                    <Tv className="mr-2 h-4 w-4"/> Go Live
                </Button>
            </div>
        </header>

        <div className="flex flex-1 min-h-0">
            {/* Main Content */}
            <main className="flex-[3] flex flex-col p-4 gap-4">
                <AnimatePresence mode="wait">
                    <motion.div key={currentSlide?.id || 'empty'} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} transition={{duration: 0.3}} className="flex-1 flex flex-col relative">
                       <SlideDisplay slide={currentSlide} className="h-full" />
                       {currentSlide && <Button size="icon" variant="ghost" className="absolute top-4 right-4" onClick={() => handleEditSlide(currentSlide)}><Edit className="h-5 w-5"/></Button>}
                    </motion.div>
                </AnimatePresence>

                <div className="grid grid-cols-2 gap-4 h-1/3">
                    <div className="flex flex-col gap-2">
                        <h3 className="font-bold font-headline text-lg">Next Slide</h3>
                        <SlideDisplay slide={nextSlide} className="h-full" isNext />
                    </div>
                    <div className="flex flex-col gap-2">
                        <h3 className="font-bold font-headline text-lg flex items-center gap-2"><Mic className="h-5 w-5"/> Speaker Notes</h3>
                        <Card className="flex-1">
                            <ScrollArea className="h-full">
                                <CardContent className="p-4 text-sm">
                                    {currentSlide?.notes || <p className="text-muted-foreground">No notes for this slide.</p>}
                                </CardContent>
                            </ScrollArea>
                        </Card>
                    </div>
                </div>

                <div className="flex items-center justify-center p-2 border-t gap-4">
                    <div className="flex items-center gap-2" onClick={() => setIsTimerRunning(!isTimerRunning)}>
                        <Clock className="h-6 w-6 text-primary cursor-pointer"/>
                        <span className="text-2xl font-mono font-semibold">{formatTime(timer)}</span>
                    </div>
                    <Separator orientation="vertical" className="h-8"/>
                    <Button variant="outline" size="lg" onClick={handlePrev} disabled={currentIndex <= -1}><ChevronsLeft /></Button>
                    <Button size="lg" onClick={handleNext} disabled={currentIndex >= queue.length - 1}><ChevronsRight/></Button>
                </div>
            </main>

            {/* Sidebar */}
            <aside className="w-[420px] border-l flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold font-headline mb-2">Live Queue</h2>
                    <p className="text-sm text-muted-foreground">{queue.length} items in queue.</p>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 flex flex-col gap-1">
                    {queue.map((slide, index) => (
                        <Card key={`${slide.id}-${index}`} className={`p-2 flex items-center gap-2 transition-all ${currentIndex === index ? 'bg-primary/10 border-primary' : ''}`}>
                            <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                            <div className="flex-1" onClick={() => setCurrentIndex(index)}>
                                <p className="font-semibold truncate">{slide.title}</p>
                                <p className="text-xs text-muted-foreground">{slide.source}</p>
                            </div>
                            <div className="flex flex-col">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveInQueue(index, 'up')} disabled={index===0}><ChevronUp className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveInQueue(index, 'down')} disabled={index===queue.length-1}><ChevronDown className="h-4 w-4"/></Button>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveFromQueue(index)}><X className="h-4 w-4"/></Button>
                        </Card>
                    ))}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t">
                    <h2 className="text-xl font-bold font-headline mb-2">Library</h2>
                    <div className="relative mb-2">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input placeholder="Search all slides..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                    </div>
                    <ScrollArea className="h-64">
                    {searchTerm ? (
                        <div className="flex flex-col gap-1 py-2">
                        {searchResults.map(slide => (
                            <Card key={slide.id} className="p-2 flex items-center gap-2">
                                <div className="flex-1">
                                    <p className="font-semibold truncate">{slide.title}</p>
                                    <p className="text-xs text-muted-foreground">{slide.source}</p>
                                </div>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleAddToQueue(slide)}><Plus className="h-4 w-4"/></Button>
                            </Card>
                        ))}
                        </div>
                    ) : (
                        <Accordion type="single" collapsible className="w-full">
                            {decks.map(deck => (
                            <AccordionItem value={deck.id} key={deck.id}>
                                <AccordionTrigger>{deck.fileName}</AccordionTrigger>
                                <AccordionContent>
                                    {deck.sections.map(section => (
                                    <Accordion type="single" collapsible className="w-full pl-4" key={section.id}>
                                        <AccordionItem value={section.id}>
                                            <AccordionTrigger>{section.title}</AccordionTrigger>
                                            <AccordionContent>
                                                {section.slides.map(slide => (
                                                <div key={slide.id} className="flex items-center gap-2 p-1 rounded hover:bg-muted">
                                                    {slide.hidden && <EyeOff className="h-4 w-4 text-muted-foreground shrink-0"/>}
                                                    <p className={`flex-1 truncate text-sm ${slide.hidden ? 'text-muted-foreground' : ''}`}>{slide.title}</p>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAddToQueue(slide)}><Plus className="h-4 w-4"/></Button>
                                                </div>
                                                ))}
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                    </ScrollArea>
                </div>
            </aside>
        </div>

        {editingSlide && (
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Slide</DialogTitle>
                        <CardDescription>Make live changes to the slide content and notes.</CardDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input defaultValue={editingSlide.title} onChange={e => setEditingSlide(s => s ? {...s, title: e.target.value} : null)} />
                        <Textarea placeholder="Slide content..." className="min-h-40" defaultValue={editingSlide.content} onChange={e => setEditingSlide(s => s ? {...s, content: e.target.value} : null)}/>
                        <Textarea placeholder="Speaker notes..." defaultValue={editingSlide.notes} onChange={e => setEditingSlide(s => s ? {...s, notes: e.target.value} : null)}/>
                        <Textarea placeholder="Additional Content Section 1" defaultValue={editingSlide.additionalContent1} onChange={e => setEditingSlide(s => s ? {...s, additionalContent1: e.target.value} : null)}/>
                        <Textarea placeholder="Additional Content Section 2" defaultValue={editingSlide.additionalContent2} onChange={e => setEditingSlide(s => s ? {...s, additionalContent2: e.target.value} : null)}/>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
                        <Button onClick={() => handleUpdateSlide(editingSlide)}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
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
