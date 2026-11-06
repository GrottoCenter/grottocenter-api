const should = require('should');
const {
  DEFAULT_SCHEDULE,
  parseEntityTypes,
  parseSchedule,
} = require('../../../api/utils/botSurfaceConfig');

describe('botSurfaceConfig - parseEntityTypes', () => {
  it('reads a comma-separated list and returns it in the canonical order', () => {
    should(parseEntityTypes('organization,massif,cave')).eql([
      'cave',
      'massif',
      'organization',
    ]);
  });

  it('accepts hub among the types', () => {
    should(parseEntityTypes('hub')).eql(['hub']);
  });

  it('tolerates spaces, case, empty entries and duplicates', () => {
    should(parseEntityTypes(' Massif , ,massif,CAVE,')).eql(['cave', 'massif']);
  });

  it('returns an empty list for an unset, empty or blank value', () => {
    should(parseEntityTypes(undefined)).eql([]);
    should(parseEntityTypes(null)).eql([]);
    should(parseEntityTypes('')).eql([]);
    should(parseEntityTypes('  , ')).eql([]);
  });

  it('fails with the unknown names and the accepted ones', () => {
    should(() => parseEntityTypes('cave,caves,document')).throw(
      /BOT_SURFACE_ENTITY_TYPES: unknown type\(s\) "caves", "document"\. Accepted: cave, massif, organization, hub/
    );
  });
});

describe('botSurfaceConfig - parseSchedule', () => {
  it('defaults to 01:30 UTC, which is provisional', () => {
    should(DEFAULT_SCHEDULE).equal('30 1 * * *');
    should(parseSchedule(undefined)).equal('30 1 * * *');
    should(parseSchedule('  ')).equal('30 1 * * *');
  });

  it('accepts valid cron expressions and single-spaces them', () => {
    should(parseSchedule('15  2 * * 1-5')).equal('15 2 * * 1-5');
    should(parseSchedule('*/10 0-6/2 1,15 * *')).equal('*/10 0-6/2 1,15 * *');
    should(parseSchedule('0 0 * * 7')).equal('0 0 * * 7');
  });

  it('rejects an expression without five fields', () => {
    should(() => parseSchedule('30 1 * *')).throw(
      /BOT_SURFACE_SCHEDULE: expected 5 cron fields/
    );
    should(() => parseSchedule('0 30 1 * * *')).throw(/expected 5 cron fields/);
  });

  [
    ['60 1 * * *', 'minute'],
    ['0 24 * * *', 'hour'],
    ['0 1 0 * *', 'day of month'],
    ['0 1 * 13 *', 'month'],
    ['0 1 * * 8', 'day of week'],
    ['abc 1 * * *', 'minute'],
    ['5-2 1 * * *', 'minute'],
    ['*/0 1 * * *', 'minute'],
    ['0 1 * * 1-2-3', 'day of week'],
  ].forEach(([expression, field]) => {
    it(`rejects "${expression}" (bad ${field})`, () => {
      should(() => parseSchedule(expression)).throw(
        new RegExp(`invalid ${field} field`)
      );
    });
  });
});
