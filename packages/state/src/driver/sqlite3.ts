import { Database } from 'better-sqlite3';
import { Store } from '../store/store';

/**
 * **SQLite3** {@link Store.Driver}. This class provides a facade derived from
 * the built-in {@link Storage} interface to **SQLite3** databases under NodeJS.
 * This class implementing the {@link Store.Driver} contract is used as backing
 * storage by the {@link StateWorker}, if run in a NodeJS environment.
 *
 * @see {@link Store.Driver}
 */
export class SQLite3 implements Store.Driver {

  /**
   * Private **database** used as backing storage to read/write key/value pairs.
   */
  private readonly database: Database;

  /**
   * Returns the number of key/value pairs.
   */
  public get length(): Promise<number> {
    return new Promise((resolve) => this.database.transaction(() => {
      const result = this.database.prepare(`
        SELECT COUNT(*) AS count FROM '${this.version}'
      `).get() as { count: number };

      resolve(result.count);
    })());
  }

  /**
   * Public {@link SQLite3} **constructor** consuming the `name` and `version`
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
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const Database = require('better-sqlite3');
    const { createHash } = require('crypto');
    const { join } = require('path');

    process.on('exit', () => this.database.close());
    process.on('SIGHUP', () => process.exit(128 + 1));
    process.on('SIGINT', () => process.exit(128 + 2));
    process.on('SIGTERM', () => process.exit(128 + 15));

    const hash = createHash('md5').update(this.name).digest('hex');
    this.database = new Database(join(__dirname, hash) + '.sdb').exec(`
      CREATE TABLE IF NOT EXISTS '${this.version}' (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      )
    `);
  }

  /**
   * Removes all key/value pairs, if there are any.
   *
   * @returns A {@link Promise} resolving when this instance was **clear**ed.
   */
  public clear(): Promise<void> {
    return new Promise((resolve) => this.database.transaction(() => {
      this.database.prepare(`
        DELETE FROM '${this.version}'
      `).run();

      resolve();
    })());
  }

  /**
   * Returns the current value associated with the given `key`, or null if the
   * given `key` does not exist.
   *
   * @param key - The `key` to retrieve the current value for.
   * @returns A {@link Promise} resolving to the current value or null.
   */
  public getItem(key: string): Promise<string | null> {
    return new Promise((resolve) => this.database.transaction(() => {
      const result = this.database.prepare(`
        SELECT value FROM '${this.version}' WHERE key = '${key}'
      `).get() as { value: string | null } | undefined;

      resolve(result?.value ?? null);
    })());
  }

  /**
   * Returns the name of the nth key, or null if n is greater than or equal to
   * the number of key/value pairs.
   *
   * @param index - The `index` of the **key** to retrieve.
   * @returns A {@link Promise} resolving to the name of the **key** or null.
   */
  public key(index: number): Promise<string | null> {
    return new Promise((resolve) => this.database.transaction(() => {
      const result = this.database.prepare(`
        SELECT key FROM '${this.version}' WHERE ROWID = '${index + 1}'
      `).get() as { key: string | null } | undefined;

      resolve(result?.key ?? null);
    })());
  }

  /**
   * Removes the key/value pair with the given `key`, if a key/value pair with
   * the given `key` exists.
   *
   * @param key - The `key` to delete the key/value pair by.
   * @returns A {@link Promise} resolving when the key/value pair was removed.
   */
  public removeItem(key: string): Promise<void> {
    return new Promise((resolve) => this.database.transaction(() => {
      this.database.prepare(`
        DELETE FROM '${this.version}' WHERE key = '${key}'
      `).run();

      resolve();
    })());
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
    return new Promise((resolve) => this.database.transaction(() => {
      this.database.prepare(`
        INSERT INTO '${this.version}' (key, value) VALUES ('${key}', '${value}')
          ON CONFLICT(key) DO UPDATE SET value=excluded.value
      `).run();

      resolve();
    })());
  }

}
