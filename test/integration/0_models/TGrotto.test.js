const should = require('should');
const customSQL = require('../../customSQL');

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

    // https://github.com/GrottoCenter/grottocenter-api/issues/1923
    it('should store OTHER, a deliberate classification unlike null', async () => {
      // Goes through the model isIn and the CHECK constraint of the database
      const organization = await TGrotto.create({
        author: 1,
        dateInscription: new Date(),
        type: 'OTHER',
      }).fetch();
      createdId = organization.id;

      const found = await TGrotto.findOne({ id: createdId });
      should(found.type).equal('OTHER');
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

    describe('history', () => {
      // The history trigger runs in production (sql/0_triggers.sql), not in
      // the test database: attach it for a single update of one organization
      before(() => CommonService.query(customSQL.ATTACH_GROTTO_HISTO_TRIGGER));
      after(() => CommonService.query(customSQL.DETACH_GROTTO_HISTO_TRIGGER));

      // https://github.com/GrottoCenter/grottocenter-api/issues/1923
      it('should keep the previous type when an organization becomes OTHER', async () => {
        const organization = await TGrotto.create({
          author: 1,
          dateInscription: new Date(),
          type: 'EDITION',
        }).fetch();
        try {
          await TGrotto.updateOne({ id: organization.id }).set({
            type: 'OTHER',
          });

          const history = await CommonService.query(
            'SELECT type FROM h_grotto WHERE id = $1',
            [organization.id]
          );
          should(history.rows.map((row) => row.type)).eql(['EDITION']);
          const current = await TGrotto.findOne({ id: organization.id });
          should(current.type).equal('OTHER');
        } finally {
          await CommonService.query('DELETE FROM h_grotto WHERE id = $1', [
            organization.id,
          ]);
          // The first DELETE only soft-deletes the row, the second removes it
          await CommonService.query('DELETE FROM t_grotto WHERE id = $1', [
            organization.id,
          ]);
          await CommonService.query('DELETE FROM t_grotto WHERE id = $1', [
            organization.id,
          ]);
        }
      });
    });
  });
});
