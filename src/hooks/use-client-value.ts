
'use client';

import { useState, useEffect } from 'react';

/**
 * A hook to safely use a client-side only value and avoid hydration errors.
 * It returns the initial value on the server and during the first client render,
 * then updates to the client-side value after hydration.
 *
 * @param clientValue A function that returns the client-side value.
 * @param initialValue The value to use on the server and for initial client render.
 * @returns The appropriate value for the current rendering environment.
 */
export function useClientValue<T>(clientValue: () => T, initialValue: T): T {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    setValue(clientValue());
  }, [clientValue]);

  return value;
}
