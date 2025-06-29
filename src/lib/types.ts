export interface Slide {
  id: string;
  title: string;
  content: string;
  notes?: string;
  hidden?: boolean;
  type: 'slide' | 'verse';
  source: string;
  dataAiHint?: string;
  additionalContent1?: string;
  additionalContent2?: string;
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
