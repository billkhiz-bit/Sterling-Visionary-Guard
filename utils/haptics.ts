export const haptics = {
  /**
   * Short vibrate for successful actions or standard confirmations.
   */
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },
  /**
   * Triple pulse for errors or invalid interactions.
   */
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
  },
  /**
   * Long, distinct pulse for warnings (e.g., scam detected).
   */
  warning: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 100, 300]);
    }
  },
  /**
   * Rapid, micro-pulses for camera capture feedback.
   */
  captured: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 30, 30]);
    }
  }
};
