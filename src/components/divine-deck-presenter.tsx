"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
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
  GripVertical,
  Trash2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Deck, Slide, MassSetup, Section, LayoutType } from '@/lib/types';
import { mockDecks } from '@/lib/mock-data';
import { Checkbox } from '@/components/ui/checkbox';

type QueueItem = Slide & { queueId: string };

export default function DivineDeckPresenter() {
  const { toast } = useToast();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [setups, setSetups] = useState<MassSetup[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [selectedSlides, setSelectedSlides] = useState<Set<string>>(new Set());
  const [isCreatingNewSlide, setIsCreatingNewSlide] = useState(false);
  const [newSlideLocation, setNewSlideLocation] = useState<{deckId: string, sectionId: string} | null>(null);

  const channelRef = useRef<BroadcastChannel>();
  const projectorWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    setDecks(mockDecks);
    const savedSetups = localStorage.getItem('divineDeckSetups');
    if (savedSetups) {
      setSetups(JSON.parse(savedSetups));
    }
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
  }, [currentIndex, queue]);
  
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

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const results: ({ type: 'section'; data: Section; source: string; } | { type: 'slide'; data: Slide; })[] = [];
    const addedItems = new Set<string>();
    decks.forEach(deck => {
      deck.sections.forEach(section => {
        if (section.title.toLowerCase().includes(lowerCaseSearchTerm)) {
          if (!addedItems.has(`section-${section.id}`)) {
            results.push({ type: 'section', data: section, source: deck.fileName });
            addedItems.add(`section-${section.id}`);
          }
        }
        section.slides.forEach(slide => {
          if (slide.title.toLowerCase().includes(lowerCaseSearchTerm) || slide.contents.join(' ').toLowerCase().includes(lowerCaseSearchTerm)) {
            if (!addedItems.has(`slide-${slide.id}`)) {
              results.push({ type: 'slide', data: slide });
              addedItems.add(`slide-${slide.id}`);
            }
          }
        });
      });
    });
    return results;
  }, [searchTerm, decks]);

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
    const queueItem: QueueItem = { ...slide, queueId: `q-${Date.now()}-${Math.random()}` };
    setQueue(prev => [...prev, queueItem]);
    toast({ title: `Added "${slide.title}" to queue.` });
  };

  const handleAddSectionToQueue = (section: Section) => {
    const newItems: QueueItem[] = section.slides.map(slide => ({ ...slide, queueId: `q-${Date.now()}-${Math.random()}-${slide.id}` }));
    setQueue(prev => [...prev, ...newItems]);
    toast({ title: `Added all ${section.slides.length} slides from "${section.title}".` });
  };

  const handleRemoveFromQueue = (queueId: string) => {
    const currentSlideQueueId = queue[currentIndex]?.queueId;
    const newQueue = queue.filter(p => p.queueId !== queueId);
    if (currentSlideQueueId && currentSlideQueueId !== queueId) {
        const newIndex = newQueue.findIndex(p => p.queueId === currentSlideQueueId);
        setCurrentIndex(newIndex);
    } else {
        setCurrentIndex(prev => Math.min(prev, newQueue.length - 1));
    }
    setQueue(newQueue);
  };
  
  const handleMoveInQueue = (index: number, direction: 'up' | 'down') => {
    const newQueue = [...queue];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newQueue.length) {
      [newQueue[index], newQueue[targetIndex]] = [newQueue[targetIndex], newQueue[index]];
      setQueue(newQueue);
    }
  };

  const handleNext = useCallback(() => setCurrentIndex(prev => Math.min(prev + 1, queue.length - 1)), [queue.length]);
  const handlePrev = useCallback(() => setCurrentIndex(prev => Math.max(prev - 1, -1)), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      // Do not trigger if user is typing in an input/textarea
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNext, handlePrev]);

  const handleSaveSetup = () => {
    const name = prompt("Enter a name for this setup:", `Mass ${new Date().toLocaleDateString()}`);
    if (name) {
      const newSetup: MassSetup = { id: `setup-${Date.now()}`, name, queue, createdAt: new Date().toISOString() };
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

  const handleAddNewSection = (deckId: string) => {
    const sectionName = prompt('Enter name for the new section:');
    if (sectionName && sectionName.trim() !== '') {
        const newSection: Section = {
            id: `sec-${Date.now()}`,
            title: sectionName.trim(),
            slides: [],
        };
        setDecks(prevDecks => prevDecks.map(deck => {
            if (deck.id === deckId) {
                return { ...deck, sections: [...deck.sections, newSection] };
            }
            return deck;
        }));
        toast({ title: 'Section Created', description: `"${sectionName.trim()}" was added.` });
    }
  };
  
  const handleRenameSection = (deckId: string, sectionId: string) => {
    const section = decks.find(d => d.id === deckId)?.sections.find(s => s.id === sectionId);
    if (!section) return;

    const newName = prompt('Enter new name for the section:', section.title);
    if (newName && newName.trim() !== '') {
        setDecks(prevDecks => prevDecks.map(deck => {
            if (deck.id === deckId) {
                const newSections = deck.sections.map(sec => {
                    if (sec.id === sectionId) {
                        return { ...sec, title: newName.trim() };
                    }
                    return sec;
                });
                return { ...deck, sections: newSections };
            }
            return deck;
        }));
        toast({ title: 'Section Renamed', description: `Section renamed to "${newName.trim()}".` });
    }
  };

  const handleNewSlide = (deckId: string, sectionId: string) => {
      setIsCreatingNewSlide(true);
      setNewSlideLocation({ deckId, sectionId });
      const deck = decks.find(d => d.id === deckId);
      setEditingSlide({
          id: `temp-${Date.now()}`,
          title: 'New Slide',
          contents: [''],
          layoutType: '1-col',
          notes: '',
          type: 'slide',
          source: deck ? deck.fileName : 'Custom',
      });
      setIsEditorOpen(true);
  };

  const handleEditSlide = (slide: Slide) => {
    setIsCreatingNewSlide(false);
    const slideToEdit = {
        ...slide,
        contents: Array.isArray(slide.contents) && slide.contents.length > 0 ? slide.contents : [''],
        layoutType: slide.layoutType || '1-col',
    };
    setEditingSlide(slideToEdit);
    setIsEditorOpen(true);
  };
  
  const handleSaveSlide = () => {
    if (!editingSlide) return;

    if (isCreatingNewSlide && newSlideLocation) {
        const newSlide = { ...editingSlide, id: `s-${Date.now()}` };
        setDecks(prevDecks => prevDecks.map(deck => {
            if (deck.id === newSlideLocation.deckId) {
                const newSections = deck.sections.map(section => {
                    if (section.id === newSlideLocation.sectionId) {
                        return { ...section, slides: [...section.slides, newSlide] };
                    }
                    return section;
                });
                return { ...deck, sections: newSections };
            }
            return deck;
        }));
        toast({ title: "Slide Created", description: `"${newSlide.title}" has been saved.`});
    } else {
        const updateInArray = (arr: QueueItem[]) => arr.map(s => s.id === editingSlide.id ? { ...s, ...editingSlide } : s);
        setQueue(updateInArray);
        const newDecks = decks.map(deck => ({
            ...deck,
            sections: deck.sections.map(section => ({
                ...section,
                slides: section.slides.map(s => s.id === editingSlide.id ? editingSlide : s)
            }))
        }));
        setDecks(newDecks);
        toast({ title: "Slide Updated", description: `Changes to "${editingSlide.title}" have been saved.`});
    }
    
    setIsEditorOpen(false);
    setEditingSlide(null);
    setIsCreatingNewSlide(false);
    setNewSlideLocation(null);
  };

  const handleLayoutChange = (newLayout: LayoutType) => {
    if (!editingSlide) return;
    const numSections = { '1-col': 1, '2-col': 2, '3-col': 3, '4-quad': 4 }[newLayout];
    const currentContents = editingSlide.contents || [''];
    const newContents = Array.from({ length: numSections }, (_, i) => currentContents[i] || '');
    setEditingSlide({ ...editingSlide, layoutType: newLayout, contents: newContents });
  };

  const handleToggleSelection = (queueId: string, checked: boolean) => {
    setSelectedSlides(prev => {
        const newSet = new Set(prev);
        if (checked) newSet.add(queueId);
        else newSet.delete(queueId);
        return newSet;
    });
  };

  const handleToggleSelectAll = (checked: boolean) => {
      if (checked) setSelectedSlides(new Set(queue.map(item => item.queueId)));
      else setSelectedSlides(new Set());
  };

  const handleBulkDelete = () => {
    const deletedCount = selectedSlides.size;
    if (deletedCount === 0) return;
    
    const currentSlideInQueue = queue[currentIndex];
    
    const newQueue = queue.filter(item => !selectedSlides.has(item.queueId));

    if (currentSlideInQueue && !selectedSlides.has(currentSlideInQueue.queueId)) {
        const newIndex = newQueue.findIndex(p => p.queueId === currentSlideInQueue.queueId);
        setCurrentIndex(newIndex);
    } else if (currentSlideInQueue && selectedSlides.has(currentSlideInQueue.queueId)) {
        setCurrentIndex(prev => Math.min(prev, newQueue.length - 1));
    }

    setQueue(newQueue);
    setSelectedSlides(new Set());
    toast({ title: "Slides removed", description: `${deletedCount} slides removed from the queue.`});
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      setQueue((items) => {
        const oldIndex = items.findIndex(item => item.queueId === active.id);
        const newIndex = items.findIndex(item => item.queueId === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  const handleEditorOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        setEditingSlide(null);
        setIsCreatingNewSlide(false);
        setNewSlideLocation(null);
    }
    setIsEditorOpen(isOpen);
  };

  const SlideDisplay = ({ slide, className, isNext }: { slide: Slide | null, className?: string, isNext?: boolean }) => {
    const getLayoutClass = (layoutType: LayoutType | undefined) => {
        if (!layoutType) return 'flex flex-col items-center justify-center text-center gap-4';
        switch (layoutType) {
            case '2-col': return 'grid grid-cols-2 gap-4 h-full';
            case '3-col': return 'grid grid-cols-3 gap-4 h-full';
            case '4-quad': return 'grid grid-cols-2 grid-rows-2 gap-4 h-full';
            default: return 'flex flex-col items-center justify-center text-center gap-4';
        }
    };
    const getParagraphClass = (layoutType: LayoutType | undefined, isNext?: boolean) => {
        switch (layoutType) {
            case '2-col': return isNext ? 'text-base' : 'text-2xl';
            case '3-col': return isNext ? 'text-sm' : 'text-xl';
            case '4-quad': return isNext ? 'text-sm' : 'text-xl';
            default: return isNext ? 'text-lg' : 'text-3xl';
        }
    };
    return (
        <Card className={`flex flex-col overflow-hidden transition-all duration-300 ${className}`}>
            <CardHeader className="shrink-0">
                <CardTitle className={`font-headline ${isNext ? 'text-2xl' : 'text-4xl'}`}>{slide?.title || (isNext ? 'End of Queue' : 'Select a Slide')}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-4">
                {slide ? (
                    <div className={`w-full h-full ${getLayoutClass(slide.layoutType)}`}>
                        {slide.contents?.map((content, index) => (
                            <div key={index} className="flex items-center justify-center p-2 rounded-lg bg-muted/20 overflow-auto">
                                <p className={`whitespace-pre-wrap text-center ${getParagraphClass(slide.layoutType, isNext)}`}>
                                    {content}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : <div className="text-muted-foreground"></div>}
            </CardContent>
        </Card>
    );
  };

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
                <Button variant="outline" size="sm" onClick={handleSaveSetup}><Save className="mr-2 h-4 w-4"/> Save Setup</Button>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm"><FolderOpen className="mr-2 h-4 w-4"/> Load Setup</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Load a Previous Setup</DialogTitle></DialogHeader>
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
          <PanelGroup direction="horizontal">
            <Panel defaultSize={70} minSize={30}>
              <main className="h-full flex flex-col p-4 gap-4">
                  <PanelGroup direction="vertical" className="flex-1 min-h-0">
                    <Panel defaultSize={65} minSize={30}>
                      <AnimatePresence mode="wait">
                          <motion.div key={currentSlide?.id || 'empty'} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} transition={{duration: 0.3}} className="h-full flex flex-col relative">
                            <SlideDisplay slide={currentSlide} className="h-full" />
                            {currentSlide && <Button size="icon" variant="ghost" className="absolute top-4 right-4" onClick={() => handleEditSlide(currentSlide)}><Edit className="h-5 w-5"/></Button>}
                          </motion.div>
                      </AnimatePresence>
                    </Panel>
                    <PanelResizeHandle className="h-px bg-border my-2 data-[resize-handle-state=drag]:bg-primary data-[resize-handle-state=hover]:h-1 transition-all" />
                    <Panel defaultSize={35} minSize={20}>
                      <div className="grid grid-cols-2 gap-4 h-full">
                          <div className="flex flex-col gap-2 h-full">
                              <h3 className="font-bold font-headline text-lg shrink-0">Next Slide</h3>
                              <SlideDisplay slide={nextSlide} className="h-full" isNext />
                          </div>
                          <div className="flex flex-col gap-2 h-full">
                              <h3 className="font-bold font-headline text-lg flex items-center gap-2 shrink-0"><Mic className="h-5 w-5"/> Speaker Notes</h3>
                              <Card className="flex-1 min-h-0"><ScrollArea className="h-full"><CardContent className="p-4 text-sm">{currentSlide?.notes || <p className="text-muted-foreground">No notes for this slide.</p>}</CardContent></ScrollArea></Card>
                          </div>
                      </div>
                    </Panel>
                  </PanelGroup>

                  <div className="flex items-center justify-center p-2 border-t gap-4 shrink-0">
                      <div className="flex items-center gap-2" onClick={() => setIsTimerRunning(!isTimerRunning)}>
                          <Clock className="h-6 w-6 text-primary cursor-pointer"/>
                          <span className="text-2xl font-mono font-semibold">{formatTime(timer)}</span>
                      </div>
                      <Separator orientation="vertical" className="h-8"/>
                      <Button variant="outline" size="lg" onClick={handlePrev} disabled={currentIndex <= -1}><ChevronsLeft /></Button>
                      <Button size="lg" onClick={handleNext} disabled={currentIndex >= queue.length - 1}><ChevronsRight/></Button>
                  </div>
              </main>
            </Panel>
            <PanelResizeHandle className="w-px bg-border data-[resize-handle-state=drag]:bg-primary data-[resize-handle-state=hover]:w-1 transition-all" />
            <Panel defaultSize={30} minSize={20}>
              <aside className="h-full w-full flex flex-col">
                  <div className="p-4 border-b">
                      <div className="flex justify-between items-center mb-2">
                          <h2 className="text-xl font-bold font-headline">Live Queue</h2>
                          {selectedSlides.size > 0 && (<Button variant="destructive" size="sm" onClick={handleBulkDelete}><Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedSlides.size})</Button>)}
                      </div>
                      <div className="flex items-center space-x-2">
                          <Checkbox id="select-all" onCheckedChange={(checked) => handleToggleSelectAll(Boolean(checked))} checked={queue.length > 0 && selectedSlides.size === queue.length} disabled={queue.length === 0} />
                          <label htmlFor="select-all" className="text-sm font-medium leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{queue.length} items in queue.</label>
                      </div>
                  </div>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <ScrollArea className="flex-1">
                          <SortableContext items={queue.map(i => i.queueId)} strategy={verticalListSortingStrategy}>
                              <div className="p-2 flex flex-col gap-1">
                                  {queue.map((item, index) => (
                                      <QueueItemCard key={item.queueId} item={item} index={index} isCurrent={currentIndex === index} isSelected={selectedSlides.has(item.queueId)} onSelect={() => setCurrentIndex(index)} onToggleSelection={handleToggleSelection} onMove={handleMoveInQueue} onRemove={handleRemoveFromQueue} queueLength={queue.length} />
                                  ))}
                              </div>
                          </SortableContext>
                      </ScrollArea>
                  </DndContext>
                  <div className="p-4 border-t">
                      <h2 className="text-xl font-bold font-headline mb-2">Library</h2>
                      <div className="relative mb-2">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                          <Input placeholder="Search all slides..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                      </div>
                      <ScrollArea className="h-64">
                      {searchTerm ? (
                          <div className="flex flex-col gap-1 py-2">
                          {searchResults.map((result, index) => {
                            if (result.type === 'slide') {
                              return (
                                <Card key={`search-slide-${result.data.id}-${index}`} className="p-2 flex items-center gap-2">
                                    <div className="flex-1"><p className="font-semibold truncate">{result.data.title}</p><p className="text-xs text-muted-foreground">{result.data.source}</p></div>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleAddToQueue(result.data)}><Plus className="h-4 w-4"/></Button>
                                </Card>
                              )
                            } else {
                              return (
                                <Card key={`search-section-${result.data.id}-${index}`} className="p-2 flex items-center gap-2 bg-primary/10 border-primary/50">
                                  <div className="flex-1"><p className="font-semibold truncate">{result.data.title}</p><p className="text-xs text-muted-foreground">{result.source} &bull; {result.data.slides.length} slides</p></div>
                                  <Button variant="outline" size="sm" className="h-8" onClick={() => handleAddSectionToQueue(result.data)}><Plus className="h-4 w-4 mr-1.5"/> Add All</Button>
                                </Card>
                              )
                            }
                          })}
                          </div>
                      ) : (
                          <Accordion type="multiple" className="w-full">
                              {decks.map(deck => (
                              <AccordionItem value={deck.id} key={deck.id}>
                                  <AccordionTrigger>{deck.fileName}</AccordionTrigger>
                                  <AccordionContent>
                                      <div className="px-4 pb-2">
                                          <Button size="sm" variant="outline" className="w-full" onClick={() => handleAddNewSection(deck.id)}>
                                              <Plus className="mr-2 h-4 w-4"/> Add New Section
                                          </Button>
                                      </div>
                                      <Accordion type="multiple" className="w-full pl-4">
                                      {deck.sections.map(section => (
                                          <AccordionItem value={section.id} key={section.id}>
                                              <AccordionTrigger>{section.title}</AccordionTrigger>
                                              <AccordionContent>
                                                  <div className="px-1 py-2 flex flex-col gap-2">
                                                      <Button size="sm" variant="outline" className="w-full" onClick={() => handleAddSectionToQueue(section)}><Plus className="mr-2 h-4 w-4"/> Add All ({section.slides.length}) to Queue</Button>
                                                      <Button size="sm" variant="outline" className="w-full" onClick={() => handleRenameSection(deck.id, section.id)}><Edit className="mr-2 h-4 w-4"/> Rename Section</Button>
                                                      <Button size="sm" variant="outline" className="w-full" onClick={() => handleNewSlide(deck.id, section.id)}><FilePlus className="mr-2 h-4 w-4"/> Add New Slide</Button>
                                                  </div>
                                                  {section.slides.map(slide => (
                                                  <div key={slide.id} className="flex items-center gap-2 p-1 rounded hover:bg-muted">
                                                      {slide.hidden && <EyeOff className="h-4 w-4 text-muted-foreground shrink-0"/>}
                                                      <p className={`flex-1 truncate text-sm ${slide.hidden ? 'text-muted-foreground' : ''}`}>{slide.title}</p>
                                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAddToQueue(slide)}><Plus className="h-4 w-4"/></Button>
                                                  </div>
                                                  ))}
                                              </AccordionContent>
                                          </AccordionItem>
                                      ))}
                                      </Accordion>
                                  </AccordionContent>
                              </AccordionItem>
                              ))}
                          </Accordion>
                      )}
                      </ScrollArea>
                  </div>
              </aside>
            </Panel>
          </PanelGroup>
        </div>

        {editingSlide && (
            <Dialog open={isEditorOpen} onOpenChange={handleEditorOpenChange}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{isCreatingNewSlide ? 'Create New Slide' : 'Edit Slide'}</DialogTitle>
                        <CardDescription>Make changes to the slide content, layout, and notes.</CardDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="slide-title">Title</Label>
                            <Input id="slide-title" value={editingSlide.title} onChange={e => setEditingSlide(s => s ? {...s, title: e.target.value} : null)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="layout-select">Layout</Label>
                            <Select value={editingSlide.layoutType} onValueChange={(value: LayoutType) => handleLayoutChange(value)}>
                                <SelectTrigger id="layout-select" className="w-[180px]"><SelectValue placeholder="Select a layout" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1-col">1 Column</SelectItem>
                                    <SelectItem value="2-col">2 Columns</SelectItem>
                                    <SelectItem value="3-col">3 Columns</SelectItem>
                                    <SelectItem value="4-quad">4 Quadrants</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Separator/>
                        <Label>Content Sections</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {editingSlide.contents.map((content, index) => (
                                <Textarea key={index} placeholder={`Section ${index + 1} content...`} className="min-h-32" value={content}
                                    onChange={e => {
                                        if (!editingSlide) return;
                                        const newContents = [...editingSlide.contents];
                                        newContents[index] = e.target.value;
                                        setEditingSlide({ ...editingSlide, contents: newContents });
                                    }}
                                />
                            ))}
                        </div>
                        <Separator/>
                        <div className="grid gap-2">
                            <Label htmlFor="slide-notes">Speaker Notes</Label>
                            <Textarea id="slide-notes" placeholder="Speaker notes..." value={editingSlide.notes || ''} onChange={e => setEditingSlide(s => s ? {...s, notes: e.target.value} : null)}/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSlide}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
    </div>
  );
}

function QueueItemCard({ item, index, isCurrent, isSelected, onSelect, onToggleSelection, onMove, onRemove, queueLength }: {
    item: QueueItem; index: number; isCurrent: boolean; isSelected: boolean; onSelect: () => void; onToggleSelection: (id: string, checked: boolean) => void; onMove: (index: number, direction: 'up' | 'down') => void; onRemove: (id: string) => void; queueLength: number;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.queueId });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
        <div ref={setNodeRef} style={style}>
            <Card className={`p-2 flex items-center gap-2 transition-all ${isCurrent ? 'bg-primary/10 border-primary' : ''}`}>
                <div {...attributes} {...listeners} className="cursor-grab touch-none p-1"><GripVertical className="h-5 w-5 text-muted-foreground" /></div>
                <Checkbox checked={isSelected} onCheckedChange={(checked) => onToggleSelection(item.queueId, Boolean(checked))} />
                <div className="flex-1 cursor-pointer" onClick={onSelect}><p className="font-semibold truncate">{item.title}</p><p className="text-xs text-muted-foreground">{item.source}</p></div>
                <div className="flex flex-col">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(index, 'up')} disabled={index === 0}><ChevronUp className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(index, 'down')} disabled={index === queueLength - 1}><ChevronDown className="h-4 w-4" /></Button>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onRemove(item.queueId)}><X className="h-4 w-4" /></Button>
            </Card>
        </div>
    );
}

const framer = { install: () => { try { require('framer-motion'); } catch (e) {} } };
framer.install();
