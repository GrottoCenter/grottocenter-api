/**
 * Parallel Test Runner
 *
 * Splits the test suite into shards by domain folder, each running against
 * its own database cloned from the template. No configuration needed when
 * adding new test files — sharding is based on the folder structure.
 *
 * Route test files within the same domain folder (e.g., Entrances/create,
 * Entrances/find) stay together in one shard to preserve ordering.
 * Non-route layers (models, services, utils, helpers, policies) are bundled
 * into a single shard since they're fast (~15s total).
 *
 * The database template is rebuilt automatically when fixture files, models,
 * or SQL migrations change. No manual step needed.
 *
 * Usage:
 *   node scripts/parallel-test.js
 *   node scripts/parallel-test.js --shards 4
 *   node scripts/parallel-test.js --bail
 *   node scripts/parallel-test.js --grep "pattern"
 *
 * Environment:
 *   POSTGRE_TEST_URL — postgres URL (default: postgres://root:root@localhost:5432/grottoce)
 *   TEST_SHARDS      — override shard count
 */

/* eslint-disable no-console */

const { spawn } = require('child_process');
const { cpus } = require('os');
const fs = require('fs');
const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const { glob } = require('glob');
const { withClient, disconnectAll } = require('./test-db-utils');

const { DEFAULT_TEST_URL } = require('../test/test-config');

const BASE_PORT = 1340;

// ─── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let shards = parseInt(process.env.TEST_SHARDS, 10) || 0;
  let bail = false;
  let grep = null;

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--shards' && args[i + 1]) {
      shards = parseInt(args[i + 1], 10);
      i += 1;
    } else if (args[i] === '--bail') {
      bail = true;
    } else if (args[i] === '--grep' && args[i + 1]) {
      grep = args[i + 1];
      i += 1;
    }
  }

  if (shards === 0) shards = Math.max(2, Math.min(cpus().length, 6));
  return { shards, bail, grep };
}

// ─── Sharding ────────────────────────────────────────────────────────────────

async function discoverAndShard(numShards) {
  const files = await glob('test/integration/**/*.test.js', { posix: true });
  files.sort();

  // Separate route files by domain folder, bundle everything else
  const routeFolders = new Map(); // folder → [files]
  const nonRouteFiles = [];
  const routeRootFiles = []; // files directly in 4_routes/ (no subfolder)

  for (const file of files) {
    if (!file.includes('/4_routes/')) {
      nonRouteFiles.push(file);
    } else {
      // e.g. test/integration/4_routes/Cavers/ban.test.js → Cavers
      const afterRoutes = file.split('/4_routes/')[1];
      const parts = afterRoutes.split('/');
      if (parts.length === 1) {
        // File directly in 4_routes/ (e.g., Auth.test.js, Geoloc.test.js)
        routeRootFiles.push(file);
      } else {
        const folder = parts[0];
        if (!routeFolders.has(folder)) routeFolders.set(folder, []);
        routeFolders.get(folder).push(file);
      }
    }
  }

  // Build groups: each route domain folder is a group, root route files
  // are one group, and all non-route files are one group.
  //
  // Affinity: some domain folders have cross-dependencies and must stay
  // together. We merge them into a single group before bin-packing.
  //
  // Caves ↔ Documents: Cave tests reference fixture documents (addDocument,
  //   unlinkDocument, create with documents:[1,2]) and depend on
  //   Documents/validate having run to set isValidated on those documents.
  // Caves ↔ Entrances: Entrance tests create/update entrances linked to
  //   caves from fixtures; cave deletion tests verify cascade behaviour on
  //   associated entrances.
  //
  // If you add a new domain folder whose tests depend on data created or
  // modified by tests in one of these folders, add it to this array.
  const AFFINITIES = [['Caves', 'Documents', 'Entrances']];

  const groups = [];

  // Non-route layers (fast, ~15s total)
  if (nonRouteFiles.length > 0) {
    groups.push({ name: 'non-routes', files: nonRouteFiles });
  }

  // Merge affinity groups
  const merged = new Set();
  for (const affinity of AFFINITIES) {
    const mergedFiles = [];
    const mergedNames = [];
    for (const folder of affinity) {
      if (routeFolders.has(folder)) {
        mergedFiles.push(...routeFolders.get(folder));
        mergedNames.push(folder);
        merged.add(folder);
      }
    }
    if (mergedFiles.length > 0) {
      // Sort to preserve alphabetical order within the merged group
      mergedFiles.sort();
      groups.push({ name: mergedNames.join('+'), files: mergedFiles });
    }
  }

  // Root route files (Auth.test.js, Geoloc.test.js, etc.)
  if (routeRootFiles.length > 0) {
    groups.push({ name: 'routes-root', files: routeRootFiles });
  }

  // Remaining route domain folders (not in any affinity group)
  for (const [folder, folderFiles] of routeFolders) {
    if (!merged.has(folder)) {
      groups.push({ name: folder, files: folderFiles });
    }
  }

  // Assign groups to shards using greedy bin-packing (largest first)
  groups.sort((a, b) => b.files.length - a.files.length);
  const shards = Array.from({ length: numShards }, () => ({
    files: [],
    names: [],
  }));
  const sizes = new Array(numShards).fill(0);

  for (const group of groups) {
    let minIdx = 0;
    for (let i = 1; i < numShards; i += 1) {
      if (sizes[i] < sizes[minIdx]) minIdx = i;
    }
    shards[minIdx].files.push(...group.files);
    shards[minIdx].names.push(group.name);
    sizes[minIdx] += group.files.length;
  }

  return { shards, totalFiles: files.length };
}

