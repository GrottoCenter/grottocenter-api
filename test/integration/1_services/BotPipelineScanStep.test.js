const should = require('should');
const sinon = require('sinon');

describe('BotPipelineService scan step - quarantine total (#1762)', () => {
  let BotPipelineService;
  const summary = {
    patternVersion: 1,
    scanned: { t_description: 1, t_name: 0 },
    quarantined: { t_description: 1, t_name: 0 },
    errors: 0,
    passes: 1,
  };

  before(() => {
    // Required here, not at the top: Sails re-requires api/ when it lifts
    // eslint-disable-next-line global-require
    BotPipelineService = require('../../../api/services/bot/BotPipelineService');
  });

  afterEach(() => sinon.restore());

  it('records the backlog total after the scan', async () => {
    sinon.stub(sails.services.bottextscanservice, 'run').resolves(summary);

    const result = await BotPipelineService.steps.scan();

    should(result.quarantineTotal).be.a.Number();
    should(result.quarantined).eql(summary.quarantined);
  });

  it('does not fail the step when the backlog cannot be counted', async () => {
    sinon.stub(sails.services.bottextscanservice, 'run').resolves(summary);
    sinon.stub(CommonService, 'query').rejects(new Error('lock timeout'));

    const result = await BotPipelineService.steps.scan();

    should(result.quarantineTotal).be.null();
    should(result.patternVersion).equal(1);
  });
});
