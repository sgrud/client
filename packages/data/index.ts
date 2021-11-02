/**
 * `@sgrud/data` - The [SGRUD](https://github.com/sgrud/client) data model.
 *
 * The functionality implemented within this package is intended to ease the
 * type safe data handling, i.e., retrieval, mutation and storage, throughout
 * applications building upon the `@sgrud` libraries. By extending the Model
 * class and applying adequate decorators to the contained properties, the
 * resulting extension will, in its static context, provide all necessary means
 * to interact directly with the underlying repository, while the instance
 * context of any class extending the abstract model base class will inherit
 * methods to observe changes to its instance field values, selectively
 * complement the instance with fields from the backing data storage via type
 * safe graph representations and to delete the respective instance from the
 * data storage.
 *
 * The different functions and classes implemented within this module can be
 * roughly categorized into the following functional aspects.
 *
 * - Models and their relations
 *   - {@link Model}: abstract base class to implement data models
 *   - {@link Property}: model field decorator for primitive properties
 *   - {@link HasOne}: model field decorator for one-to-one relationships
 *   - {@link HasMany}: model field decorator for one-to-many relationships
 * - Data queriers
 *   - {@link Querier}: abstract base class to implement data queriers
 *   - {@link HttpQuerier}: built-in HTTP-based data querier
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
