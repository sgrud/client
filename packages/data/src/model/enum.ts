export abstract class Enum extends globalThis.String { }

export function enumerate<T extends object>(enumerator: T): T {
  const result = { } as Record<string, Enum>;

  for (const key in enumerator) {
    const member = new String(enumerator[key]);
    Object.setPrototypeOf(member, Enum.prototype);
    result[key] = member;
  }

  return result as T;
}
