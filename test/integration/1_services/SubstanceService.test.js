const should = require('should');
const sinon = require('sinon');

describe('SubstanceService', () => {
  describe('search()', () => {
    it('should return local matches when searching for "Nitr"', async () => {
      const results = await SubstanceService.search('Nitr', false);

      should(results).be.an.Array();
      results.length.should.be.aboveOrEqual(1);

      const nitrate = results.find((r) => r.name === 'Nitrate');
      should(nitrate).not.be.undefined();
      should(nitrate).have.property('id', 1);
      should(nitrate).have.property('name', 'Nitrate');
      should(nitrate).have.property('formula', 'NO3-');
      should(nitrate).have.property('casNumber', '14797-55-8');
      should(nitrate).have.property('externalId', '943');
      should(nitrate).have.property('externalSource', 'PubChem');
    });

    it('should return all substances (limited to 50) when no search param', async () => {
      const results = await SubstanceService.search(null, false);

      should(results).be.an.Array();
      results.length.should.be.aboveOrEqual(3);
      results.length.should.be.belowOrEqual(50);

      // Check ordering by name ASC
      for (let i = 1; i < results.length; i += 1) {
        results[i].name
          .localeCompare(results[i - 1].name)
          .should.be.aboveOrEqual(0);
      }
    });

    describe('no local matches + authenticated (PubChem fallback)', () => {
      let pubChemStub;

      beforeEach(() => {
        pubChemStub = sinon.stub(PubChemService, 'search').resolves([
          {
            name: 'Xylitol',
            formula: 'C5H12O5',
            casNumber: null,
            externalId: '6912',
            externalSource: 'PubChem',
          },
        ]);
      });

      afterEach(() => {
        sinon.restore();
      });

      it('should call PubChem and return results with id=null', async () => {
        const results = await SubstanceService.search(
          'xylitolnonexistent',
          true
        );

        should(pubChemStub.calledOnce).be.true();
        should(pubChemStub.calledWith('xylitolnonexistent')).be.true();

        should(results).be.an.Array();
        results.length.should.be.equal(1);
        should(results[0]).have.property('id', null);
        should(results[0]).have.property('name', 'Xylitol');
        should(results[0]).have.property('formula', 'C5H12O5');
        should(results[0]).have.property('casNumber', null);
        should(results[0]).have.property('externalId', '6912');
        should(results[0]).have.property('externalSource', 'PubChem');
      });
    });

    describe('no local matches + unauthenticated', () => {
      let pubChemStub;

      beforeEach(() => {
        pubChemStub = sinon.stub(PubChemService, 'search').resolves([
          {
            name: 'Xylitol',
            formula: 'C5H12O5',
            casNumber: null,
            externalId: '6912',
            externalSource: 'PubChem',
          },
        ]);
      });

      afterEach(() => {
        sinon.restore();
      });

      it('should return empty array without calling PubChem', async () => {
        const results = await SubstanceService.search(
          'xylitolnonexistent',
          false
        );

        should(pubChemStub.called).be.false();
        should(results).be.an.Array();
        results.length.should.be.equal(0);
      });
    });
  });

  describe('createOrFind()', () => {
    let createdId;

    afterEach(async () => {
      if (createdId) {
        await TSubstance.destroyOne({ id: createdId });
        createdId = null;
      }
    });

    it('should create a new substance and return created=true', async () => {
      const data = {
        name: `Xylitol_Test_${Date.now()}`,
        formula: 'C5H12O5',
        casNumber: '87-99-0',
        externalId: '6912',
      };

      const result = await SubstanceService.createOrFind(data, 1);

      should(result).have.property('created', true);
      should(result).have.property('substance');
      should(result.substance).have.property('id');
      should(result.substance.id).be.a.Number();
      should(result.substance).have.property('name', data.name);
      should(result.substance).have.property('formula', 'C5H12O5');
      should(result.substance).have.property('casNumber', '87-99-0');
      should(result.substance).have.property('externalId', '6912');
      should(result.substance).have.property('externalSource', 'PubChem');

      createdId = result.substance.id;
    });

    it('should return existing substance with created=false for case-insensitive duplicate', async () => {
      const result = await SubstanceService.createOrFind(
        { name: 'nitrate' },
        1
      );

      should(result).have.property('created', false);
      should(result).have.property('substance');
      should(result.substance).have.property('id', 1);
      should(result.substance).have.property('name', 'Nitrate');
    });
  });

  describe('findById()', () => {
    it('should return the substance for an existing ID', async () => {
      const substance = await SubstanceService.findById(1);

      should(substance).not.be.null();
      should(substance).have.property('id', 1);
      should(substance).have.property('name', 'Nitrate');
      should(substance).have.property('formula', 'NO3-');
      should(substance).have.property('casNumber', '14797-55-8');
      should(substance).have.property('externalId', '943');
      should(substance).have.property('externalSource', 'PubChem');
    });

    it('should return null for a non-existent ID', async () => {
      const substance = await SubstanceService.findById(99999);
      should(substance).be.null();
    });
  });
});
