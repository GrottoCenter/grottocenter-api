/**
 * Storage adapter writing the bot pages into a local directory (dev, tests).
 *
 * Adapter interface, shared with AzureBlobStorageAdapter:
 *   put(key, body, { metadata, contentType })
 *                    write or replace one file; `body` is a string (written as
 *                    UTF-8) or a Buffer (written as is: a gzip sitemap shard);
 *                    `metadata` is an optional flat object of strings
 *                    (`redirectto` on a redirect page) that replaces the
 *                    file's previous metadata, none when absent; `contentType`
 *                    is optional, HTML when absent (the local adapter has no
 *                    content type to store and ignores it)
 *   delete(key)      remove one page and its metadata; resolves when it is
 *                    already gone
 *   get(key, { maxBytes })
 *                    the bytes of one page (a Buffer), or null when there is
 *                    none. Rejects with code E_BOT_PAGE_TOO_LARGE, without
 *                    reading the body, when the page is over `maxBytes` (the
 *                    audit, #1887, reads pages back as crawlers see them)
 *   list()           async iterable of every key held
 */

const fs = require('fs');
const path = require('path');

// A process killed between the write and the rename leaves one behind: list()
// skips them, so the audit (#1887) does not report them as unknown pages.
const TEMPORARY_SUFFIX = '.part';
// The metadata of `caves/1.html` is kept in `caves/1.html.metadata.json`, which
// list() does not report: it is not a page
const METADATA_SUFFIX = '.metadata.json';

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

  // Writes through a temporary file and a rename, so a reader never sees half a file
  static async writeAtomically(target, content) {
    const temporary = `${target}.${process.pid}.${Math.random()
      .toString(36)
      .slice(2)}${TEMPORARY_SUFFIX}`;
    try {
      // A Buffer is written as is; the encoding applies to a string only
      await fs.promises.writeFile(temporary, content, 'utf8');
      await fs.promises.rename(temporary, target);
    } catch (error) {
      await fs.promises.rm(temporary, { force: true });
      throw error;
    }
  }

  async put(key, body, { metadata } = {}) {
    const target = this.resolve(key);
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    // The metadata first: a crash in between leaves the old page with the new
    // metadata, and the manifest (written after) still holds the old hash, so
    // the next run writes both again
    if (metadata && Object.keys(metadata).length > 0) {
      await LocalStorageAdapter.writeAtomically(
        `${target}${METADATA_SUFFIX}`,
        JSON.stringify(metadata)
      );
    } else {
      await fs.promises.rm(`${target}${METADATA_SUFFIX}`, { force: true });
    }
    await LocalStorageAdapter.writeAtomically(target, body);
  }

  async delete(key) {
    const target = this.resolve(key);
    await fs.promises.rm(target, { force: true });
    await fs.promises.rm(`${target}${METADATA_SUFFIX}`, { force: true });
  }

  async get(key, { maxBytes = Infinity } = {}) {
    const target = this.resolve(key);
    let stat;
    try {
      stat = await fs.promises.stat(target);
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
    if (stat.size > maxBytes) throw LocalStorageAdapter.tooLarge(key, maxBytes);
    try {
      return await fs.promises.readFile(target);
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }

  static tooLarge(key, maxBytes) {
    return Object.assign(new Error(`${key} is over ${maxBytes} bytes`), {
      code: 'E_BOT_PAGE_TOO_LARGE',
    });
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
        } else if (
          !entry.name.endsWith(TEMPORARY_SUFFIX) &&
          !entry.name.endsWith(METADATA_SUFFIX)
        ) {
          yield key;
        }
      }
    };
    yield* walk(this.root, '');
  }
}

LocalStorageAdapter.METADATA_SUFFIX = METADATA_SUFFIX;

module.exports = LocalStorageAdapter;
