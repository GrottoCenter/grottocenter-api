const fc = require('fast-check');
const should = require('should');

describe('botJsonLd.serializeForScript (property)', () => {
  let serializeForScript;

  before(() => {
    // eslint-disable-next-line global-require
    ({ serializeForScript } = require('../../../api/utils/botJsonLd'));
  });

  // Strings that lean on the characters that matter inside a script element
  const hostileString = fc.oneof(
    fc.string({ unit: 'binary' }),
    fc
      .array(
        fc.constantFrom('<', '/', 'script', '!--', '>', '"', '\\', 'a', '\n'),
        { maxLength: 12 }
      )
      .map((parts) => parts.join(''))
  );
  const json = fc.jsonValue();

  it('never emits a "<", whatever the value', () => {
    fc.assert(
      fc.property(hostileString, json, (text, value) => {
        const output = serializeForScript({ text, value, [text]: 1 });
        should(output).not.containEql('<');
      })
    );
  });

  it('is read back as the value that was serialized', () => {
    fc.assert(
      fc.property(hostileString, json, (text, value) => {
        const original = { text, nested: [value, { [text]: value }] };
        should(JSON.parse(serializeForScript(original))).deepEqual(
          JSON.parse(JSON.stringify(original))
        );
      })
    );
  });

  it('keeps every other character of the JSON as it is', () => {
    fc.assert(
      fc.property(json, (value) => {
        // Where the value has no "<", the output is plain JSON.stringify
        fc.pre(!JSON.stringify(value).includes('<'));
        should(serializeForScript(value)).equal(JSON.stringify(value));
      })
    );
  });
});
