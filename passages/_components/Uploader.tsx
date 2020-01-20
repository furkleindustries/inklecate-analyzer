import {
  Input,
} from '../../bundles/componentsBundle';

import * as React from 'react';

export class Uploader extends React.PureComponent<
  {
    readonly children: (args: {
      readonly filepath: string;
      readonly text: string;
    }) => React.ReactNode;

    readonly name: string;
    readonly onChange: (e: InputEvent) => void;
  },
  {
    readonly filepath: string;
    readonly loaded: boolean;
    readonly text: string;
  }
> {
  public readonly state = {
    filepath: '__NONE__',
    loaded: false,
    text: '',
  };

  public readonly render = () => (
    this.state.loaded ?
      this.props.children({
        filepath: this.state.filepath,
        text: this.state.text,
      }) :
      <Input
        id={this.props.name}
        name={this.props.name}
        onChange={this.onChange}
        type="file"
      />
  )

  public readonly onChange = (e: InputEvent) => {    
    const reader = new FileReader();
    if ((e.target as any).files && (e.target as any).files.length) {
      const [ file ] = (e.target as any).files;
      reader.readAsText(file);
      reader.onload = () => this.setState({
        filepath: file.name,
        loaded: true,
        text: String(reader.result && reader.result.toString()),
      });
    }
  };
};
