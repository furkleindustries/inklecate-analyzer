import {
  AnalysisItem,
} from './AnalysisItem';
import {
  AnalysisPrintout,
} from './AnalysisPrintout';
import {
  List,
  ListItem,
  Typography,
  Input,
} from '../../bundles/componentsBundle';

import * as React from 'react';

interface Props {
  readonly analysis: AnalysisItem;
}

interface State {
  readonly showDetailed: boolean;
  readonly showMetadata: boolean;
}

export class AnalysisDisplay extends React.PureComponent<
  Props,
  State
> {
  public readonly state: State = {
    showDetailed: false,
    showMetadata: false,
  };

  public readonly render = () => {
    const {
      analysis,
      analysis: {
        hash,
        itemHistory,
        pathHistory,
        stateHistory,
        weight,
      },
    } = this.props;

    console.log(itemHistory);

    const {
      showDetailed,
      showMetadata,
    } = this.state;

    return (
      <div>
        <div>
          <label htmlFor="detailed">
            Detailed output?
          </label>

          <Input
            name="detailed"
            onChange={this.onShowDetailedChange}
            type="checkbox"
            value={showDetailed}
          />
        </div>

        <div>
          <label htmlFor="metadata">
            Show extra metadata?
          </label>

          <Input
            name="showMetadata"
            onChange={this.onShowMetadataChange}
            type="checkbox"
            value={showMetadata}
          />
        </div>

        <div>
          <AnalysisPrintout
            analysis={analysis}
            showDetailed={showDetailed}
          />
        </div>

        {showMetadata ?
          <div>
            <div>
              <Typography variant="h4">Unique identifier (hash):</Typography>
              <br />
              <Typography variant="body1">
                <code>{hash}</code>
              </Typography>
            </div>

            <div>
              <Typography variant="h4">Path history</Typography>
              <List>
                {pathHistory.map(({ id }, key) => (
                  <ListItem key={key}>
                    {id}
                  </ListItem>
                ))}
              </List>
            </div>

            <div>
              <Typography variant="h4">State history changes:</Typography>
              <List>
                {stateHistory.map(({ content }, key) => (
                  <ListItem key={key}>
                    <pre>{JSON.stringify(content, null, 2)}</pre>
                  </ListItem>
                ))}
              </List>
            </div>

            <div>
              <Typography variant="h4">Times this precise walk occurred:</Typography>
              <br />
              <Typography variant="body1">{weight}</Typography>
            </div>
          </div> :
          null}
      </div>
    );
  };

  public readonly onShowDetailedChange = (e: Event) => this.setState({
    showDetailed: (e.target as any).checked,
  });

  public readonly onShowMetadataChange = (e: Event) => this.setState({
    showMetadata: (e.target as any).checked,
  });
}
