const should = require('should');
const Fixted = require('fixted');

const fixted = new Fixted();
const fixtures = fixted.data;

describe('TSubstanceModel', () => {
  describe('ORM -> find all', () => {
    it('should return all fixture substances', async () => {
      const results = await TSubstance.find();
      results.length.should.be.equal(fixtures.tsubstance.length);
    });
  });

  describe('ORM -> create valid substance', () => {
    let createdId;

    afterEach(async () => {
      if (createdId) {
        await TSubstance.destroyOne({ id: createdId });
        createdId = null;
      }
    });

    it('should create a substance with all fields', async () => {
      const substance = await TSubstance.create({
        name: 'Sulfite',
        formula: 'SO3^2-',
        casNumber: '14265-45-3',
        externalId: '1099',
        externalSource: 'PubChem',
        author: 1,
        dateInscription: new Date(),
      }).fetch();

      createdId = substance.id;

      substance.should.have.property('id');
      substance.id.should.be.a.Number();
      substance.name.should.be.equal('Sulfite');
      substance.formula.should.be.equal('SO3^2-');
      substance.casNumber.should.be.equal('14265-45-3');
      substance.externalId.should.be.equal('1099');
      substance.externalSource.should.be.equal('PubChem');
      substance.author.should.be.equal(1);
      substance.should.have.property('dateInscription');
    });
  });

  describe('ORM -> reject duplicate name', () => {
    it('should reject a substance with a duplicate name', async () => {
      try {
        await TSubstance.create({
          name: 'Nitrate',
          formula: 'NO3-',
          author: 1,
          dateInscription: new Date(),
        }).fetch();
        throw new Error('Should have failed');
      } catch (err) {
        err.code.should.be.equal('E_UNIQUE');
      }
    });
  });

  describe('ORM -> reject missing name', () => {
    it('should reject a substance without a name', async () => {
      try {
        await TSubstance.create({
          formula: 'H2O',
          author: 1,
          dateInscription: new Date(),
        }).fetch();
        throw new Error('Should have failed');
      } catch (err) {
        err.name.should.be.equal('UsageError');
      }
    });
  });

  describe('ORM -> externalSource null when externalId null', () => {
    let createdId;

    afterEach(async () => {
      if (createdId) {
        await TSubstance.destroyOne({ id: createdId });
        createdId = null;
      }
    });

    it('should have externalSource null when externalId is null', async () => {
      const substance = await TSubstance.create({
        name: 'TestSubstanceNoExternal',
        formula: null,
        casNumber: null,
        externalId: null,
        externalSource: null,
        author: 1,
        dateInscription: new Date(),
      }).fetch();

      createdId = substance.id;

      should(substance.externalId).be.null();
      should(substance.externalSource).be.null();
    });
  });
});
