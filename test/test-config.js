/**
 * Shared test configuration constants.
 *
 * Used by the parallel runner, snapshot script, and bootstrap to avoid
 * duplicating the default database URL across multiple files.
 */

const DEFAULT_TEST_URL = 'postgres://root:root@localhost:5432/grottoce';

module.exports = {
  DEFAULT_TEST_URL,
};
