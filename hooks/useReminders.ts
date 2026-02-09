
import { useLocalStorage } from './useLocalStorage';
import { Reminder, StoredDocument } from '../types';

export function useReminders() {
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('vfa_reminders', []);

  const createReminder = (doc: StoredDocument) => {
    if (!doc.dueDate || doc.dueDate === 'unknown') return;
    
    const newReminder: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      docId: doc.id,
      title: `${doc.provider} ${doc.category}`,
      dueDate: doc.dueDate,
      amount: doc.amount,
      completed: false
    };

    setReminders(prev => {
      // Avoid duplicate reminders for the same document
      if (prev.some(r => r.docId === doc.id)) return prev;
      return [...prev, newReminder].sort((a, b) => 
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
    });
  };

  const getUpcoming = () => {
    const now = new Date();
    return reminders.filter(r => !r.completed && new Date(r.dueDate) >= now);
  };

  const markCompleted = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: true } : r));
  };

  return { reminders, createReminder, getUpcoming, markCompleted };
}
