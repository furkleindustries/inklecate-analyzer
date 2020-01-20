import {
  AnalysisBasicPrintout,
} from './AnalysisBasicPrintout';
import {
  AnalysisDetailedPrintout,
} from './AnalysisDetailedPrintout';
import {
  AnalysisItem,
} from './AnalysisItem';

import * as React from 'react';

interface Props {
  readonly analysis: AnalysisItem;
  readonly showDetailed?: boolean;
}

export const AnalysisPrintout: React.FunctionComponent<Props> = ({
  analysis,
  showDetailed,
}) => {
  if (showDetailed) {
    return (
      <AnalysisDetailedPrintout analysis={analysis} />
    );
  }

  return (
    <AnalysisBasicPrintout analysis={analysis} />
  );
};