// ─── Database ────────────────────────────────────────────────────────────────

function parseDbUrl(dbUrl) {
  const parsed = new URL(dbUrl);
  const dbName = parsed.pathname.slice(1);
  parsed.pathname = '/postgres';
  return { dbName, maintenanceUrl: parsed.toString() };
}

async function checkTemplate(maintenanceUrl, templateName) {
  return withClient(maintenanceUrl, async (client) => {
    const r = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [templateName]
    );
    return r.rows.length > 0;
  });
}

async function createShardDb(maintenanceUrl, templateName, shardName) {
  return withClient(maintenanceUrl, async (client) => {
    await disconnectAll(client, shardName);
    await client.query(`DROP DATABASE IF EXISTS "${shardName}"`);
    await client.query(
      `CREATE DATABASE "${shardName}" TEMPLATE "${templateName}"`
    );
  });
}

async function dropShardDb(maintenanceUrl, shardName) {
  return withClient(maintenanceUrl, async (client) => {
    await disconnectAll(client, shardName);
    await client.query(`DROP DATABASE IF EXISTS "${shardName}"`);
  });
}

// ─── Runner ──────────────────────────────────────────────────────────────────

// Resolve the mocha binary once so we can spawn it directly (not via npx).
// Spawning through npx adds an intermediate process that doesn't forward
// extra file descriptors, which breaks the fd-3 progress pipe.
const MOCHA_BIN = require.resolve('mocha/bin/mocha');

// Active child processes — tracked so the abort handler can kill them.
const children = [];

function runShard(index, files, dbUrl, port, { bail, grep }, progress) {
  return new Promise((resolve) => {
    const args = [
      MOCHA_BIN,
      '--reporter',
      'test/progress-reporter.js',
      '--exit',
      'test/bootstrap.test.js',
      ...files,
    ];
    if (bail) args.push('--bail');
    if (grep) args.push('--grep', grep);

    const outFile = path.join('test', `shard-${index}.tmp`);
    const outStream = fs.createWriteStream(outFile);

    const child = spawn(process.execPath, args, {
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: String(port),
        POSTGRE_TEST_URL: dbUrl,
        TEST_DB_CLONED: '1',
      },
      // fd 3 is a pipe the child writes progress events to
      stdio: ['ignore', 'pipe', 'pipe', 'pipe'],
    });

    children.push(child);

    // Read progress events from fd 3 (newline-delimited)
    let lineBuf = '';
    child.stdio[3].on('data', (d) => {
      lineBuf += d.toString();
      let nl;
      // eslint-disable-next-line no-cond-assign
      while ((nl = lineBuf.indexOf('\n')) !== -1) {
        const line = lineBuf.slice(0, nl);
        lineBuf = lineBuf.slice(nl + 1);
        if (line === 'F') progress.fail();
        else if (line === 'P') progress.tick();
        else if (line.startsWith('N'))
          progress.addTotal(parseInt(line.slice(1), 10));
        else if (line.startsWith('S')) {
          const sep = line.indexOf('|');
          const ms = parseInt(line.slice(1, sep), 10);
          const title = line.slice(sep + 1);
          progress.addSlow(ms, title);
        }
      }
    });

    let stdout = '';
    child.stdout.on('data', (d) => {
      const s = d.toString();
      stdout += s;
      outStream.write(s);
    });
    child.stderr.on('data', (d) => outStream.write(d.toString()));
    child.on('close', (code) => {
      outStream.end();
      resolve({ index, code, stdout, fileCount: files.length, outFile, port });
    });
  });
}

// ─── Live progress ───────────────────────────────────────────────────────────

