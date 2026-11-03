/**
 * Storage adapter writing the bot pages into a local directory (dev, tests).
 *
 * Adapter interface, shared with AzureBlobStorageAdapter:
 *   put(key, html)   write or replace one page
 *   delete(key)      remove one page; resolves when it is already gone
 *   list()           async iterable of every key held
 */

const fs = require('fs');
const path = require('path');

// A process killed between the write and the rename leaves one behind: list()
// skips them, so the audit (#1887) does not report them as unknown pages.
const TEMPORARY_SUFFIX = '.part';

class LocalStorageAdapter {
  constructor(rootDir) {
    if (!rootDir) throw new Error('LocalStorageAdapter needs a directory');
    this.root = path.resolve(rootDir);
  }

  // A key is a relative POSIX path that stays under the root
  resolve(key) {
    const target = path.resolve(this.root, key);
    if (
      typeof key !== 'string' ||
      key === '' ||
      !target.startsWith(this.root + path.sep)
    ) {
      throw new RangeError(`Invalid storage key: ${key}`);
    }
    return target;
  }

  async put(key, html) {
    const target = this.resolve(key);
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    // Rename, so a reader never sees a half-written page
    const temporary = `${target}.${process.pid}.${Math.random()
      .toString(36)
      .slice(2)}${TEMPORARY_SUFFIX}`;
    try {
      await fs.promises.writeFile(temporary, html, 'utf8');
      await fs.promises.rename(temporary, target);
    } catch (error) {
      await fs.promises.rm(temporary, { force: true });
      throw error;
    }
  }

  async delete(key) {
    await fs.promises.rm(this.resolve(key), { force: true });
  }

  async *list() {
    const walk = async function* walk(directory, prefix) {
      let entries;
      try {
        entries = await fs.promises.readdir(directory, {
          withFileTypes: true,
        });
      } catch (error) {
        if (error.code === 'ENOENT') return;
        throw error;
      }
      // eslint-disable-next-line no-restricted-syntax
      for (const entry of entries) {
        const key = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          yield* walk(path.join(directory, entry.name), key);
        } else if (!entry.name.endsWith(TEMPORARY_SUFFIX)) {
          yield key;
        }
      }
    };
    yield* walk(this.root, '');
  }
}

module.exports = LocalStorageAdapter;
