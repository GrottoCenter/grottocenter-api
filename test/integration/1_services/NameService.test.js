const should = require('should');
const NameService = require('../../../api/services/NameService');

describe('NameService', () => {
  describe('setNames()', () => {
    it('should return null when entitiesToComplete is null', async () => {
      const result = await NameService.setNames(null, 'entrance');
      should(result).be.null();
    });

    it('should return null when entitiesToComplete is undefined', async () => {
      const result = await NameService.setNames(undefined, 'entrance');
      should(result).be.null();
    });

    it('should set names for entrances', async () => {
      const entrances = await TEntrance.find({ id: [1, 2] });
      await NameService.setNames(entrances, 'entrance');

      should(entrances[0].names).be.an.Array();
      should(entrances[0].names.length).be.greaterThan(0);
      should(entrances[0].name).be.a.String();
    });

    it('should set names for grottos', async () => {
      const grottos = await TGrotto.find({ id: [1, 2] });
      await NameService.setNames(grottos, 'grotto');

      should(grottos[0].names).be.an.Array();
      should(grottos[0].name).be.a.String();
    });

    it('should set names for massifs', async () => {
      const massifs = await TMassif.find({ id: [1, 2] });
      await NameService.setNames(massifs, 'massif');

      should(massifs[0].names).be.an.Array();
      should(massifs[0].name).be.a.String();
    });

    it('should set names for caves', async () => {
      const caves = await TCave.find({ id: [1, 2] });
      await NameService.setNames(caves, 'cave');

      should(caves[0].names).be.an.Array();
    });

    it('should handle cave with no names by using entrance name', async () => {
      const cave = await TCave.create({ author: 1, depth: 100 }).fetch();
      const entrance = await TEntrance.create({
        author: 1,
        cave: cave.id,
        latitude: 45.0,
        longitude: 6.0,
      }).fetch();
      await TName.create({
        entrance: entrance.id,
        name: 'TestEntranceName',
        language: 'eng',
        isMain: true,
      });

      const caves = [cave];
      await NameService.setNames(caves, 'cave');

      should(caves[0].names).be.an.Array();
      should(caves[0].names.length).be.greaterThan(0);
      should(caves[0].name).equal('TestEntranceName');

      await TName.destroy({ entrance: entrance.id });
      await TEntrance.destroyOne({ id: entrance.id });
      await TCave.destroyOne({ id: cave.id });
    });

    it('should handle cave with no names and no entrance', async () => {
      const cave = await TCave.create({ author: 1, depth: 100 }).fetch();

      const caves = [cave];
      await NameService.setNames(caves, 'cave');

      should(caves[0].names).be.an.Array();
      should(caves[0].names.length).equal(0);

      await TCave.destroyOne({ id: cave.id });
    });

    it('should handle empty array', async () => {
      const result = await NameService.setNames([], 'entrance');
      should(result).be.an.Array();
      should(result.length).equal(0);
    });
  });

  describe('permanentDelete()', () => {
    it('should permanently delete names', async () => {
      const entrance = await TEntrance.create({
        author: 1,
        latitude: 45.0,
        longitude: 6.0,
      }).fetch();
      const name = await TName.create({
        entrance: entrance.id,
        name: 'TestNameToDelete',
        language: 'eng',
        isMain: true,
      }).fetch();

      await NameService.permanentDelete({ id: name.id });

      const deletedName = await TName.findOne({ id: name.id });
      should(deletedName).be.undefined();

      await TEntrance.destroyOne({ id: entrance.id });
    });
  });
});
