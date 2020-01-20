import {
  Checkbox,
  Input as MuiInput,
} from '@material-ui/core';
import {
  InputOwnProps,
} from './InputOwnProps';

import * as React from 'react';

export const Input: React.FunctionComponent<InputOwnProps> = ({
  children,
  color,
  type,
  value,
  ...props
}) => {
  if (type === 'checkbox') {
    return (
      <Checkbox
        {...props}
        checked={Boolean(value)}
        color={color as any}
      >
        {children}
      </Checkbox>
    );
  }

  return (
    <MuiInput
      {...props}
      type={type}
      value={String(value || '')}
    />
  );
};
