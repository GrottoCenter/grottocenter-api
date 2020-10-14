import * as React from 'react';

export const returnObject = ([currentValue, set]) => ({
  isTrue: currentValue,
  isOpen: currentValue,
  toggle: () => set(!currentValue),
  true: () => set(true),
  false: () => set(false),
  open: () => set(true),
  close: () => set(false),
});

export function useBoolean(defaultValue = false) {
  const [state, setState] = React.useState(defaultValue);
  return returnObject([state, setState]);
}
