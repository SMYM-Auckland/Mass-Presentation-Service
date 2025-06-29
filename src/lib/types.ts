export type LayoutType = '1-col' | '2-col' | '3-col' | '4-quad';

export interface Slide {
  id: string;
  title: string;
  contents: string[];
  layoutType: LayoutType;
  notes?: string;
  hidden?: boolean;
  type: 'slide';
  source: string;
  dataAiHint?: string;
}

export interface Section {
  id: string;
  title: string;
  slides: Slide[];
}

export interface Deck {
  id: string;
  fileName: string;
  sections: Section[];
}

export interface MassSetup {
  id: string;
  name: string;
  queue: Slide[];
  createdAt: string;
}
