const should = require('should');

describe('TGrottoModel', () => {
  describe('type', () => {
    let createdId;

    afterEach(async () => {
      if (createdId) {
        await TGrotto.destroyOne({ id: createdId });
        createdId = null;
      }
    });

    it('should read an organization whose type is not set as null', async () => {
      // Organization 3 stands for the organizations that existed before
      // types were introduced: the migration leaves them NULL
      const organization = await TGrotto.findOne({ id: 3 });
      should(organization.type).be.null();
    });

    it('should store a type from the controlled list', async () => {
      const organization = await TGrotto.create({
        author: 1,
        dateInscription: new Date(),
        type: 'CAVE_RESCUE',
      }).fetch();
      createdId = organization.id;

      const found = await TGrotto.findOne({ id: createdId });
      should(found.type).equal('CAVE_RESCUE');
    });

    it('should reject a type outside the controlled list', async () => {
      await should(
        TGrotto.create({
          author: 1,
          dateInscription: new Date(),
          type: 'FAN_CLUB',
        })
      ).be.rejectedWith({ code: 'E_INVALID_NEW_RECORD' });
    });
  });
});
