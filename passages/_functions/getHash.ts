import {
  AnalysisItem,
} from '../_components/AnalysisItem';

// @ts-ignore
import * as shajs from 'sha.js';

export const getHash = ({
  pathHistory,
  printout,
  stateHistory,
}: {
  pathHistory: AnalysisItem['pathHistory'],
  printout: AnalysisItem['printout'],
  stateHistory: AnalysisItem['stateHistory'],
}): string => {
  const identifyingObject = {
    pathHistory: pathHistory.map(({ id }) => id),
    printout,
    stateHistory: stateHistory.map(({ content }) => content),
  };

  const identifyingString = JSON.stringify(identifyingObject);
  const hash = shajs('sha256').update(identifyingString).digest('hex');

  return hash;
};
