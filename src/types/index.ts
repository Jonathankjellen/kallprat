export interface Kallprat {
  id: string;
  category: string;
  text: string;
  followUp?: string[];
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
}
