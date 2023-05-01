import { assign, Assign, Linker, TypeOf } from '@sgrud/core';
import { customElements } from '../component/registry';
import { Router } from './router';

/**
 * Interface describing the shape of a **Route**. A **Route** must consist of at
 * least a {@link path} and may specify a {@link component}, as well as
 * {@link slots}, which will be rendered into the {@link RouterOutlet} when the
 * **Route** is {@link Router.navigate}d to. Furthermore a **Route** may also
 * specify {@link children}.
 *
 * @typeParam S - The **Route** {@link Route.path} string type.
 *
 * @example
 * Define a **Route**:
 * ```ts
 * import { type Route } from '@sgrud/shell';
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
 * @see {@link Router}
 */
export interface Route<S extends string = string> {

  /**
   * Optional array of **children** for this {@link Route}.
   */
  readonly children?: Route[];

  /**
   * Optional {@link Route} **component**.
   */
  readonly component?: CustomElementTagName;

  /**
   * Required {@link Route} **path**.
   */
  readonly path: S;

  /**
   * Optional mapping of elements to their **slots**.
   */
  readonly slots?: Record<string, CustomElementTagName>;

}

/**
 * Unique symbol used as property key by the {@link Route} decorator to
 * associate the supplied {@link Route} configuration with the decorated
 * element.
 */
export const route = Symbol('@sgrud/shell/router/route');

/**
 * Class decorator factory. Applying the **Route** decorator to a custom element
 * will associate the supplied `config` with the decorated element constructor.
 * Further, the `config`ured children are iterated over and every child that is
 * a custom element itself will be replaced by its respective {@link route}
 * configuration or ignored, if no configuration was associated with the child.
 * Finally, the processed `config` is added to the {@link Router}.
 *
 * @param config - The {@link Route} `config` for this element.
 * @typeParam S - The {@link Route} path string type.
 * @returns A class constructor decorator.
 *
 * @example
 * Associate a {@link Route} `config` to a {@link Component}:
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
 * export class ExampleComponent extends HTMLElement implements Component {}
 * ```
 *
 * @see {@link Router}
 */
export function Route<S extends string>(config: Assign<{
  children?: (Route | CustomElementConstructor & { [route]?: Route })[];
  slots?: Record<string, CustomElementTagName | CustomElementConstructor>;
}, Omit<Route<S>, 'component'>> & {

  /**
   * Optional **parent** for this {@link Route}.
   */
  parent?: Route | CustomElementConstructor & { [route]?: Route };

}) {

  /**
   * @param constructor - The class `constructor` to be decorated.
   */
  return function<T extends CustomElementConstructor & { [route]?: Route<S> }>(
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
