import { useCallback } from 'react';

export function useAIStream() {
  return useCallback((nodeId: string) => {
    console.log(`AI stream for node: ${nodeId}`);
  }, []);
}
