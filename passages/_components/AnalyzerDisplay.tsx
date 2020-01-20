import {
  AnalysisDisplay,
} from './AnalysisDisplay';
import {
  AnalysisItem,
} from './AnalysisItem';
import {
  AnalyzerDisplayColumns,
} from './AnalyzerDisplayColumns';
import {
  getAnalysesFromItemHistories,
} from '../_functions/getAnalysesFromItemHistories';
import {
  InkNodeHistoryItem,
} from 'inklecate-walker/src/InkNodeHistoryItem';
import {
  InkTree,
} from 'inklecate-walker/src/InkTree';
import {
  IStoryStateFrame,
} from '../../src/state/IStoryStateFrame';
import MaterialTable from 'material-table';

import * as React from 'react';

interface Props {
  readonly setStoryState: (updatedStoryState: Partial<IStoryStateFrame>) => void;
  readonly tree: InkTree;
}

interface State {
  readonly analyses: readonly AnalysisItem[];
  readonly loaded: boolean;
}

export const stripCharRegexp = new RegExp(/[*.,-_=+/\\<>?!@#$%^&*();:'"`~“”…]/g);

export class AnalyzerDisplay extends React.PureComponent<
  Props,
  State
> {
  public readonly state: State = {
    analyses: [],
    loaded: false,
  };

  public readonly componentDidMount = () => {
    const { tree } = this.props;

    const itemHistoryProm = new Promise<
      readonly ReadonlyArray<InkNodeHistoryItem>[]
    >((resolve) => {
      const internalProms = [];
      for (let ii = 0; ii < tree.iterationCount; ii += 1) {
        internalProms.push(new Promise<readonly InkNodeHistoryItem[]>((resolve) => {
          tree.getContentItemHistory(ii).then(resolve)
        }));
      }

      Promise.all(internalProms).then(resolve);
    });

    itemHistoryProm.then(this.createAnalysesFromItemHistories);
  };

  public readonly render = () => {
    const {
      analyses,
      loaded,
    } = this.state;

    if (analyses.length === 1) {
      return (
        <AnalysisDisplay analysis={analyses[0]} />
      );
    }

    return (
      <div>
        {loaded ?
          <MaterialTable
            columns={AnalyzerDisplayColumns}
            data={analyses.map(({
              hash: id,
              itemHistory,
              namedContentVisits,
              pathHistory,
              printout,
              stateChanges,
              stateHistory,
              weight,
            }) => ({
              analysis: {
                hash: id,
                itemHistory,
                namedContentVisits,
                pathHistory,
                printout,
                stateHistory,
                weight,
              },

              characterCount: printout.length,
              id,
              occurrences: weight,
              stateChanges,
            }))}

            detailPanel={({ analysis }) => (
              <AnalysisDisplay analysis={analysis} />
            )}

            options={{
              pageSize: 20,
              sorting: true,
            }}
          /> :
          'load.... duh..... zuh.... muh...'}
      </div>
    );
  };

  public readonly createAnalysesFromItemHistories = async (
    histories: ReadonlyArray<readonly InkNodeHistoryItem[]>,
  ) => {
    const analyses: readonly AnalysisItem[] = (
      await this.getAnalysesFromItemHistories(histories)
    );

    this.setState({
      analyses: this.dedupeAndWeightAnalyses(Object.freeze(analyses)),
      loaded: true,
    });
  };

  public readonly dedupeAndWeightAnalyses = (analyses: readonly AnalysisItem[]) => {
    const dedupedAndWeighted: Record<string, AnalysisItem> = {};
    analyses.forEach((analysis) => {
      if (!(analysis.hash in dedupedAndWeighted)) {
        dedupedAndWeighted[analysis.hash] = analysis;
      } else {
        dedupedAndWeighted[analysis.hash] = {
          ...analysis,
          weight: analysis.weight + 1,
        };
      }
    });

    return [ ...Object.values(dedupedAndWeighted) ];
  };

  public readonly getAnalysesFromItemHistories = (
    histories: ReadonlyArray<ReadonlyArray<InkNodeHistoryItem>>,
  ) => (
    getAnalysesFromItemHistories(histories)
  )
}
