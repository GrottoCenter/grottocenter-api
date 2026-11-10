const fs = require('fs');
const os = require('os');
const path = require('path');
const should = require('should');
const sinon = require('sinon');

describe('BotPublishService.publishOrWithhold - the publishing switch', () => {
  let BotPublishService;
  let LocalStorageAdapter;
  let root;
  let adapter;
  const query = (sql, params) => CommonService.query(sql, params);

  before(() => {
    // Sails re-requires api/ when it lifts: require the services here
    /* eslint-disable global-require */
    BotPublishService = require('../../../api/services/bot/BotPublishService');
    ({ LocalStorageAdapter } = require('../../../api/services/bot/storage'));
    /* eslint-enable global-require */
  });

  beforeEach(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-bot-publish-'));
    adapter = new LocalStorageAdapter(root);
    await query('TRUNCATE t_bot_page_manifest');
  });

  afterEach(async () => {
    sinon.restore();
    await query('TRUNCATE t_bot_page_manifest');
    fs.rmSync(root, { recursive: true, force: true });
  });

  const PATH = 'caves/9000001.html';
  const pageOf = (html) => ({
    path: PATH,
    entityType: 'cave',
    entityId: 9000001,
    html,
    hash: BotPublishService.sha256(html),
    lastmod: null,
  });
  const online = () =>
    fs.existsSync(path.join(root, PATH))
      ? fs.readFileSync(path.join(root, PATH), 'utf8')
      : null;
  const inManifest = async () =>
    (
      await query(
        'SELECT content_hash FROM t_bot_page_manifest WHERE path = $1',
        [PATH]
      )
    ).rows[0]?.content_hash;

  const publishOld = async () => {
    await BotPublishService.publishOrWithhold(
      adapter,
      pageOf('old'),
      undefined
    );
    return BotPublishService.sha256('old');
  };

  describe('publishing on', () => {
    it('uploads a new page and writes its manifest row', async () => {
      const outcome = await BotPublishService.publishOrWithhold(
        adapter,
        pageOf('new'),
        undefined
      );
      should(outcome).equal('uploaded');
      should(online()).equal('new');
      should(await inManifest()).equal(BotPublishService.sha256('new'));
    });

    it('uploads a changed page, and leaves an unchanged one', async () => {
      const known = await publishOld();
      should(
        await BotPublishService.publishOrWithhold(adapter, pageOf('old'), known)
      ).equal('unchanged');
      should(
        await BotPublishService.publishOrWithhold(
          adapter,
          pageOf('newer'),
          known
        )
      ).equal('uploaded');
      should(online()).equal('newer');
    });
  });

  describe('publishing off', () => {
    const off = { publishing: false };

    it('does not upload a new page', async () => {
      const put = sinon.spy(adapter, 'put');
      should(
        await BotPublishService.publishOrWithhold(
          adapter,
          pageOf('new'),
          undefined,
          off
        )
      ).equal('withheld');
      should(put.called).be.false();
      should(online()).be.null();
      should(await inManifest()).be.undefined();
    });

    it('leaves an unchanged page online, with its row', async () => {
      const known = await publishOld();
      should(
        await BotPublishService.publishOrWithhold(
          adapter,
          pageOf('old'),
          known,
          off
        )
      ).equal('unchanged');
      should(online()).equal('old');
      should(await inManifest()).equal(known);
    });

    it('deletes a changed page, file first then manifest row, and uploads nothing', async () => {
      const known = await publishOld();
      const put = sinon.spy(adapter, 'put');
      const calls = [];
      const del = sinon.stub(adapter, 'delete').callsFake(async (key) => {
        calls.push(`file:${await inManifest()}`);
        fs.rmSync(path.join(root, key));
      });

      const outcome = await BotPublishService.publishOrWithhold(
        adapter,
        pageOf('newer'),
        known,
        off
      );

      should(outcome).equal('withdrawn');
      should(put.called).be.false();
      should(del.calledOnceWithExactly(PATH)).be.true();
      // The row was still there when the file went
      should(calls).eql([`file:${known}`]);
      should(online()).be.null();
      should(await inManifest()).be.undefined();
    });

    it('leaves a changed page online when it carries no record data (withdrawChanged: false)', async () => {
      const known = await publishOld();
      should(
        await BotPublishService.publishOrWithhold(
          adapter,
          pageOf('newer'),
          known,
          {
            publishing: false,
            withdrawChanged: false,
          }
        )
      ).equal('withheld');
      should(online()).equal('old');
      should(await inManifest()).equal(known);
    });
  });
});
