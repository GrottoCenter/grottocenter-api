const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');

/**
 * Registers the `isPermanent` parsing cases shared by every DELETE route of a
 * soft-deletable entity. Call it inside the route's describe block.
 *
 * The test database only carries the soft-delete trigger on t_grotto and
 * t_guideline, so on most tables a soft delete removes the row just like a
 * permanent one, and the row's presence cannot tell them apart. Each route
 * therefore exposes the decision another way:
 *
 * - `observe: 'notification'` — the route notifies subscribers with either
 *   DELETE or PERMANENT_DELETE, so the notification type is the observable.
 * - `observe: 'forbidden'` — permanent deletion is administrator-only, so a
 *   moderator asking for it gets a 403 before anything is written, while a
 *   soft delete succeeds.
 *
 * @param {object} options
 * @param {() => string} options.getToken moderator bearer token
 * @param {() => object} options.getModel the Waterline model of the entity,
 *   used to destroy what the cases created (a getter: models are globals set
 *   by the lift, after this is called)
 * @param {() => Promise<{ id: number }>} options.createEntity creates a fresh,
 *   non-deleted entity
 * @param {(id: number) => string} options.deleteUrl the DELETE path
 * @param {(id: number) => Promise<object|undefined>} options.findEntity reads
 *   the entity back
 * @param {'notification'|'forbidden'} options.observe
 */
module.exports = ({
  getToken,
  getModel,
  createEntity: createRawEntity,
  deleteUrl,
  findEntity,
  observe,
}) => {
  describe('isPermanent parsing', () => {
    let NotificationService;
    let notifySpy;
    let createdIds;

    // Rejected deletes leave their entity behind. Under `npm run coverage` every
    // file shares one database, so a leftover comment on entrance 1 shows up in
    // the Entrances tests.
    const createEntity = async () => {
      const entity = await createRawEntity();
      createdIds.push(entity.id);
      return entity;
    };

    before(() => {
      // Resolved after the lift: a top-level require returns a copy of the
      // service that the controllers never call.
      // eslint-disable-next-line global-require
      NotificationService = require('../../api/services/NotificationService');
    });

    beforeEach(() => {
      createdIds = [];
      notifySpy = sinon.spy(NotificationService, 'notifySubscribers');
    });

    afterEach(async () => {
      notifySpy.restore();
      await getModel().destroy({ id: createdIds });
    });

    const sendDelete = (id, query) =>
      supertest(sails.hooks.http.app)
        .delete(`${deleteUrl(id)}${query}`)
        .set('Authorization', getToken())
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

    const notifiedType = () => {
      should(notifySpy.calledOnce).be.true();
      return notifySpy.firstCall.args[2];
    };

    ['false', '0', ''].forEach((value) => {
      it(`should soft delete, not permanently, when isPermanent=${value}`, async () => {
        const entity = await createEntity();

        await sendDelete(entity.id, `?isPermanent=${value}`).expect(200);

        if (observe === 'notification') {
          should(notifiedType()).equal(
            NotificationService.NOTIFICATION_TYPES.DELETE
          );
        }
      });
    });

    it('should treat isPermanent=1 (the web client encoding) as permanent', async () => {
      const entity = await createEntity();

      if (observe === 'notification') {
        await sendDelete(entity.id, '?isPermanent=1').expect(200);
        should(notifiedType()).equal(
          NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE
        );
      } else {
        await sendDelete(entity.id, '?isPermanent=1').expect(403);
        const untouched = await findEntity(entity.id);
        should(untouched.isDeleted).be.false();
      }
    });

    ['yes', 'TRUE', '2', 'on'].forEach((value) => {
      it(`should return 400 and leave the entity untouched when isPermanent=${value}`, async () => {
        const entity = await createEntity();

        const res = await sendDelete(entity.id, `?isPermanent=${value}`).expect(
          400
        );

        should(res.body.code).equal('E_BAD_REQUEST');
        should(res.body.metadata.field).equal('isPermanent');
        const untouched = await findEntity(entity.id);
        should(untouched).not.be.undefined();
        should(untouched.isDeleted).be.false();
        should(notifySpy.called).be.false();
      });
    });

    it('should return 400 when isPermanent is repeated', async () => {
      const entity = await createEntity();

      await sendDelete(entity.id, '?isPermanent=1&isPermanent=0').expect(400);

      const untouched = await findEntity(entity.id);
      should(untouched.isDeleted).be.false();
    });
  });
};
