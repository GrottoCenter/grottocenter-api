const fs = require('fs');
const path = require('path');
const should = require('should');
const sinon = require('sinon');
const { Client } = require('pg');
const {
  CRON_JOBS,
  withDatabase,
  readLatestRuns,
  evaluateRun,
  evaluateJobs,
  summarize,
} = require('../../../api/utils/cronHeartbeat');

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse('2026-11-27T05:30:00Z');
const ago = (ms) => new Date(NOW - ms);
const succeeded = (endedAgo) => ({
  status: 'succeeded',
  start_time: ago(endedAgo + 60000),
  end_time: ago(endedAgo),
});

describe('cronHeartbeat', () => {
  describe('withDatabase()', () => {
    it('keeps the server, the credentials and the query, swaps the database', () => {
      should(
        withDatabase(
          'postgres://gc_app:p%40ss@host.example:5432/grottoce?sslmode=verify-full'
        )
      ).equal(
        'postgres://gc_app:p%40ss@host.example:5432/postgres?sslmode=verify-full'
      );
    });
  });

  describe('evaluateRun()', () => {
    const DAY = 12 * HOUR;

    it('fails a job that is not scheduled or never ran', () => {
      should(evaluateRun(undefined, DAY, NOW).outcome).equal('fail');
      should(evaluateRun({ status: null }, DAY, NOW).outcome).equal('fail');
    });

    it('reports a recent success as ok', () => {
      should(evaluateRun(succeeded(30 * 60000), DAY, NOW).outcome).equal('ok');
    });

    it('fails a success that is too old (yesterday is not today)', () => {
      should(evaluateRun(succeeded(24 * HOUR), DAY, NOW).outcome).equal('fail');
    });

    it('fails a failed run, even a recent one', () => {
      const run = { ...succeeded(60000), status: 'failed' };
      const result = evaluateRun(run, DAY, NOW);
      should(result.outcome).equal('fail');
      should(result.reason).match(/failed/);
    });

    it('sends nothing while a run is in progress', () => {
      ['starting', 'connecting', 'sending', 'running'].forEach((status) => {
        const run = { status, start_time: ago(40 * 60000), end_time: null };
        should(evaluateRun(run, DAY, NOW).outcome).equal('skip');
      });
    });

    it('fails a run that has been in progress for hours', () => {
      const run = { status: 'running', start_time: ago(4 * HOUR) };
      should(evaluateRun(run, DAY, NOW).outcome).equal('fail');
    });

    it('fails a status it does not know', () => {
      should(evaluateRun({ status: 'weird' }, DAY, NOW).outcome).equal('fail');
    });

    it('fails a success without an end time', () => {
      const run = {
        status: 'succeeded',
        start_time: ago(60000),
        end_time: null,
      };
      should(evaluateRun(run, DAY, NOW).outcome).equal('fail');
    });
  });

  describe('evaluateJobs()', () => {
    it('judges each job by its own name and age limit', () => {
      const runs = [
        {
          jobname: 'Refresh data quality view daily',
          ...succeeded(25 * 60000),
        },
        // Ran 2 days ago: fine for a 3-day job, too old for a daily one
        { jobname: 'Trim bot outbox daily', ...succeeded(48 * HOUR) },
        {
          jobname: 'Refresh massif info view every 3 days',
          ...succeeded(48 * HOUR),
        },
        {
          jobname: 'Refresh country info view every 3 days',
          ...succeeded(48 * HOUR),
          status: 'failed',
        },
      ];
      const byName = Object.fromEntries(
        evaluateJobs(runs, NOW).map((r) => [r.jobname, r.outcome])
      );
      should(byName).eql({
        'Refresh data quality view daily': 'ok',
        'Trim bot outbox daily': 'fail',
        'Refresh massif info view every 3 days': 'ok',
        'Refresh country info view every 3 days': 'fail',
        // not in the history: not scheduled
        'Refresh region info view every 3 days': 'fail',
      });
    });
  });

  describe('summarize()', () => {
    const of = (...outcomes) => outcomes.map((outcome) => ({ outcome }));

    it('is ok only when every job is ok', () => {
      should(summarize(of('ok', 'ok', 'ok'))).equal('ok');
    });

    it('fails as soon as one job fails, even if another is in progress', () => {
      should(summarize(of('ok', 'fail', 'ok'))).equal('fail');
      should(summarize(of('skip', 'fail'))).equal('fail');
    });

    it('sends nothing while a run is in progress and the others are fine', () => {
      should(summarize(of('ok', 'skip', 'ok'))).equal('skip');
    });
  });

  describe('CRON_JOBS', () => {
    it('lists exactly the jobs scheduled in sql/1_cron.sql', () => {
      const sql = fs.readFileSync(
        path.join(__dirname, '../../../sql/1_cron.sql'),
        'utf8'
      );
      const scheduled = [
        ...sql.matchAll(/cron\.schedule_in_database\(\s*'([^']+)'/g),
      ].map((m) => m[1]);
      should(scheduled.length).be.above(0);
      // The cron-jobs monitor only sees the jobs listed in CRON_JOBS: a job
      // missing there fails silently again
      should(CRON_JOBS.map((j) => j.jobname).sort()).eql(
        scheduled.sort(),
        'sql/1_cron.sql and CRON_JOBS (api/utils/cronHeartbeat.js) differ: see docs/agents/scheduled-jobs.md, "Adding a scheduled job"'
      );
    });

    it('has no duplicate job name', () => {
      const names = CRON_JOBS.map((j) => j.jobname);
      should(new Set(names).size).equal(names.length);
    });
  });

  describe('readLatestRuns()', () => {
    afterEach(() => sinon.restore());

    it('returns the rows and always closes the connection', async () => {
      sinon.stub(Client.prototype, 'connect').resolves();
      const query = sinon
        .stub(Client.prototype, 'query')
        .resolves({ rows: [{ jobname: 'a', status: 'succeeded' }] });
      const end = sinon.stub(Client.prototype, 'end').resolves();
      const rows = await readLatestRuns(
        'postgres://u:p@localhost:5432/postgres'
      );
      should(rows).eql([{ jobname: 'a', status: 'succeeded' }]);
      should(query.firstCall.args[0]).match(/gc_cron_latest_runs/);
      sinon.assert.calledOnce(end);
    });

    it('closes the connection and rethrows when the query fails', async () => {
      sinon.stub(Client.prototype, 'connect').resolves();
      sinon
        .stub(Client.prototype, 'query')
        .rejects(new Error('permission denied'));
      const end = sinon.stub(Client.prototype, 'end').resolves();
      await readLatestRuns(
        'postgres://u:p@localhost:5432/postgres'
      ).should.be.rejectedWith('permission denied');
      sinon.assert.calledOnce(end);
    });
  });
});
