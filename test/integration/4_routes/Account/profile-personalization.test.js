const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const sharp = require('sharp');
const AuthTokenService = require('../../AuthTokenService');

// https://github.com/GrottoCenter/grottocenter-api/issues/1730
describe('Account profile personalization', () => {
  let userToken;
  let caverId;
  let FileService;
  let originalCredentials;
  let uploadData;
  let deleteBlob;
  let pngImage;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    caverId = (await TCaver.findOne({ mail: 'user1@user1.com' })).id;
    pngImage = await sharp({
      create: { width: 64, height: 64, channels: 3, background: '#336699' },
    })
      .png()
      .toBuffer();
    // The global is the instance the services call
    ({ FileService } = global);
    originalCredentials = FileService.getCredentialsForTest();
    uploadData = sinon.stub().resolves();
    deleteBlob = sinon.stub().resolves();
    FileService.setCredentialsForTest({
      documentsBlobClient: {
        getBlockBlobClient: (blobPath) => ({
          uploadData: async (buffer, options) =>
            uploadData(blobPath, buffer, options),
          deleteIfExists: async (options) => deleteBlob(blobPath, options),
        }),
      },
    });
  });

  beforeEach(() => {
    uploadData.resetHistory();
    deleteBlob.resetHistory();
  });

  afterEach(async () => {
    await TCaver.updateOne({ id: caverId }).set({
      customMessage: null,
      avatarPath: null,
    });
  });

  after(() => {
    FileService.setCredentialsForTest(originalCredentials);
  });

  const patchAccount = (body) =>
    supertest(sails.hooks.http.app)
      .patch('/api/v1/account')
      .set('Authorization', userToken)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .send(body);

  const getAccount = () =>
    supertest(sails.hooks.http.app)
      .get('/api/v1/account')
      .set('Authorization', userToken)
      .set('Accept', 'application/json')
      .expect(200);

  const putAvatar = (buffer, filename = 'me.png', token = userToken) => {
    const request = supertest(sails.hooks.http.app)
      .put('/api/v1/account/avatar')
      .set('Accept', 'application/json');
    if (token) request.set('Authorization', token);
    return buffer ? request.attach('file', buffer, filename) : request;
  };

  describe('Custom message', () => {
    it('returns no custom message and no avatar by default', async () => {
      const res = await getAccount();
      should(res.body.customMessage).be.null();
      should(res.body.avatarUrl).be.null();
    });

    it('stores a trimmed custom message', async () => {
      await patchAccount({
        customMessage: '  Cave diver from the Jura ',
      }).expect(204);
      const res = await getAccount();
      should(res.body.customMessage).equal('Cave diver from the Jura');
    });

    it('clears the custom message with an empty string', async () => {
      await TCaver.updateOne({ id: caverId }).set({ customMessage: 'Hello' });
      await patchAccount({ customMessage: '' }).expect(204);
      const caver = await TCaver.findOne({ id: caverId });
      should(caver.customMessage).be.null();
    });

    it('rejects a custom message over 500 characters', async () => {
      await patchAccount({ customMessage: 'x'.repeat(501) }).expect(400);
      const caver = await TCaver.findOne({ id: caverId });
      should(caver.customMessage).be.null();
    });

    it('rejects a custom message that is not a string', async () => {
      await patchAccount({ customMessage: 12 }).expect(400);
    });

    it('is shown on the public caver profile', async () => {
      await patchAccount({ customMessage: 'Hello' }).expect(204);
      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/cavers/${caverId}`)
        .set('Accept', 'application/json')
        .expect(200);
      should(res.body.customMessage).equal('Hello');
      should(res.body.avatarUrl).be.null();
    });
  });

  describe('Avatar', () => {
    it('returns 401 without a token', async () => {
      await putAvatar(pngImage, 'me.png', null).expect(401);
      await supertest(sails.hooks.http.app)
        .delete('/api/v1/account/avatar')
        .expect(401);
    });

    it('returns 400 without a file', async () => {
      await putAvatar(null).expect(400);
    });

    it('returns 400 for a file that is not an image', async () => {
      await putAvatar(Buffer.from('%PDF-1.4'), 'me.png').expect(400);
      should(uploadData.callCount).equal(0);
    });

    it('stores the avatar and exposes its URL', async () => {
      const res = await putAvatar(pngImage).expect(200);
      should(res.body.avatarUrl).match(
        new RegExp(`/documents/avatars/cavers/${caverId}-[0-9a-f]{16}\\.webp$`)
      );
      should(uploadData.callCount).equal(1);

      const { avatarPath } = await TCaver.findOne({ id: caverId });
      should(res.body.avatarUrl).endWith(avatarPath);

      const account = await getAccount();
      should(account.body.avatarUrl).endWith(avatarPath);

      // The host depends on the storage mode, only the path is compared
      const profile = await supertest(sails.hooks.http.app)
        .get(`/api/v1/cavers/${caverId}`)
        .set('Accept', 'application/json')
        .expect(200);
      should(profile.body.avatarUrl).endWith(avatarPath);
    });

    it('replaces the previous avatar', async () => {
      await putAvatar(pngImage).expect(200);
      const { avatarPath: first } = await TCaver.findOne({ id: caverId });
      await putAvatar(pngImage).expect(200);
      should(deleteBlob.callCount).equal(1);
      should(deleteBlob.firstCall.args[0]).equal(first);
    });

    it('removes the avatar', async () => {
      await putAvatar(pngImage).expect(200);
      const { avatarPath } = await TCaver.findOne({ id: caverId });
      await supertest(sails.hooks.http.app)
        .delete('/api/v1/account/avatar')
        .set('Authorization', userToken)
        .expect(204);
      should(deleteBlob.firstCall.args[0]).equal(avatarPath);
      const account = await getAccount();
      should(account.body.avatarUrl).be.null();
    });

    it('answers 204 when there is no avatar to remove', async () => {
      await supertest(sails.hooks.http.app)
        .delete('/api/v1/account/avatar')
        .set('Authorization', userToken)
        .expect(204);
      should(deleteBlob.callCount).equal(0);
    });
  });
});
