# Changelog

This file lists descriptions of top-level changes to the Accelerator framework from the perspective of a story author, as a boilerplate generated by the `accelerator-tool` ([git repository](//github.com/furkleindustries/accelerator-tool), [npm listing](//npmjs.com/package/accelerator-tool)) devtool.

* `0.11.0`
  * Added a custom font loading system which produces all the necessary parts for a best-practices font loading strategy based on a simple JS configuration object. This will likely be extracted into a separate package at a later date.
  * Added facades for `@material-ui/core` components.
  * Added a loading screen with an exposed API for critical, asynchronous loading logic, and progress indication to the reader.
  * Externalized rendering logic into the user space and added an Ink-like scroll-type renderer.
  * Added an auto-assembled menu widget based on user-creatable, tool-generatable story option assets. This widget also includes contextual rendering of menu objects based on a visibility tree, a breadcrumb navigation bar, and the ability to expose to users the mutation of serializable option values, e.g. through form inputs. This may be extracted into a separate package later, but would require significant refactoring to be useful on its own.
  * Updated all dependencies to ES modules and included paths for external packages to offer ES Modules for tree-shaken build consumption.
  * Rearranged passage object props so that relevant state is injected as props rather than being connected to the store. This allows present-state-agnostic rendering, which is necessary for scroll rendering and other more exotic styles.
  * Added `coreVersion` and `toolVersion` properties to the Accelerator config.
* `0.12.0`
  * Added `Article`, `Footer`, `Grid`, `Header`, `List`, and `Section` components.
  * Updated the styles of the sample passage.
  * Updated the `Card` component to transform media children into a `CardMedia` component.
* `0.13.0`
  * Added MDX for Markdown+React authoring passages.
  * Switched from Sass to LESS.
