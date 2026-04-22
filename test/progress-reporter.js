/**
 * Minimal Mocha reporter that emits progress events to file descriptor 3,
 * while delegating full output to the built-in spec reporter.
 *
 * The parent process (parallel-test.js) reads fd 3 to track real-time
 * progress across all shards.
 *
 * Protocol (newline-delimited):
 *   'N<number>\n'            — total test count for this shard (sent once on start)
 *   'P\n'                    — a test passed
 *   'F\n'                    — a test failed
 *   'S<ms>|<title>\n'        — a slow test (top 3 sent once on end)
 *
 * Usage (automatic — wired by parallel-test.js):
 *   mocha --reporter test/progress-reporter.js ...
 */

const Mocha = require('mocha'); // eslint-disable-line import/no-extraneous-dependencies
const fs = require('fs');

const { Spec } = Mocha.reporters;

const SLOW_COUNT = 3;

function emit(fd, msg) {
  try {
    fs.writeSync(fd, `${msg}\n`);
  } catch {
    // fd closed — ignore
  }
}

class ProgressReporter extends Spec {
  constructor(runner, options) {
    super(runner, options);

    // fd 3 is opened by the parent process for progress events.
    // If it's not available (e.g. running mocha directly), skip silently.
    let progressFd = null;
    try {
      fs.fstatSync(3);
      progressFd = 3;
    } catch {
      // fd 3 not open — running outside the parallel runner, no-op
    }

    if (progressFd !== null) {
      const slowest = []; // { duration, title }

      runner.once('start', () => emit(progressFd, `N${runner.total}`));
      runner.on('pass', () => emit(progressFd, 'P'));
      runner.on('fail', () => emit(progressFd, 'F'));

      runner.on('test end', (test) => {
        const ms = test.duration || 0;
        if (
          slowest.length < SLOW_COUNT ||
          ms > slowest[slowest.length - 1].ms
        ) {
          // Insert into the correct position to maintain descending order.
          let inserted = false;
          for (let i = 0; i < slowest.length; i += 1) {
            if (ms > slowest[i].ms) {
              slowest.splice(i, 0, { ms, title: test.fullTitle() });
              inserted = true;
              break;
            }
          }
          if (!inserted) slowest.push({ ms, title: test.fullTitle() });
          if (slowest.length > SLOW_COUNT) slowest.length = SLOW_COUNT;
        }
      });

      runner.once('end', () => {
        slowest.forEach((s) => emit(progressFd, `S${s.ms}|${s.title}`));
      });
    }
  }
}

module.exports = ProgressReporter;
