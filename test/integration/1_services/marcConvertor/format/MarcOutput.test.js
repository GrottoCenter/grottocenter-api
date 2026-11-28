/* eslint-disable global-require */
const should = require('should');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const hasYaz = spawnSync('yaz-marcdump', ['-h']).error === undefined;

const document = {
  id: 71096,
  lastUpdate: new Date(2020, 5, 1),
  creationDate: new Date(2012, 2, 14, 10, 30),
  dcTitle: '  Le gouffre Berger  ',
  dcCreators: ['CAILLAULT Serge', 'speleo42'],
  dcDate: new Date(1999, 0, 1),
  dcLanguages: ['000'],
  dcDescriptions: ['A description.\n\n  \n'],
  dcTypeGrottocenter: 'article',
  landingPageUrl: 'https://grottocenter.org/ui/documents/71096',
  parents: [],
};

const subfield = (record, tag, code) =>
  record
    .getRecord()
    .get(tag)
    .map((f) => f.subfields.find((sf) => sf.code === code))
    .map((sf) => sf && sf.value);

describe('marcConvertor record content', () => {
  let Marc21;
  let Unimarc;

  before(() => {
    Marc21 = require('../../../../../api/services/marcConvertor/format/Marc21');
    Unimarc = require('../../../../../api/services/marcConvertor/format/Unimarc');
  });

  describe('UNIMARC', () => {
    it('should enter the creation date in 100, not today', async () => {
      const record = await Unimarc.transform({ ...document });
      const [f100] = subfield(record, '100', 'a');
      f100.should.have.length(36);
      f100.slice(0, 8).should.equal('20120314');
      f100.slice(9, 13).should.equal('1999');
    });

    it('should write the same 100 whenever it is fetched', async () => {
      const a = await Unimarc.transform({ ...document });
      const b = await Unimarc.transform({ ...document });
      subfield(a, '100', 'a').should.eql(subfield(b, '100', 'a'));
    });

    it('should keep 100 at 36 characters for a year under 4 digits', async () => {
      const record = await Unimarc.transform({
        ...document,
        dcDate: new Date(950, 0, 1),
      });
      const [f100] = subfield(record, '100', 'a');
      f100.should.have.length(36);
      f100.slice(8, 9).should.equal('u');
    });

    it('should omit 101 when the language is unknown (000)', async () => {
      const record = await Unimarc.transform({ ...document });
      record.getRecord().get('101').should.have.length(0);
    });

    it('should keep a real language in 101', async () => {
      const record = await Unimarc.transform({
        ...document,
        dcLanguages: ['000', 'fre'],
      });
      subfield(record, '101', 'a').should.eql(['fre']);
    });

    it('should trim the text fields', async () => {
      const record = await Unimarc.transform({ ...document });
      subfield(record, '330', 'a').should.eql(['A description.']);
      subfield(record, '200', 'a').should.eql(['Le gouffre Berger']);
    });

    it('should set the indicators of the name fields', async () => {
      const record = await Unimarc.transform({ ...document });
      const [main] = record.getRecord().get('700');
      main.ind2.should.equal('1');
      main.subfields.should.eql([
        { code: 'a', value: 'CAILLAULT' },
        { code: 'b', value: 'Serge' },
      ]);
      record.getRecord().get('701')[0].ind2.should.equal('0');
    });
  });

  describe('MARC21', () => {
    it('should have a 008 with the creation date, year and language', () => {
      const record = Marc21.transform({ ...document });
      const [f008] = record
        .getRecord()
        .get('008')
        .map((f) => f.value);
      f008.should.have.length(40);
      f008.slice(0, 6).should.equal('120314');
      f008.slice(6, 11).should.equal('s1999');
      f008.slice(35, 38).should.equal('und');
    });

    it('should not assert the books layout in 008 for other record types', () => {
      const record = Marc21.transform({
        ...document,
        dcTypeGrottocenter: 'image',
      });
      const [f008] = record
        .getRecord()
        .get('008')
        .map((f) => f.value);
      f008.should.have.length(40);
      f008.slice(18, 35).should.equal('|'.repeat(17));
    });

    it('should set 245 first indicator to 1 as a 100 is always written', () => {
      const record = Marc21.transform({ ...document });
      record.getRecord().get('245')[0].ind1.should.equal('1');
      const anonymous = Marc21.transform({ ...document, dcCreators: [] });
      anonymous.getRecord().get('245')[0].ind1.should.equal('1');
    });

    it('should use the language of the document in 008 and 041', () => {
      const record = Marc21.transform({ ...document, dcLanguages: ['fre'] });
      const [f008] = record
        .getRecord()
        .get('008')
        .map((f) => f.value);
      f008.slice(35, 38).should.equal('fre');
      subfield(record, '041', 'a').should.eql(['fre']);
    });

    it('should omit 041 when the language is unknown', () => {
      const record = Marc21.transform({ ...document });
      record.getRecord().get('041').should.have.length(0);
    });

    it('should type the leader by document type', () => {
      const leader = (type) =>
        Marc21.transform({ ...document, dcTypeGrottocenter: type }).getRecord()
          .leader;
      leader('article').slice(5, 8).should.equal('naa');
      leader('book').slice(5, 8).should.equal('nam');
      leader('topographic_drawing').slice(5, 8).should.equal('nem');
      leader('issue').slice(5, 8).should.equal('nam');
      leader('collection').slice(5, 8).should.equal('nac');
      leader('image').slice(5, 8).should.equal('nkm');
      leader('dataset').slice(5, 8).should.equal('nmm');
    });

    it('should write 260 with the year even without a publisher', () => {
      const record = Marc21.transform({ ...document });
      subfield(record, '260', 'c').should.eql(['1999']);
      subfield(record, '260', 'b').should.eql([undefined]);
    });

    it('should not write a placeholder 040', () => {
      const record = Marc21.transform({ ...document });
      record.getRecord().get('040').should.have.length(0);
    });

    it('should invert the main author and set the indicators', () => {
      const record = Marc21.transform({ ...document });
      const [main] = record.getRecord().get('100');
      main.ind1.should.equal('1');
      main.subfields[0].value.should.equal('CAILLAULT, Serge');
      record.getRecord().get('700')[0].ind1.should.equal('0');
    });

    it('should trim the text fields', () => {
      const record = Marc21.transform({ ...document });
      subfield(record, '520', 'a').should.eql(['A description.']);
    });

    it('should keep the link to the Grottocenter page in 856 $u', () => {
      const record = Marc21.transform({ ...document });
      subfield(record, '856', 'u').should.containEql(document.landingPageUrl);
    });
  });

  describe('ISO 2709 validation with yaz-marcdump', () => {
    // eslint-disable-next-line prefer-arrow-callback
    before(function skipWithoutYaz() {
      if (hasYaz) return;
      // In CI a missing binary must fail, not silently drop the validation
      if (process.env.CI) throw new Error('yaz-marcdump is required in CI');
      this.skip();
    });

    const dump = (iso, format) => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'marc-'));
      const file = path.join(dir, 'record.mrc');
      fs.writeFileSync(file, Buffer.from(iso, 'utf8'));
      try {
        const result = spawnSync('yaz-marcdump', [
          '-i',
          'marc',
          '-o',
          'line',
          file,
        ]);
        should(result.status).equal(0);
        should(result.stderr.toString()).not.match(/error|bad|invalid/i);
        return `${format}:${result.stdout.toString()}`;
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    };

    it('should read back a MARC21 record', () => {
      const out = dump(Marc21.transform({ ...document }).toIso2709(), 'marc21');
      out.should.match(/\n008 120314s1999/);
      out.should.match(/\n100 1 {2}\$a CAILLAULT, Serge/);
    });

    it('should read back a UNIMARC record', async () => {
      const record = await Unimarc.transform({ ...document });
      const out = dump(record.toIso2709(), 'unimarc');
      out.should.match(/\n100\s+\$a 20120314d1999/);
    });
  });
});
