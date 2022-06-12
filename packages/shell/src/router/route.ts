import { assign, Assign, Linker, TypeOf } from '@sgrud/core';
import { customElements } from '../component/registry';
import { Router } from './router';

/**
 * Interface describing the shape of a route. A route must consist of at least a
 * {@link path} and may declare a {@link component}, which will be rendered when
 * the route is navigated to, as well as {@link slots} and components which will
 * be slotted within those. Furthermore a route may specify {@link children}.
 *
 * @typeParam S - Route path string type.
 *
 * @example Define a route.
 * ```ts
 * import type { Route } from '@sgrud/shell';
 *
 * const route: Route = {
 *   path: '',
 *   component: 'example-component',
 *   children: [
 *     {
 *       path: 'child',
 *       component: 'child-component'
 *     }
 *   ]
 * };
 * ```
 *
 * @see {@link Router}
 */
export interface Route<S extends string = string> {

  /**
   * Optional array of children for this route.
   */
  readonly children?: Route[];

  /**
   * Optional route component.
   */
  readonly component?: CustomElementTagName;

  /**
   * Required route path.
   */
  readonly path: S;

  /**
   * Optional mapping of slot names to slotted components.
   */
  readonly slots?: Record<string, CustomElementTagName>;

}

/**
 * Symbol used as property key by the {@link Route} decorator to associate the
 * supplied route configuration to the decorated component.
 *
 * @see {@link Route}
 */
export const route = Symbol('@sgrud/shell/router/route');

/**
 * Class decorator factory. Applying this decorator to a custom component will
 * associate the supplied route `config`uration to the decorated component
 * constructor. Further, the `config`ured children are iterated and every child
 * that is a custom element itself will be replaced by its respective route
 * `config`uration. Finally, the processed `config`uration for the decorated
 * component is associated to the component constructor and added to the
 * {@link Router}.
 *
 * @param config - Route configuration for this component.
 * @typeParam S - Route path string type.
 * @returns Class decorator.
 *
 * @example Associate a route `config`uration to a component.
 * ```ts
 * import { Component, Route } from '@sgrud/shell';
 * import { ChildComponent } from './child-component';
 *
 * @Route({
 *   path: 'example',
 *   children: [
 *     ChildComponent
 *   ]
 * })
 * @Component('example-component')
 * export class ExampleComponent extends HTMLElement implements Component { }
 * ```
 *
 * @see {@link Router}
 */
export function Route<S extends string>(config: Assign<{
  children?: (Route | typeof HTMLElement & { [route]?: Route })[];
  slots?: Record<string, CustomElementTagName | typeof HTMLElement>;
}, Omit<Route<S>, 'component'>> & {

  /**
   * Optional parent for this route.
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
