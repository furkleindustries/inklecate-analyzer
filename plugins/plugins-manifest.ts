/* This file was generated automatically and any changes made to it will be
 * overwritten on the next build. */

import { IPluginManifestItem } from '../src/plugins/IPluginManifestItem';
import import_0 from '../plugins/debug/debug';
import import_1 from '../plugins/menu/menu';

const manifest: readonly IPluginManifestItem[] = [
  {
    asset: import_0,
    filepath: `C:\Users\furkl\code\inklecate-analyzer\plugins\debug\debug.tsx`,
  },
  {
    asset: import_1,
    filepath: `C:\Users\furkl\code\inklecate-analyzer\plugins\menu\menu.tsx`,
  },
];

export default manifest;

export const registry = {
  "debug": "debug",
  "menu": "menu"
}

/* Needed for HMR and RHL functionality with authored assets. */
if (process.env.NODE_ENV === 'development' && (module as any).hot) {
  (module as any).hot.accept([
    '../plugins/debug/debug',
,    '../plugins/menu/menu',
  ]);
}
