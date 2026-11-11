const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const sharp = require('sharp');
const AuthTokenService = require('../../AuthTokenService');

// https://github.com/GrottoCenter/grottocenter-api/issues/1730
describe('Organization avatar', () => {
  const organizationId = 1;
  let userToken;
  let userId;
  let originalReviewer;
  let FileService;
  let originalCredentials;
  let uploadData;
  let deleteBlob;
  let jpegImage;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    userId = (await TCaver.findOne({ mail: 'user1@user1.com' })).id;
    originalReviewer = (await TGrotto.findOne({ id: organizationId })).reviewer;
    jpegImage = await sharp({
      create: { width: 900, height: 300, channels: 3, background: '#aa3300' },
    })
      .jpeg()
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
    await TGrotto.updateOne({ id: organizationId }).set({
      avatarPath: null,
      reviewer: originalReviewer,
      isDeleted: false,
    });
  });

  after(() => {
    FileService.setCredentialsForTest(originalCredentials);
  });

  const putAvatar = (id, token = userToken) => {
    const request = supertest(sails.hooks.http.app)
      .put(`/api/v1/organizations/${id}/avatar`)
      .set('Accept', 'application/json');
    if (token) request.set('Authorization', token);
    return request.attach('file', jpegImage, 'logo.jpg');
  };

  const deleteAvatar = (id, token = userToken) => {
    const request = supertest(sails.hooks.http.app)
      .delete(`/api/v1/organizations/${id}/avatar`)
      .set('Accept', 'application/json');
    if (token) request.set('Authorization', token);
    return request;
  };

  it('returns 401 without a token', async () => {
    await putAvatar(organizationId, null).expect(401);
    await deleteAvatar(organizationId, null).expect(401);
  });

  it('returns 404 for an invalid id', async () => {
    await putAvatar('abc').expect(404);
  });

  it('returns 404 for an unknown organization', async () => {
    await putAvatar(987654321).expect(404);
    await deleteAvatar(987654321).expect(404);
  });

  it('returns 404 for a deleted organization', async () => {
    await TGrotto.updateOne({ id: organizationId }).set({ isDeleted: true });
    await putAvatar(organizationId).expect(404);
    should(uploadData.callCount).equal(0);
  });

  it('returns 400 without a file', async () => {
    await supertest(sails.hooks.http.app)
      .put(`/api/v1/organizations/${organizationId}/avatar`)
      .set('Authorization', userToken)
      .expect(400);
  });

  it('stores the avatar, records the reviewer and exposes the URL', async () => {
    const res = await putAvatar(organizationId).expect(200);
    should(res.body.avatarUrl).match(
      /\/documents\/avatars\/organizations\/1-[0-9a-f]{16}\.webp$/
    );
    should(uploadData.callCount).equal(1);
    const stored = await TGrotto.findOne({ id: organizationId });
    should(stored.reviewer).equal(userId);
    should(res.body.avatarUrl).endWith(stored.avatarPath);

    // The host depends on the storage mode, only the path is compared
    const organization = await supertest(sails.hooks.http.app)
      .get(`/api/v1/organizations/${organizationId}`)
      .set('Accept', 'application/json')
      .expect(200);
    should(organization.body.avatarUrl).endWith(stored.avatarPath);
  });

  it('removes the avatar', async () => {
    await putAvatar(organizationId).expect(200);
    const { avatarPath } = await TGrotto.findOne({ id: organizationId });
    await deleteAvatar(organizationId).expect(204);
    should(deleteBlob.firstCall.args[0]).equal(avatarPath);
    const organization = await supertest(sails.hooks.http.app)
      .get(`/api/v1/organizations/${organizationId}`)
      .set('Accept', 'application/json')
      .expect(200);
    should(organization.body.avatarUrl).be.null();
  });
});
