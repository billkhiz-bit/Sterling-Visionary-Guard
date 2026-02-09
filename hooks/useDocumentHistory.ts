
import { useLocalStorage } from './useLocalStorage';
import { StoredDocument } from '../types';

export function useDocumentHistory() {
  const [history, setHistory] = useLocalStorage<StoredDocument[]>('vfa_history', []);

  const addDocument = (doc: Omit<StoredDocument, 'id' | 'scannedAt' | 'isArchived'>) => {
    const newDoc: StoredDocument = {
      ...doc,
      id: Date.now().toString(),
      scannedAt: new Date().toISOString(),
      isArchived: false
    };
    setHistory(prev => [newDoc, ...prev].slice(0, 100));
    return newDoc;
  };

  const toggleArchived = (id: string) => {
    setHistory(prev => prev.map(d => {
      if (d.id === id) {
        return { 
          ...d, 
          isArchived: !d.isArchived, 
          archivedAt: !d.isArchived ? new Date().toISOString() : undefined 
        };
      }
      return d;
    }));
  };

  const findPrevious = (provider: string, category: string) => {
    return history.find(d => 
      d.provider.toLowerCase() === provider.toLowerCase() || 
      d.category === category
    );
  };

  const getUnreadDocuments = () => {
    return history
      .filter(d => !d.isArchived)
      .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
  };

  const clearHistory = () => setHistory([]);

  return { history, addDocument, findPrevious, toggleArchived, getUnreadDocuments, clearHistory };
}
