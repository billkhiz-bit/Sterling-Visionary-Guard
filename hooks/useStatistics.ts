
import { useLocalStorage } from './useLocalStorage';
import { Statistics } from '../types';

const initialStats: Statistics = {
  documentsScanned: 0,
  scamsDetected: 0,
  totalAmountTracked: 0,
  documentsArchived: 0,
  firstUsed: new Date().toISOString(),
  lastUsed: new Date().toISOString()
};

export function useStatistics() {
  const [stats, setStats] = useLocalStorage<Statistics>('vfa_stats', initialStats);

  const recordScan = (amount: number, isScam: boolean) => {
    setStats(prev => ({
      ...prev,
      documentsScanned: prev.documentsScanned + 1,
      scamsDetected: isScam ? prev.scamsDetected + 1 : prev.scamsDetected,
      totalAmountTracked: prev.totalAmountTracked + (amount || 0),
      lastUsed: new Date().toISOString()
    }));
  };

  const recordArchived = () => {
    setStats(prev => ({
      ...prev,
      documentsArchived: prev.documentsArchived + 1,
      lastUsed: new Date().toISOString()
    }));
  };

  return { stats, recordScan, recordArchived };
}
