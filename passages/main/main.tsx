/* This can't be removed as it must be in scope for rewriting JSX to JS. */ 
import * as React from 'react';

import classnames from 'classnames';

/* Accelerator components, interfaces, styles, functions, etc. Feel free to
 * destructure this as you see fit. */
import * as components from '../../bundles/componentsBundle'; 

import * as passages from '../../bundles/passagesBundle';

/* You may leave the @ts-ignore directive here, remove it if you want compiler
 * errors should you not remove it from a passage which does not use the tags
 * bundle, or remove both if you have no intention of ever using tags. */
// @ts-ignore
import * as tags from '../../bundles/tagsBundle';

/**
 * The authoring passage is imported and rendered into the React passage.
 */
import AuthoringPassage from './main.mdx';

import builtInStyles from '../_global-styles/built-ins.less';
import styles from './main.less';
import { BuiltInTags } from '../../bundles/tagsBundle';

const Passage: React.FunctionComponent<passages.IPassageProps> = (props) => (
  <components.Article
    className={classnames(
      builtInStyles.passage,
      styles['main'],
      'passage',
    )}
  >
    <components.AuthoringPassageContainer passageProps={{ ...props }}>
      <AuthoringPassage />
    </components.AuthoringPassageContainer>
  </components.Article>
);

const passage: passages.IPassage = {
  /* string: the story-unique name of the passage. */
  name: 'main',
  
  /* Tag[]: an optional collection of either plain strings or
   * { key: string, value: string } (Tag) objects. */
  tags: [
    BuiltInTags.Start,
  ],

  /* React.ComponentType<IPassageProps>: the content that should be displayed,
   * or, in the case of noRender passages, a component that can be imported.
   * Should be formatted in JSX style. */
  content: Passage,
};

/* Always make the passage object a default export. */
export default passage;
