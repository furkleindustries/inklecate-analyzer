import {
  InkNodeHistoryItem,
} from 'inklecate-walker/src/InkNodeHistoryItem';
import {
  Typography,
} from '../../bundles/componentsBundle';

import * as React from 'react';

interface Props {
  readonly item: InkNodeHistoryItem;
}

export const AnalysisDetailedPrintoutItemChoice: React.FunctionComponent<
  Props
> = ({
  item: {
    content,
    id,
  },
}) => (
  <Typography>({id}) * {content}</Typography>
);