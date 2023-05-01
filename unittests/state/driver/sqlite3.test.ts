import { SQLite3 } from '@sgrud/state';
import { createHash } from 'crypto';
import { existsSync, rmSync } from 'fs';
import { dirname, join } from 'path';

describe('@sgrud/state/driver/sqlite3', () => {

  /*
   * Fixtures
   */

  afterAll(() => rmSync(path));

  /*
   * Variables
   */

  const hash = createHash('md5').update('database').digest('hex');
  const path = join(dirname(require.resolve('@sgrud/state')), hash) + '.sdb';

  /*
   * Unittests
   */

  describe('constructing an instance', () => {
    const database = new SQLite3('database', '0.0.1');

    it('returns an instance', () => {
      expect(database).toBeInstanceOf(SQLite3);
    });

    it('creates a database file', () => {
      expect(existsSync(path)).toBeTruthy();
    });
  });

  describe('inserting records', () => {
    const database = new SQLite3('database', '0.0.1');

    it('correctly inserts records', async() => {
      await expect(database.setItem('1', 'one')).resolves.toBeUndefined();
      await expect(database.setItem('2', 'two')).resolves.toBeUndefined();
      await expect(database.length).resolves.toBe(2);
    });
  });

  describe('retrieving records', () => {
    const database = new SQLite3('database', '0.0.1');

    it('correctly retrieves records', async() => {
      await expect(database.getItem('1')).resolves.toBe('one');
      await expect(database.getItem('2')).resolves.toBe('two');
      await expect(database.getItem('unknown')).resolves.toBeNull();
    });
  });

  describe('retrieving records by key', () => {
    const database = new SQLite3('database', '0.0.1');

    it('correctly retrieves records by key', async() => {
      await expect(database.key(0)).resolves.toBe('1');
      await expect(database.key(1)).resolves.toBe('2');
      await expect(database.key(3)).resolves.toBeNull();
    });
  });

  describe('deleting records', () => {
    const database = new SQLite3('database', '0.0.1');

    it('correctly deletes records', async() => {
      await expect(database.length).resolves.toBe(2);
      await expect(database.removeItem('1')).resolves.toBeUndefined();
      await expect(database.length).resolves.toBe(1);
    });
  });

  describe('clearing all records', () => {
    const database = new SQLite3('database', '0.0.1');

    it('correctly clears all records', async() => {
      await expect(database.clear()).resolves.toBeUndefined();
      await expect(database.length).resolves.toBe(0);
    });
  });

});
