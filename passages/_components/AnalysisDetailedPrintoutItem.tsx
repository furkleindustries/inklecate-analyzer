import {
  AnalysisDetailedPrintoutItemChoice,
} from './AnalysisDetailedPrintoutItemChoice';
import {
  AnalysisDetailedPrintoutItemChoiceSelection,
} from './AnalysisDetailedPrintoutItemChoiceSelection';
import {
  AnalysisDetailedPrintoutItemLine,
} from './AnalysisDetailedPrintoutItemLine';
import {
  InkNodeHistoryItem,
} from 'inklecate-walker/src/InkNodeHistoryItem';
import {
  InkNodeTypes,
} from 'inklecate-walker/src/InkNodeTypes';

import * as React from 'react';;

interface Props {
  readonly item: InkNodeHistoryItem;
}

export const AnalysisDetailedPrintoutItem: React.FunctionComponent<Props> = ({
  item,
  item: { type },
}) => {
  if (type === InkNodeTypes.Choice) {
    return <AnalysisDetailedPrintoutItemChoice item={item} />; 
  } else if (type === InkNodeTypes.ChoiceSelection) {
    return <AnalysisDetailedPrintoutItemChoiceSelection item={item} />;
  } else if (type === InkNodeTypes.Line) {
    return <AnalysisDetailedPrintoutItemLine item={item as any} />;
  }

  return null;
};
