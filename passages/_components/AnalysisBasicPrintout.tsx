import {
  AnalysisItem,
} from './AnalysisItem';
import {
  Typography,
} from '../../bundles/componentsBundle';

import * as React from 'react';

interface Props {
  readonly analysis: AnalysisItem;
}

export const AnalysisBasicPrintout: React.FunctionComponent<
  Props
> = ({
  analysis: { printout },
}) => (
  <div>
    <Typography variant="h4">Printout:</Typography>
    <Typography variant="body1">{
      printout
        .split('\n')
        .filter(Boolean)
        .map((line, key) => (
          <Typography
            key={key}
            style={{
              display: 'block',
              marginBottom: '5px',
              textAlign: 'left',
            }}

            variant="body1"
          >
            {line}
          </Typography>
        ))
    }</Typography>
  </div>
)