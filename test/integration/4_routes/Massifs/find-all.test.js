const deletedListTests = require('../_helpers/deletedListTests');

// https://github.com/GrottoCenter/grottocenter-api/issues/1931
describe('Massif find-all', () => {
  const created = [];

  const createMassif = async (attributes, name) => {
    const massif = await TMassif.create({ author: 1, ...attributes }).fetch();
    created.push(massif.id);
    await TName.create({
      author: 1,
      massif: massif.id,
      name,
      language: 'fra',
      isMain: true,
    });
    return massif;
  };

  deletedListTests({
    path: '/api/v1/massifs',
    key: 'massifs',
    model: () => TMassif,
    seed: async () => {
      const active = await createMassif({}, 'Active list massif');
      const deleted = await createMassif(
        { isDeleted: true },
        'Deleted list massif'
      );
      const merged = await createMassif(
        { isDeleted: true, redirectTo: active.id },
        'Merged list massif'
      );
      return {
        activeIds: [active.id],
        // Massif 102 is deleted in the fixtures.
        deletedIds: [deleted.id, merged.id, 102],
        mergedId: merged.id,
        mergedInto: active.id,
      };
    },
    cleanup: async () => {
      await TName.destroy({ massif: created });
      await TMassif.destroy({ id: created });
    },
  });
});
