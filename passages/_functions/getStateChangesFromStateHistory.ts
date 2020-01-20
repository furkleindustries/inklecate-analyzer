import {
  InkStateHistory,
} from 'inklecate-walker/src/InkStateHistory';

export const getStateChangesFromStateHistory = (stateHistory: readonly InkStateHistory[]) => {
  const changes: Array<Record<string, string | number | null>> = [];
  let counter = 0;
  let lastSeen: Record<string, string | number | null> = stateHistory[0].content;
  for (const { content } of stateHistory) {
    if (counter) {
      const change: Record<string, string | number | null> = {};

      const sortedKeys = Object.keys(content).sort();
      const sortedValues = sortedKeys.map((key) => content[key]);

      const lastSortedKeys = Object.keys(lastSeen).sort();
      const lastSortedValues = lastSortedKeys.map((key) => lastSeen[key]);

      if (lastSortedKeys.length > sortedKeys.length) {
        for (let ii = 0; ii < lastSortedKeys.length; ii += 1) {
          const key = lastSortedKeys[ii];
          if (!(key in content)) {
            change[key] = null;
          }
        } 
      }

      for (let ii = 0; ii < sortedKeys.length; ii += 1) {
        const key = sortedKeys[ii];
        const value = sortedValues[ii];
        const lastValue = lastSortedValues[ii];
        if (value !== lastValue) {
          change[key] = value;
        }
      }
    } else {
      /**
       * Just use the first state for the first "change."
       */
      changes.push(content);
    }

    counter += 1;
    lastSeen = content;
  }

  return Object.freeze(changes);
};
