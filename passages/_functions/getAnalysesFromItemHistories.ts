import {
  AnalysisItem,
} from '../_components/AnalysisItem';
import {
  getStateChangesFromStateHistory,
} from './getStateChangesFromStateHistory';
import {
  InkNodeHistoryItem,
} from 'inklecate-walker/src/InkNodeHistoryItem';
import {
  InkTree,
} from 'inklecate-walker/src/InkTree';

export const getAnalysesFromItemHistories = ({
  histories,
  tree: {
    getPrintoutFromContentItemHistory,
    namedContentVisits: namedContentVisitsWhole,
    pathHistories,
    stateHistories,
  },
}: {
  readonly histories: ReadonlyArray<ReadonlyArray<InkNodeHistoryItem>>,
  readonly tree: InkTree,
}) => (
  Promise.all(
    histories.map<Promise<AnalysisItem>>((itemHistory, index) => new Promise(async (resolve) => {
      const { [index]: namedContentVisits } = namedContentVisitsWhole;
      const { [index]: pathHistory } = pathHistories;
      const { [index]: stateHistory } = stateHistories;

      const printout = await getPrintoutFromContentItemHistory(itemHistory);
      const hash = getHash({
        pathHistory,
        printout,
        stateHistory,
      });

      const stateChanges = getStateChangesFromStateHistory(stateHistory);

      return resolve({
        hash,
        itemHistory,
        namedContentVisits,
        pathHistory,
        printout,
        stateChanges,
        stateHistory,
        weight: 1,
      });
    }))
  )
);
