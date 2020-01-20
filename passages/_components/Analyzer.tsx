import {
  AnalyzerDisplay,
} from './AnalyzerDisplay';
import {
  createStoryStateAction,
} from '../../src/actions/creators/createStoryStateAction';
import {
  Story,
} from 'inkjs/engine/Story';
import {
  InkTree,
} from 'inklecate-walker/src/InkTree';
import {
  IStoryStateFrame,
} from '../../src/state/IStoryStateFrame';
import {
  MapDispatchToProps,
  connect,
} from 'react-redux';
import {
  walk,
} from 'inklecate-walker/src/walk';

import * as React from 'react';


interface Props {
  readonly filepath: string;
  readonly inkJson: object;
  readonly iterationCount?: number;
  readonly setStoryState: (
    updatedStoryState: Partial<IStoryStateFrame>,
  ) => void;

  readonly storyState: IStoryStateFrame;
}

interface State {
  readonly tree: InkTree | null;
}

export class Analyzer extends React.PureComponent<
  Props,
  State
> {
  public readonly state: State = { tree: null };

  constructor(props: Props) {
    super(props);

    const {
      filepath,
      inkJson,
      iterationCount,
      setStoryState,
    } = props;

    const story = new Story(inkJson);
    new Promise((resolve) => {
      walk({
        iterationCount: Number(iterationCount) || 1,
        inputFilepath: filepath,
        story,
      }).then(
        (tree: InkTree) => {
          setStoryState({ loaded: true });
          this.setState({ tree });
          resolve();
        },
  
        (err: Error) => { throw err; },
      )
    })
  };

  public readonly render = () => {
    const {
      setStoryState,
      storyState: { loaded },
    } = this.props;

    const { tree } = this.state;
    
    return (
      <div>
        {
          loaded && tree ?
            <AnalyzerDisplay
              setStoryState={setStoryState}
              tree={tree!}
            /> :
            null
        }
      </div>
    );
  };
}

export const mapDispatchToProps: MapDispatchToProps<{}, {}> = (dispatch) => ({
  setStoryState: (updatedStoryState: any) => dispatch(createStoryStateAction(updatedStoryState)),
});

export const AnalyzerConnected = connect(null, mapDispatchToProps)(Analyzer);
