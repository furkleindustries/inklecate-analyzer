import {
  AnalysisDetailedPrintoutItem,
} from './AnalysisDetailedPrintoutItem';
import {
  AnalysisItem,
} from './AnalysisItem';
import {
  List,
  ListItem,
  Typography,
} from '../../bundles/componentsBundle';
import {
  InkNodeTypes,
} from 'inklecate-walker/src/InkNodeTypes';

import * as React from 'react';

interface Props {
  readonly analysis: AnalysisItem;
}

export const AnalysisDetailedPrintout: React.FunctionComponent<Props> = ({
  analysis: { itemHistory },
}) => {
  const childs: React.ReactNode[] = [];
  for (let ii = 0; ii < itemHistory.length; ii += 1) {
    const { [ii]: item } = itemHistory;
    const { type } = item;
    if (type === InkNodeTypes.ChoicePoint) {
      const choicePoint = [
        <Typography>***</Typography>
      ];

      let lastItem;
      let counter = ii;
      let done = false;
      while (!done) {
        counter += 1;
        lastItem = itemHistory[counter];

        if (lastItem &&
          (lastItem.type === InkNodeTypes.Choice ||
            lastItem.type === InkNodeTypes.ChoiceSelection))
        {
          choicePoint.push(
            <AnalysisDetailedPrintoutItem
              item={lastItem}
              key={choicePoint.length}
            />
          );
        } else {
          done = true;
        }
      }

      choicePoint.push(<Typography>***</Typography>);

      childs.push(choicePoint);
    } else if (type === InkNodeTypes.Line) {
      childs.push(
        <AnalysisDetailedPrintoutItem
          key={ii}
          item={item}
        />
      );
    }
  }
  
  return (
    <List>
      {childs.map((item, key) => (
        <ListItem key={key}>
          {item}
        </ListItem>
      ))}
    </List>
  );
};
