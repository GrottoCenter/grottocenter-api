/* eslint-disable global-require */
const should = require('should');

describe('marcConvertor/MarcRecord', () => {
  let Marc;

  before(() => {
    Marc = require('../../../../api/services/marcConvertor/MarcRecord');
  });

  describe('constructor', () => {
    it('should create a new Marc instance', () => {
      const marc = new Marc();
      should.exist(marc.record);
    });
  });

  describe('addControlField', () => {
    it('should add a control field', () => {
      const marc = new Marc();
      marc.addControlField('001', '12345');
      const fields = marc.getFieldsByTag('001');
      should(fields.length).equal(1);
      should(fields[0].value).equal('12345');
    });
  });

  describe('addDataField', () => {
    it('should add a data field', () => {
      const marc = new Marc();
      marc.addDataField('245', '1', '0', [['a', 'Test Title']]);
      const fields = marc.getFieldsByTag('245');
      should(fields.length).equal(1);
    });

    it('should add data field with skipValidation', () => {
      const marc = new Marc();
      marc.addDataField('999', '1', '0', [['a', 'Custom']], true);
      should(marc.record.fields.length).be.greaterThan(0);
    });
  });

  describe('addLeader', () => {
    it('should set the leader', () => {
      const marc = new Marc();
      marc.addLeader('00000nam a2200000 i 4500');
      should(marc.record.leader).equal('00000nam a2200000 i 4500');
    });
  });

  describe('getRecord', () => {
    it('should return the record', () => {
      const marc = new Marc();
      const record = marc.getRecord();
      should.exist(record);
    });
  });

  describe('clear', () => {
    it('should clear the record', () => {
      const marc = new Marc();
      marc.addControlField('001', '12345');
      marc.clear();
      const fields = marc.getFieldsByTag('001');
      should(fields.length).equal(0);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const marc = new Marc();
      marc.addControlField('001', '12345');
      const str = marc.toString();
      should(str).be.a.String();
    });
  });

  describe('getCurrentLength', () => {
    it('should return length of record', () => {
      const marc = new Marc();
      marc.addControlField('001', '12345');
      const length = marc.getCurrentLength();
      should(length).be.a.Number();
      should(length).be.greaterThan(0);
    });

    it('should return length for empty record', () => {
      const marc = new Marc();
      const length = marc.getCurrentLength();
      should(length).be.a.Number();
    });
  });

  describe('transformDocumentToIso2709', () => {
    it('should transform to ISO2709 format', async () => {
      const marc = new Marc();
      marc.addControlField('001', '12345');
      const iso = await marc.transformDocumentToIso2709();
      should(iso).be.a.String();
    });
  });

  describe('toIso2709', () => {
    it('should transform to ISO2709 synchronously', () => {
      const marc = new Marc();
      marc.addControlField('001', '12345');
      const iso = marc.toIso2709();
      should(iso).be.a.String();
    });
  });

  describe('getFieldsByTag', () => {
    it('should return fields by tag', () => {
      const marc = new Marc();
      marc.addControlField('001', '12345');
      const fields = marc.getFieldsByTag('001');
      should(fields).be.an.Array();
    });
  });

  describe('isValid', () => {
    it('should return true for valid record', () => {
      const marc = new Marc();
      marc.addControlField('001', '12345');
      should(marc.isValid()).be.true();
    });

    it('should validate empty record', () => {
      const marc = new Marc();
      const valid = marc.isValid();
      should(valid).be.a.Boolean();
    });
  });
});
