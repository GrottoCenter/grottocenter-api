const should = require('should');
const sinon = require('sinon');
const fc = require('fast-check');
const NotificationService = require('../../../api/services/NotificationService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../api/services/NotificationService');

describe('NotificationService - Property Tests', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('Property 1: Self-notification skip', () => {
    /**
     * For any generated (moderatorId, authorId) pair where they are equal,
     * calling notifyAuthor with a stubbed document SHALL NOT create a
     * TNotification record.
     *
     * Validates: Requirements 2.3, 3.3
     */
    it('should never create a TNotification when moderatorId equals authorId', function selfNotificationSkip() {
      this.timeout(30000);

      const createStub = sinon.stub(TNotification, 'create').resolves();
      sinon.stub(TNotificationType, 'findOne').callsFake(async ({ name }) => {
        if (name === NOTIFICATION_TYPES.REJECT) return { id: 7 };
        return { id: 4 };
      });
      sinon
        .stub(TCaver, 'findOne')
        .resolves({ id: 1, sendNotificationByEmail: false });

      return fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }).map((id) => ({
            moderatorId: id,
            authorId: id,
          })),
          fc.constantFrom(
            NOTIFICATION_TYPES.VALIDATE,
            NOTIFICATION_TYPES.REJECT
          ),
          async ({ moderatorId, authorId }, notificationType) => {
            createStub.resetHistory();

            const document = { id: 99, author: authorId, name: 'Test Doc' };
            await NotificationService.notifyAuthor(
              document,
              moderatorId,
              notificationType,
              null
            );

            should(createStub.called).be.false(
              `TNotification.create should not be called when moderatorId (${moderatorId}) equals authorId (${authorId})`
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Notifier identity', () => {
    /**
     * For any generated moderatorId (distinct from authorId), the notifier
     * field on the TNotification.create call SHALL equal the moderatorId
     * argument.
     *
     * Validates: Requirements 2.4, 3.4
     */
    it('should set the notifier field to the moderatorId argument', function notifierIdentity() {
      this.timeout(30000);

      const createStub = sinon.stub(TNotification, 'create').resolves();
      sinon.stub(TNotificationType, 'findOne').callsFake(async ({ name }) => {
        if (name === NOTIFICATION_TYPES.REJECT) return { id: 7 };
        return { id: 4 };
      });
      sinon
        .stub(TCaver, 'findOne')
        .resolves({ id: 1, sendNotificationByEmail: false });

      return fc.assert(
        fc.asyncProperty(
          fc
            .tuple(
              fc.integer({ min: 1, max: 10000 }),
              fc.integer({ min: 1, max: 10000 })
            )
            .filter(([a, b]) => a !== b),
          fc.constantFrom(
            NOTIFICATION_TYPES.VALIDATE,
            NOTIFICATION_TYPES.REJECT
          ),
          async ([moderatorId, authorId], notificationType) => {
            createStub.resetHistory();

            const document = { id: 99, author: authorId, name: 'Test Doc' };
            await NotificationService.notifyAuthor(
              document,
              moderatorId,
              notificationType,
              null
            );

            should(createStub.calledOnce).be.true(
              'TNotification.create should be called once'
            );

            const createArg = createStub.firstCall.args[0];
            should(createArg.notifier).equal(
              moderatorId,
              `notifier should be ${moderatorId} but was ${createArg.notifier}`
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Email opt-in gate', () => {
    /**
     * For any generated boolean sendNotificationByEmail value on the author
     * caver, sendNotificationEmail SHALL be called if and only if the value
     * is true. We detect this by stubbing sails.helpers.sendEmail, which is
     * the downstream call made by sendNotificationEmail.
     *
     * Validates: Requirements 4.1, 4.2
     */
    it('should call sendNotificationEmail iff sendNotificationByEmail is true', function emailOptInGate() {
      this.timeout(30000);

      sinon.stub(TNotification, 'create').resolves();
      sinon.stub(TNotificationType, 'findOne').resolves({ id: 4 });

      const sendEmailWithStub = sinon.stub().returns({
        intercept: sinon.stub().resolves(),
      });
      sinon.stub(sails.helpers, 'sendEmail').value({
        with: sendEmailWithStub,
      });

      const caverFindOneStub = sinon.stub(TCaver, 'findOne');

      return fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          fc.constantFrom(
            NOTIFICATION_TYPES.VALIDATE,
            NOTIFICATION_TYPES.REJECT
          ),
          async (optIn, notificationType) => {
            sendEmailWithStub.resetHistory();
            caverFindOneStub.resolves({
              id: 2,
              nickname: 'TestAuthor',
              mail: 'test@example.com',
              sendNotificationByEmail: optIn,
            });

            const document = { id: 99, author: 2, name: 'Test Doc' };
            await NotificationService.notifyAuthor(
              document,
              1,
              notificationType,
              notificationType === NOTIFICATION_TYPES.REJECT
                ? 'Some reason'
                : null
            );

            if (optIn) {
              should(sendEmailWithStub.calledOnce).be.true(
                'sendNotificationEmail should be called when opt-in is true'
              );
            } else {
              should(sendEmailWithStub.called).be.false(
                'sendNotificationEmail should not be called when opt-in is false'
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Rejection comment inclusion', () => {
    /**
     * For any generated non-empty validationComment string, when
     * sendNotificationEmail is called with isAuthorNotification: true and
     * NOTIFICATION_TYPES.REJECT, the call completes without error and the
     * viewValues passed to sails.helpers.sendEmail.with include the
     * validationComment.
     *
     * Validates: Requirements 4.3
     */
    it('should include validationComment in viewValues for rejection emails', function rejectionCommentInclusion() {
      this.timeout(30000);

      const sendEmailWithStub = sinon.stub().returns({
        intercept: sinon.stub().resolves(),
      });
      sinon.stub(sails.helpers, 'sendEmail').value({
        with: sendEmailWithStub,
      });

      const user = {
        id: 1,
        nickname: 'Test',
        mail: 'test@test.com',
        isAuthorNotification: true,
        validationComment: null,
        subscriptionName: 'France',
        subscriptionType: 'country',
      };

      const entity = { id: 1, name: 'Test Document' };

      return fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (validationComment) => {
            sendEmailWithStub.resetHistory();

            await NotificationService.sendNotificationEmail(
              entity,
              NOTIFICATION_TYPES.REJECT,
              NOTIFICATION_ENTITIES.DOCUMENT,
              { ...user, validationComment }
            );

            should(sendEmailWithStub.calledOnce).be.true(
              'sails.helpers.sendEmail.with should be called once'
            );

            const callArgs = sendEmailWithStub.firstCall.args[0];
            should(callArgs.viewValues.validationComment).equal(
              validationComment,
              `viewValues.validationComment should be "${validationComment}"`
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Template context distinction', () => {
    /**
     * For any generated isAuthorNotification boolean, the sendNotificationEmail
     * call completes without error, and the viewValues passed to
     * sails.helpers.sendEmail.with include the correct isAuthorNotification flag.
     *
     * Validates: Requirements 4.5
     */
    it('should pass the correct isAuthorNotification flag in viewValues', function templateContextDistinction() {
      this.timeout(30000);

      const sendEmailWithStub = sinon.stub().returns({
        intercept: sinon.stub().resolves(),
      });
      sinon.stub(sails.helpers, 'sendEmail').value({
        with: sendEmailWithStub,
      });

      const entity = { id: 1, name: 'Test Document' };

      return fc.assert(
        fc.asyncProperty(fc.boolean(), async (isAuthorNotification) => {
          sendEmailWithStub.resetHistory();

          const user = {
            id: 1,
            nickname: 'Test',
            mail: 'test@test.com',
            isAuthorNotification,
            validationComment: isAuthorNotification ? 'Some reason' : null,
            subscriptionName: 'France',
            subscriptionType: 'country',
          };

          await NotificationService.sendNotificationEmail(
            entity,
            NOTIFICATION_TYPES.VALIDATE,
            NOTIFICATION_ENTITIES.DOCUMENT,
            user
          );

          should(sendEmailWithStub.calledOnce).be.true(
            'sails.helpers.sendEmail.with should be called once'
          );

          const callArgs = sendEmailWithStub.firstCall.args[0];
          should(callArgs.viewValues.isAuthorNotification).equal(
            isAuthorNotification,
            `viewValues.isAuthorNotification should be ${isAuthorNotification}`
          );
        }),
        { numRuns: 100 }
      );
    });
  });
});