function createProgress() {
  let done = 0;
  let total = 0;
  let failures = 0;
  const slowTests = []; // { ms, title } — global top 3 across all shards
  const { isTTY } = process.stdout;

  const GREEN = '\x1b[32m';
  const RED = '\x1b[31m';
  const DIM = '\x1b[2m';
  const RESET = '\x1b[0m';

  function render() {
    const color = failures > 0 ? RED : GREEN;
    let status;
    if (total === 0) {
      status = 'shards booting';
    } else if (done === 0) {
      status = `0/${total}, starting`;
    } else {
      const pct = `${Math.floor((done / total) * 100)}%`;
      status = `${pct}, ${done}/${total}`;
    }
    const failStr = failures > 0 ? `, ${failures} failed` : '';
    const hint = `${DIM}  q to abort${RESET}`;
    const line = `${color}  ⟳ ${status}${failStr}${RESET}${hint}`;
    if (isTTY) {
      process.stdout.write(`\r\x1b[K${line}`);
    }
  }

  // Show initial state immediately (shards booting)
  render();

  return {
    addTotal(n) {
      total += n;
      render();
    },
    tick() {
      done += 1;
      render();
    },
    fail() {
      done += 1;
      failures += 1;
      render();
    },
    finish() {
      if (isTTY) process.stdout.write('\r\x1b[K');
    },
    snapshot() {
      return { done, total, failures, passed: done - failures };
    },
    addSlow(ms, title) {
      // Maintain a sorted top-3 list. We insert into the correct position
      // rather than push+sort, keeping this O(1) per call.
      const entry = { ms, title };
      let inserted = false;
      for (let i = 0; i < slowTests.length; i += 1) {
        if (ms > slowTests[i].ms) {
          slowTests.splice(i, 0, entry);
          inserted = true;
          break;
        }
      }
      if (!inserted && slowTests.length < 3) slowTests.push(entry);
      if (slowTests.length > 3) slowTests.length = 3;
    },
    getSlowest() {
      return slowTests;
    },
  };
}

// ─── Output ──────────────────────────────────────────────────────────────────

function extractFailures(stdout) {
  const lines = stdout.split('\n');
  const idx = lines.findIndex((l) => /\d+ failing/.test(l));
  if (idx === -1) return '';
  return lines
    .slice(idx + 1)
    .join('\n')
    .trim();
}

function printResults(results, shardMeta, totalTime, aborted, progressSnap) {
  const W = 70;
  console.log(`\n${'═'.repeat(W)}`);
  console.log(aborted ? 'RESULTS (aborted — partial)' : 'RESULTS');
  console.log('═'.repeat(W));

  // On abort, Mocha is killed before writing its summary line, so per-shard
  // stdout parsing yields zeros. Use the progress tracker's live counts
  // instead — they reflect every test event received before the kill.
  if (aborted && progressSnap) {
    console.log(
      `  Total: ${progressSnap.passed} passing, ${progressSnap.failures} failing (of ${progressSnap.total} total)`
    );
    console.log(`  Wall time: ${(totalTime / 1000).toFixed(1)}s`);
    console.log('═'.repeat(W));
    return progressSnap.failures > 0;
  }

  let totalPass = 0;
  let totalFail = 0;
  let anyFailed = false;
  const failed = [];

  for (const r of results) {
    const ok = r.code === 0;
    if (!ok) {
      anyFailed = true;
      failed.push(r);
    }
    const pm = r.stdout.match(/(\d+) passing/);
    const fm = r.stdout.match(/(\d+) failing/);
    const p = pm ? parseInt(pm[1], 10) : 0;
    const f = fm ? parseInt(fm[1], 10) : 0;
    totalPass += p;
    totalFail += f;
    const tm = r.stdout.match(/\d+ passing \(([^)]+)\)/);
    const t = tm ? tm[1] : '?';
    const label = shardMeta[r.index].names.join(', ');
    const icon = ok ? '✅' : '❌';
    const portStr = ok ? '' : ` [port ${r.port}]`;
    console.log(
      `  ${icon} Shard ${r.index} (${label}): ${p} pass, ${f} fail (${t})${portStr} → ${r.outFile}`
    );
  }

  console.log('─'.repeat(W));
  console.log(`  Total: ${totalPass} passing, ${totalFail} failing`);
  console.log(`  Wall time: ${(totalTime / 1000).toFixed(1)}s`);
  console.log('═'.repeat(W));

  if (failed.length > 0) {
    console.log(`\nFAILURE DETAILS\n${'─'.repeat(W)}`);
    for (const r of failed) {
      console.log(`\n┌─ Shard ${r.index} (${r.outFile}):`);
      const detail = extractFailures(r.stdout);
      if (detail) {
        detail.split('\n').forEach((l) => console.log(`│  ${l}`));
      } else {
        console.log(`│  See: cat ${r.outFile}`);
      }
      console.log('└');
    }
  }

  return anyFailed;
}

// ─── Snapshot staleness ──────────────────────────────────────────────────────

const STAMP_PATH = path.join(__dirname, '..', 'test', '.snapshot-stamp');

