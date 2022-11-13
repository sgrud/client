/**
 * `@sgrud/data` - The [SGRUD][] Data Model.
 *
 * The functions and classes found within this module are intended to ease the
 * type safe data handling, i.e., retrieval, mutation and storage, throughout
 * applications building upon the [SGRUD][] client libraries. By extending the
 * [Model][] class and applying adequate decorators to the contained properties,
 * the resulting extension will, in its static context, provide all necessary
 * means to interact directly with the underlying repository, while the instance
 * context of any class extending the abstract [Model][] base class will inherit
 * methods to observe changes to its instance field values, selectively
 * complement the instance with fields from the backing data storage via type
 * safe graph representations and to delete the respective instance from the
 * data storage.
 *
 * [Model]: https://sgrud.github.io/client/classes/data.Model
 * [SGRUD]: https://sgrud.github.io
 *
 * @packageDocumentation
 */

export * from './src/model/enum';
export * from './src/model/model';
export * from './src/querier/http';
export * from './src/querier/querier';
export * from './src/relation/has-many';
export * from './src/relation/has-one';
export * from './src/relation/property';
