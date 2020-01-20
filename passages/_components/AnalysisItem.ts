import {
  InkNodeHistoryItem,
} from 'inklecate-walker/src/InkNodeHistoryItem';
import {
  InkPathHistory,
} from 'inklecate-walker/src/InkPathHistory';
import {
  InkStateHistory,
} from 'inklecate-walker/src/InkStateHistory';

export interface AnalysisItem {
  readonly hash: string;
  readonly namedContentVisits: Record<string, number>;
  readonly pathHistory: readonly InkPathHistory<any>[];
  readonly printout: string;
  readonly itemHistory: readonly InkNodeHistoryItem[];
  readonly stateChanges: ReadonlyArray<Record<string, string | number | null>>;
  readonly stateHistory: readonly InkStateHistory[];
  readonly weight: number;
}