/**
 * Files that affect the database state. If any of these are newer than the
 * snapshot stamp, the template is stale and must be re-created.
 */
const SNAPSHOT_SOURCES = [
  'test/fixtures/**/*.json',
  'test/fixtureOrder.js',
  'test/customSQL.js', // literal path — glob resolves it as-is
  'test/seed-database.js', // decides which customSQL blocks actually run
  'api/models/**/*.js',
  'sql/**/*.sql',
];

async function isSnapshotStale() {
  // No stamp file → never snapshotted
  if (!fs.existsSync(STAMP_PATH)) return true;

  const stampTime = fs.statSync(STAMP_PATH).mtimeMs;

  const sourceFiles = (
    await Promise.all(
      SNAPSHOT_SOURCES.map((pattern) => glob(pattern, { posix: true }))
    )
  ).flat();

  for (const file of sourceFiles) {
    try {
      if (fs.statSync(file).mtimeMs > stampTime) return true;
    } catch {
      // File disappeared between glob and stat — ignore
    }
  }

  return false;
}

function runSnapshot() {
  return new Promise((resolve, reject) => {
    console.log('[runner] Snapshot is stale — rebuilding template...\n');
    const child = spawn(
      process.execPath,
      ['scripts/snapshot-test-db.js', '--seed'],
      {
        env: { ...process.env, PORT: '1339' },
        stdio: 'inherit',
      }
    );
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(`Snapshot failed (exit ${code})`));
      else resolve();
    });
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { shards: numShards, bail, grep } = parseArgs();
  const testUrl = process.env.POSTGRE_TEST_URL || DEFAULT_TEST_URL;
  const { dbName, maintenanceUrl } = parseDbUrl(testUrl);
  const templateName = `${dbName}_template`;

  // Pre-flight: verify the database server is reachable
  try {
    await withClient(maintenanceUrl, async (client) => {
      await client.query('SELECT 1');
    });
  } catch (err) {
    console.error(
      `\nCannot connect to PostgreSQL at ${maintenanceUrl.replace(/\/\/.*@/, '//***@')}`
    );
    console.error(`Error: ${err.message}`);
    console.error('\nIs the test database running? Try: npm run dev:up\n');
    process.exit(1);
  }

  if (await isSnapshotStale()) {
    await runSnapshot();
  }

  if (!(await checkTemplate(maintenanceUrl, templateName))) {
    console.error('Template creation failed. Check errors above.');
    process.exit(1);
  }

  const { shards, totalFiles } = await discoverAndShard(numShards);
  const active = shards.filter((s) => s.files.length > 0);

  console.log(`\n${active.length} shards, ${totalFiles} files\n`);
  active.forEach((s, i) => {
    console.log(
      `  Shard ${i}: ${s.files.length} files (${s.names.join(', ')})`
    );
  });
  console.log('');

  // Create shard databases
  const t0 = Date.now();
  const shardDbNames = await Promise.all(
    active.map(async (_, i) => {
      const name = `${dbName}_shard_${i}`;
      await createShardDb(maintenanceUrl, templateName, name);
      return name;
    })
  );
  console.log(`Databases cloned in ${Date.now() - t0}ms\n`);

  let anyFailed = false;
  try {
    // Run
    const runStart = Date.now();
    const progress = createProgress();

    // ── Abort on 'q' keypress ────────────────────────────────────────────
    let aborted = false;
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', (key) => {
        // q or Ctrl-C
        if (key.toString() === 'q' || key[0] === 3) {
          aborted = true;
          children.forEach((c) => {
            try {
              c.kill('SIGTERM');
            } catch {
              // already exited
            }
          });
        }
      });
    }

    const results = await Promise.all(
      active.map((s, i) => {
        const shardUrl = new URL(testUrl);
        shardUrl.pathname = `/${dbName}_shard_${i}`;
        return runShard(
          i,
          s.files,
          shardUrl.toString(),
          BASE_PORT + i,
          {
            bail,
            grep,
          },
          progress
        );
      })
    );

    // Restore terminal
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }

    progress.finish();

    anyFailed = printResults(
      results,
      active,
      Date.now() - runStart,
      aborted,
      progress.snapshot()
    );

    const slowest = progress.getSlowest();
    if (slowest.length > 0) {
      console.log('\nSLOWEST TESTS');
      slowest.forEach((s, i) => {
        const sec = (s.ms / 1000).toFixed(1);
        console.log(`  ${i + 1}. ${sec}s — ${s.title}`);
      });
      console.log('');
    }
  } finally {
    // Cleanup shard databases even if the runner crashes
    await Promise.all(shardDbNames.map((n) => dropShardDb(maintenanceUrl, n)));
  }

  process.exit(anyFailed ? 1 : 0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
