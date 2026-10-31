import { useEffect } from 'react';

/** Talk show pages are always dark, independent of the conference session theme. */
export function useForceDark() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);
}
