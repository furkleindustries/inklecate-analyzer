import {
  InkNodeHistoryItem,
} from 'inklecate-walker/src/InkNodeHistoryItem';
import {
  InkNodeHistoryItemLineContent,
} from 'inklecate-walker/src/InkNodeHistoryItemLineContent';
import {
  List,
  ListItem,
  Typography,
} from '../../bundles/componentsBundle';

import * as React from 'react';

interface Props {
  readonly item:
    InkNodeHistoryItem &
    { content: InkNodeHistoryItemLineContent };
}

export const AnalysisDetailedPrintoutItemLine: React.FunctionComponent<
  Props
> = ({
  item: {
    content: {
      tags,
      text,
    },

    id,
  },
}) => (
  <div>
    <List>
      {tags.map((tag, key) => (
        <ListItem>
          <Typography>
            ({id}) # {tag}
          </Typography>
        </ListItem>
      ))}
    </List>

    <Typography>({id}) {text}</Typography>
  </div>
);