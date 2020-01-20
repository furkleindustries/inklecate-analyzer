/* This file was generated automatically and any changes made to it will be
 * overwritten on the next build. */
import { IStoryOptionManifestItem } from '../src/storyOptions/IStoryOptionManifestItem';

import import_0 from '../options/sound-manager/sound-manager';

const manifest: readonly IStoryOptionManifestItem[] = [
  {
    asset: import_0,
    filepath: `C:\Users\furkl\code\inklecate-analyzer\options\sound-manager\sound-manager.tsx`,
  },
];

export default manifest;

export const registry = {
  "sound-manager": "sound-manager"
}

/* Needed for HMR and RHL functionality with authored assets. */
if (process.env.NODE_ENV === 'development' && (module as any).hot) {
  (module as any).hot.accept([
    '../options/sound-manager/sound-manager',
  ]);
}
