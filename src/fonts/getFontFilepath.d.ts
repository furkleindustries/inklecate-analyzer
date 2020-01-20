import {
  FontRanges,
} from './FontRanges';
import {
  FontStyles,
} from './FontStyles';

export function getFontFilepath(args: {
  readonly directory: string,
  readonly family: string,
  readonly range: FontRanges,
  readonly style: FontStyles;
  readonly weight: number,
}): string;
