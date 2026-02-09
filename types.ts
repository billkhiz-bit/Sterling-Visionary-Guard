
export enum MessageType {
  USER = 'user',
  ASSISTANT = 'assistant'
}

export interface ComparisonData {
  has_previous: boolean;
  previous_amount?: number;
  previous_date?: string;
  difference?: number;
  difference_spoken?: string;
  percentage_change?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
  unusual?: boolean;
  note?: string;
}

export interface DocumentAnalysis {
  document_type: 'bill' | 'statement' | 'receipt' | 'letter' | 'notice' | 'unknown';
  provider: string;
  amount: number;
  amount_spoken: string;
  due_date: string;
  due_date_spoken: string;
  urgency: 'low' | 'medium' | 'high';
  scam_risk: 'none' | 'low' | 'medium' | 'high';
  scam_indicators: string[];
  scam_reasoning?: string;
  suggested_actions: string[];
  category: 'utilities' | 'council_tax' | 'insurance' | 'bank' | 'pension' | 'benefits' | 'shopping' | 'subscription' | 'other';
  requires_response: boolean;
  comparison?: ComparisonData;
}

export interface StoredDocument {
  id: string;
  provider: string;
  category: string;
  amount: number;
  amountSpoken: string;
  dueDate: string;
  dueDateSpoken: string;
  scannedAt: string;
  imageData?: string;
  isArchived: boolean;
  archivedAt?: string;
}

export interface Reminder {
  id: string;
  docId: string;
  title: string;
  dueDate: string;
  amount: number;
  completed: boolean;
}

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  fullRawContent?: string;
  timestamp: Date;
  imageData?: string;
  analysis?: DocumentAnalysis;
  relatedDocId?: string;
}

export interface Statistics {
  documentsScanned: number;
  scamsDetected: number;
  totalAmountTracked: number;
  documentsArchived: number;
  firstUsed: string;
  lastUsed: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface UserSettings {
  volume: number;
  autoSpeak: boolean;
  emergencyContact?: EmergencyContact;
  speechRate: number;
  speechPitch: number;
  voiceId?: string;
}
