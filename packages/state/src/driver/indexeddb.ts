import { Store } from '../store/store';

/**
 * **IndexedDB** {@link Store.Driver}. This class provides a facade derived from
 * the built-in {@link Storage} interface to {@link IDBDatabase}s within the
 * browser. This class implementing the {@link Store.Driver} contract is used as
 * backing storage by the {@link StateWorker}, if run in a browser environment.
 *
 * @see {@link Store.Driver}
 */
export class IndexedDB implements Store.Driver {

  /**
   * Private **database** used as backing storage to read/write key/value pairs.
   */
  private readonly database: Promise<IDBDatabase>;

  /**
   * Returns the number of key/value pairs.
   */
  public get length(): Promise<number> {
    return this.database.then((database) => new Promise((resolve, reject) => {
      const session = database.transaction(this.version, 'readonly');
      const request = session.objectStore(this.version).count();

      request.onerror = reject;
      request.onsuccess = () => resolve(request.result);
    }));
  }

  /**
   * Public {@link IndexedDB} **constructor** consuming the `name` and `version`
   * used to construct this instance of a {@link Store.Driver}.
   *
   * @param name - The `name` to address this instance by.
   * @param version - The `version` of this instance.
   */
  public constructor(

    /**
     * The `name` to address this instance by.
     */
    public readonly name: string,

    /**
     * The `version` of this instance.
     */
    public readonly version: string

  ) {
    this.database = new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const version = parseInt(this.version.replace(/[^\d]/g, ''));
      const request = indexedDB.open(this.name, version);

      request.onerror = reject;
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => request.result
        .createObjectStore(this.version, { keyPath: 'key' })
        .createIndex('key', 'key', { unique: true });
    });
  }

  /**
   * Removes all key/value pairs, if there are any.
   *
   * @returns A {@link Promise} resolving when this instance was **clear**ed.
   */
  public clear(): Promise<void> {
    return this.database.then((database) => new Promise((resolve, reject) => {
      const session = database.transaction(this.version, 'readwrite');
      const request = session.objectStore(this.version).clear();

      request.onerror = reject;
      request.onsuccess = () => resolve();
    }));
  }

  /**
   * Returns the current value associated with the given `key`, or null if the
   * given `key` does not exist.
   *
   * @param key - The `key` to retrieve the current value for.
   * @returns A {@link Promise} resolving to the current value or null.
   */
  public getItem(key: string): Promise<string | null> {
    return this.database.then((database) => new Promise((resolve, reject) => {
      const session = database.transaction(this.version, 'readonly');
      const request = session.objectStore(this.version).get(key);

      request.onerror = reject;
      request.onsuccess = () => resolve(request.result?.value ?? null);
    }));
  }

  /**
   * Returns the name of the nth key, or null if n is greater than or equal to
   * the number of key/value pairs.
   *
   * @param index - The `index` of the **key** to retrieve.
   * @returns A {@link Promise} resolving to the name of the **key** or null.
   */
  public key(index: number): Promise<string | null> {
    return this.database.then((database) => new Promise((resolve, reject) => {
      const session = database.transaction(this.version, 'readonly');
      const request = session.objectStore(this.version).openCursor();

      request.onerror = reject;
      request.onsuccess = () => index
        ? index = request.result!.advance(index)!
        : resolve(request.result?.value?.key ?? null);
    }));
  }

  /**
   * Removes the key/value pair with the given `key`, if a key/value pair with
   * the given `key` exists.
   *
   * @param key - The `key` to delete the key/value pair by.
   * @returns A {@link Promise} resolving when the key/value pair was removed.
   */
  public removeItem(key: string): Promise<void> {
    return this.database.then((database) => new Promise((resolve, reject) => {
      const session = database.transaction(this.version, 'readwrite');
      const request = session.objectStore(this.version).delete(key);

      request.onerror = reject;
      request.onsuccess = () => resolve();
    }));
  }

  /**
   * Sets the `value` of the pair identified by `key` to `value`, creating a new
   * key/value pair if none existed for `key` previously.
   *
   * @param key - The `key` to set the key/value pair by.
   * @param value - The `value` to associate with the `key`.
   * @returns A {@link Promise} resolving when the key/value pair was set.
   */
  public setItem(key: string, value: string): Promise<void> {
    return this.database.then((database) => new Promise((resolve, reject) => {
      const session = database.transaction(this.version, 'readwrite');
      const request = session.objectStore(this.version).put({ key, value });

      request.onerror = reject;
      request.onsuccess = () => resolve();
    }));
  }

}
