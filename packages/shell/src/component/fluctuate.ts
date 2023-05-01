import { Mutable, assign } from '@sgrud/core';
import { ObservableInput, from } from 'rxjs';
import { Component } from './component';

/**
 * {@link Component} prototype property decorator factory. Applying this
 * **Fluctuate** decorator to a property of a custom {@link Component} while
 * supplying a `streamFactory` that returns an {@link ObservableInput} upon
 * invocation will subscribe the {@link Component.fluctuationChangedCallback}
 * method to each emission from this {@link ObservableInput} and replace the
 * decorated property with a getter returning its last emitted value. Further,
 * the resulting subscription, referenced by the decorated property, is assigned
 * to the {@link Component.observedFluctuations} property and may be terminated
 * by unsubscribing manually. Finally, the {@link Component} will seize to
 * **Fluctuate** automatically when it's disconnected from the {@link Document}.
 *
 * @param streamFactory - A forward reference to an {@link ObservableInput}.
 * @returns A {@link Component} prototype property decorator.
 *
 * @example
 * A {@link Component} that **Fluctuate**s:
 * ```tsx
 * import { Component, Fluctuate } from '@sgrud/shell';
 * import { fromEvent } from 'rxjs';
 *
 * declare global {
 *   interface HTMLElementTagNameMap {
 *     'example-component': ExampleComponent;
 *   }
 * }
 *
 * ⁠@Component('example-component')
 * export class ExampleComponent extends HTMLElement implements Component {
 *
 *   ⁠@Fluctuate(() => fromEvent(document, 'click'))
 *   private readonly pointer?: MouseEvent;
 *
 *   public get template(): JSX.Element {
 *     return <span>Clicked at ({this.pointer?.x}, {this.pointer?.y})</span>;
 *   }
 *
 * }
 * ```
 *
 * @see {@link Component}
 */
export function Fluctuate(streamFactory: () => ObservableInput<unknown>) {

  /**
   * @param prototype - The {@link Component} `prototype` to be decorated.
   * @param propertyKey - The {@link Component} property to be decorated.
   */
  return function(prototype: Component, propertyKey: PropertyKey): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { connectedCallback, disconnectedCallback } = prototype;

    prototype.connectedCallback = function(this: Component): void {
      let fluctuation: unknown;

      assign((this as Mutable<Component>).observedFluctuations ||= {}, {
        [propertyKey]: from(streamFactory()).subscribe((next) => {
          this.fluctuationChangedCallback?.(
            propertyKey,
            fluctuation,
            fluctuation = next
          );
        })
      });

      Object.defineProperty(this, propertyKey, {
        enumerable: true,
        get: (): unknown => fluctuation,
        set: Function.prototype as (...args: any[]) => any
      });

      return connectedCallback
        ? connectedCallback.call(this)
        : this.renderComponent?.();
    };

    prototype.disconnectedCallback = function(this: Component): void {
      this.observedFluctuations![propertyKey].unsubscribe();
      disconnectedCallback?.call(this);
    };
  };

}
