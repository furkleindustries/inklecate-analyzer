import {
  Typography,
 } from '../../bundles/componentsBundle';
import {
  InkNodeHistoryItem,
} from 'inklecate-walker/src/InkNodeHistoryItem';

import * as React from 'react';

interface Props {
  readonly item: InkNodeHistoryItem;
}

export const AnalysisDetailedPrintoutItemChoiceSelection: React.FunctionComponent<
  Props
> = ({
  item: {
    content,
    id,
  },
}) => (
  <Typography>({id}) > #{content}</Typography>
);
