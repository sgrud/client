import { assign, Assign, Linker, TypeOf } from '@sgrud/core';
import { customElements } from '../component/registry';
import { Router } from './router';

/**
 * Interface describing the shape of a **Route**. A **Route** must consist of at
 * least a *path* and may declare a *component*, which will be rendered when the
 * **Route** is navigated to, as well as *slots* and elements which will be
 * slotted within those. Furthermore a **Route** may also specify *children*.
 *
 * [Router]: https://sgrud.github.io/client/classes/shell.Router
 *
 * @typeParam S - **Route** path string type.
 *
 * @example
 * Define a **Route**:
 * ```ts
 * import type { Route } from '@sgrud/shell';
 *
 * const route: Route = {
 *   path: '',
 *   component: 'example-element',
 *   children: [
 *     {
 *       path: 'child',
 *       component: 'child-element'
 *     }
 *   ]
 * };
 * ```
 *
 * @see [Router][]
 */
export interface Route<S extends string = string> {

  /**
   * Optional array of **children** for this route.
   */
  readonly children?: Route[];

  /**
   * Optional route **component**.
   */
  readonly component?: CustomElementTagName;

  /**
   * Required route **path**.
   */
  readonly path: S;

  /**
   * Optional mapping of **slots** to their elements.
   */
  readonly slots?: Record<string, CustomElementTagName>;

}

/**
 * Unique symbol used as property key by the [Route][] decorator to associate
 * the supplied route configuration to the decorated element.
 *
 * [Route]: https://sgrud.github.io/client/functions/shell.Route
 */
export const route = Symbol('@sgrud/shell/router/route');

/**
 * Class decorator factory. Applying the **Route** decorator to a custom element
 * will associate the supplied [Route][] `config` to the decorated element
 * constructor. Further, the configured children are iterated and every child
 * that is a custom element itself will be replaced by its respective [Route][].
 * Finally, the processed `config` for the decorated element is associated to
 * the element constructor and added to the [Router][].
 *
 * [Route]: https://sgrud.github.io/client/interfaces/shell.Route-1
 * [Router]: https://sgrud.github.io/client/classes/shell.Router
 *
 * @param config - [Route][] config for this element.
 * @typeParam S - Route path string type.
 * @returns Class decorator.
 *
 * @example
 * Associate a [Route][] `config` to a element:
 * ```ts
 * import { Component, Route } from '@sgrud/shell';
 * import { ChildComponent } from './child-component';
 *
 * ⁠@Route({
 *   path: 'example',
 *   children: [
 *     ChildComponent
 *   ]
 * })
 * ⁠@Component('example-element')
 * export class ExampleComponent extends HTMLElement implements Component { }
 * ```
 *
 * @see [Router][]
 */
export function Route<S extends string>(config: Assign<{
  children?: (Route | typeof HTMLElement & { [route]?: Route })[];
  slots?: Record<string, CustomElementTagName | typeof HTMLElement>;
}, Omit<Route<S>, 'component'>> & {

  /**
   * Optional parent for this [Route][].
   *
   * [Route]: https://sgrud.github.io/client/interfaces/shell.Route-1
   */
  parent?: Route | typeof HTMLElement & { [route]?: Route };

}) {

  /**
   * @param constructor - Class constructor to be decorated.
   */
  return function<T extends typeof HTMLElement & { [route]?: Route<S> }>(
    constructor: T
  ): void {
    const name = customElements.getName(constructor);

    if (name) {
      const router = new Linker<typeof Router>().get(Router);

      if (config.children?.length) {
        for (let i = config.children.length - 1; i >= 0; i--) {
          const child = config.children[i];

          if (TypeOf.function(child)) {
            if (child[route]) {
              config.children[i] = child[route]!;
            } else {
              config.children.splice(i, 1);
            }
          }
        }
      }

      for (const key in config.slots) {
        const component = config.slots[key];

        if (TypeOf.function(component)) {
          const slot = customElements.getName(component);

          if (slot) {
            config.slots[key] = slot as CustomElementTagName;
          } else {
            delete config.slots[key];
          }
        }
      }

      router.add(constructor[route] = assign(config as Route<S>, {
        component: name
      }));

      if (config.parent) {
        const parent = TypeOf.function(config.parent)
          ? config.parent[route]
          : config.parent;

        if (delete config.parent && parent) {
          router.add(assign(parent, {
            children: (parent.children || []).concat(constructor[route]!)
          }));
        }
      }
    }
  };

}
