export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  matchedFields?: string[];
  actionLabel?: string;
  actionUrl?: string;
  breakdownList?: { label: string; count: number }[];
  isThinking?: boolean;
}
