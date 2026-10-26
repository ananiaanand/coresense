export const triggerVibration = (pattern: number | number[] = [200, 100, 200]) => {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration error on unsupported browsers
    }
  }
};
