const should = require('should');
const sinon = require('sinon');

describe('BotSurfaceStateService - the publishing switch', () => {
  let BotSurfaceStateService;
  let logError;
  const query = (sql, params) => CommonService.query(sql, params);

  before(() => {
    // Sails re-requires api/ when it lifts: require the service here
    // eslint-disable-next-line global-require
    BotSurfaceStateService = require('../../../api/services/bot/BotSurfaceStateService');
  });

  beforeEach(() => {
    logError = sinon.stub(sails.log, 'error');
  });

  afterEach(async () => {
    sinon.restore();
    await query(
      `INSERT INTO t_bot_surface_state (id, publishing, reason, updated_at)
       VALUES (1, true, NULL, now())
       ON CONFLICT (id) DO UPDATE SET publishing = true, reason = NULL, updated_at = now()`
    );
  });

  describe('the table', () => {
    it('holds exactly one row, publishing, after the migration', async () => {
      const { rows } = await query('SELECT * FROM t_bot_surface_state');
      should(rows).have.length(1);
      should(rows[0].id).equal(1);
      should(rows[0].publishing).be.true();
      should(rows[0].reason).be.null();
      should(rows[0].updated_at).be.instanceOf(Date);
    });

    it('refuses a second row', async () => {
      await query(
        'INSERT INTO t_bot_surface_state (id) VALUES (2)'
      ).should.be.rejected();
      await query(
        'INSERT INTO t_bot_surface_state (id) VALUES (1)'
      ).should.be.rejected();
      should(
        (await query('SELECT count(*)::int AS n FROM t_bot_surface_state'))
          .rows[0].n
      ).equal(1);
    });
  });

  describe('read and isPublishing', () => {
    it('reports publishing when the row says so', async () => {
      const state = await BotSurfaceStateService.read();
      should(state).containEql({
        publishing: true,
        reason: null,
        failedClosed: false,
      });
      should(await BotSurfaceStateService.isPublishing()).be.true();
      should(logError.called).be.false();
    });

    it('reports the reason and the date when publishing is off', async () => {
      await query(
        "UPDATE t_bot_surface_state SET publishing = false, reason = 'because', updated_at = now() WHERE id = 1"
      );
      const state = await BotSurfaceStateService.read();
      should(state.publishing).be.false();
      should(state.reason).equal('because');
      should(state.updatedAt).be.instanceOf(Date);
      should(state.failedClosed).be.false();
      should(logError.called).be.false();
    });

    it('fails closed, and logs it, when the row is missing', async () => {
      await query('DELETE FROM t_bot_surface_state');
      should(await BotSurfaceStateService.isPublishing()).be.false();
      const state = await BotSurfaceStateService.read();
      should(state.failedClosed).be.true();
      should(logError.callCount).equal(2);
      should(logError.firstCall.args[0]).match(
        /^bot-surface-state: t_bot_surface_state has no row, publishing is treated as OFF/
      );
    });

    it('fails closed, and logs it, when the table cannot be read', async () => {
      sinon
        .stub(CommonService, 'query')
        .rejects(new Error('relation does not exist'));
      should(await BotSurfaceStateService.isPublishing()).be.false();
      should(logError.firstCall.args[0]).match(
        /cannot read t_bot_surface_state, publishing is treated as OFF.*relation does not exist/
      );
    });
  });

  describe('stopPublishing', () => {
    it('turns publishing off with the reason and the date', async () => {
      await BotSurfaceStateService.stopPublishing('11 pages failed');
      const { rows } = await query('SELECT * FROM t_bot_surface_state');
      should(rows).have.length(1);
      should(rows[0].publishing).be.false();
      should(rows[0].reason).equal('11 pages failed');
      should(Date.now() - rows[0].updated_at.getTime()).be.below(60000);
    });

    it('creates the row when it is missing', async () => {
      await query('DELETE FROM t_bot_surface_state');
      await BotSurfaceStateService.stopPublishing('missing row');
      const state = await BotSurfaceStateService.read();
      should(state).containEql({
        publishing: false,
        reason: 'missing row',
        failedClosed: false,
      });
    });

    it('can be set back with the SQL of the runbook', async () => {
      await BotSurfaceStateService.stopPublishing('x');
      await query(
        'UPDATE t_bot_surface_state SET publishing = true, reason = NULL, updated_at = now() WHERE id = 1'
      );
      should(await BotSurfaceStateService.isPublishing()).be.true();
    });
  });
});
