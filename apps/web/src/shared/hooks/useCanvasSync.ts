import { useEffect } from 'react';

export function useCanvasSync() {
  useEffect(() => {
    console.log('Canvas sync initialized');
  }, []);
}
