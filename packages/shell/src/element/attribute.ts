import { Mutable } from '@sgrud/core';
import { Component } from './component';

/**
 * @param name - Component attribute name.
 * @returns Prototype property decorator.
 */
export function Attribute(name?: string) {

  /**
   * @param prototype - Prototype to be decorated.
   * @param propertyKey - Prototype property to be decorated.
   */
  return function(
    prototype: Component,
    propertyKey: PropertyKey
  ): void {
    const key = name || propertyKey as string;
    ((prototype as Mutable<Component>).observedAttributes ||= []).push(key);

    Object.defineProperty(prototype, propertyKey, {
      get(this: Component): string | null {
        return this.getAttribute(key);
      },
      set(this: Component, value: string): void {
        if (this.shadowRoot || !this.hasAttribute(key)) {
          this.setAttribute(key, value);
        }
      }
    });
  };

}
