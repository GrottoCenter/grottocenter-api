const should = require('should');
const { escapeSqlLiteral } = require('../../../scripts/update_iso3166_2');
const CommonService = require('../../../api/services/CommonService');

describe('escapeSqlLiteral utility', () => {
  it("should wrap the escaped value in E'...' escape-string syntax", () => {
    const result = escapeSqlLiteral("A'B");
    should(result.startsWith("E'")).be.true();
    should(result.endsWith("'")).be.true();
  });

  const roundTripCases = [
    { name: 'a single backslash', value: 'A\\B' },
    { name: 'a single quote', value: "O'Brien" },
    { name: 'a quote and a backslash', value: "O'Brien\\A" },
  ];

  roundTripCases.forEach(({ name, value }) => {
    it(`should round-trip a value containing ${name} through PostgreSQL`, async () => {
      const result = await CommonService.query(
        `SELECT ${escapeSqlLiteral(value)} AS value`,
        []
      );
      should(result.rows[0].value).equal(value);
    });
  });
});
