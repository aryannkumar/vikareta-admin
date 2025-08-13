import { useContext } from 'react';
import { useToast } from '@/components/providers/toast-provider';

// Safe toast hook that provides fallback during SSR
export function useSafeToast() {
  try {
    return useToast();
  } catch (error) {
    // Return fallback toast functions if provider is not available
    return {
      success: (title: string, description?: string) => {
        console.log(`Toast Success: ${title}`, description);
      },
      error: (title: string, description?: string) => {
        console.error(`Toast Error: ${title}`, description);
      },
      info: (title: string, description?: string) => {
        console.info(`Toast Info: ${title}`, description);
      },
      warning: (title: string, description?: string) => {
        console.warn(`Toast Warning: ${title}`, description);
      }
    };
  }
}