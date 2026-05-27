import { useEffect, useState } from "react";

/**
 * Returns a value that updates only after `delay` ms have passed without
 * a new update — used to avoid hammering the API on every keystroke.
 */
export function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
