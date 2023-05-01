/**
 * **`@sgrud/data`** - The [SGRUD](https://sgrud.github.io) Data Model.
 *
 * The functions and classes found within the **`@sgrud/data`** module are
 * intended to ease the type safe data handling, i.e., retrieval, mutation and
 * storage, within applications built upon the [SGRUD](https://sgrud.github.io)
 * client libraries. By extending the {@link Model} class and applying adequate
 * decorators to the contained properties, the resulting extension will, in its
 * static context, provide all necessary means to interact directly with the
 * underlying repository, while the instance context of any class extending the
 * abstract {@link Model} base class will inherit methods to observe changes to
 * its instance field values, selectively complement the instance with fields
 * from the backing data storage via type safe graph representations and to
 * delete the respective instance from the data storage.
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
