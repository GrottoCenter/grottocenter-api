const should = require('should');
const sinon = require('sinon');
const sharp = require('sharp');

const makeImage = (width, height, format = 'png') =>
  sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 10, g: 120, b: 200 },
    },
  })
    [format]()
    .toBuffer();

describe('AvatarService', () => {
  let AvatarService;
  let FileService;
  let originalCredentials;
  let uploadData;
  let deleteBlob;

  before(() => {
    // eslint-disable-next-line global-require
    AvatarService = require('../../../api/services/AvatarService');
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

  after(() => {
    FileService.setCredentialsForTest(originalCredentials);
  });

  describe('validateUpload', () => {
    it('rejects a missing file', () => {
      should(AvatarService.validateUpload(undefined)).be.a.String();
    });

    it('rejects an empty file', () => {
      should(
        AvatarService.validateUpload({ size: 0, buffer: Buffer.alloc(0) })
      ).be.a.String();
    });

    it('rejects a file over the size limit', () => {
      should(
        AvatarService.validateUpload({
          size: AvatarService.MAX_AVATAR_BYTES + 1,
          buffer: Buffer.from('x'),
        })
      ).match(/5 MB/);
    });

    it('accepts a file within the size limit', () => {
      should(
        AvatarService.validateUpload({ size: 3, buffer: Buffer.from('abc') })
      ).be.null();
    });
  });

  describe('encode', () => {
    it('re-encodes a large image as a square WebP', async () => {
      const encoded = await AvatarService.encode(await makeImage(1200, 800));
      const meta = await sharp(encoded).metadata();
      should(meta.format).equal('webp');
      should(meta.width).equal(AvatarService.AVATAR_SIZE);
      should(meta.height).equal(AvatarService.AVATAR_SIZE);
    });

    it('crops a small rectangular image to a square without enlarging it', async () => {
      const encoded = await AvatarService.encode(
        await makeImage(100, 80, 'jpeg')
      );
      const meta = await sharp(encoded).metadata();
      should(meta.format).equal('webp');
      should(meta.width).equal(80);
      should(meta.height).equal(80);
    });

    it('crops a wide image whose short edge is below the avatar size to a square', async () => {
      const encoded = await AvatarService.encode(await makeImage(900, 300));
      const meta = await sharp(encoded).metadata();
      should(meta.width).equal(300);
      should(meta.height).equal(300);
    });

    it('crops a tall image to a square of the avatar size', async () => {
      const encoded = await AvatarService.encode(await makeImage(600, 1500));
      const meta = await sharp(encoded).metadata();
      should(meta.width).equal(AvatarService.AVATAR_SIZE);
      should(meta.height).equal(AvatarService.AVATAR_SIZE);
    });

    it('uses the oriented dimensions of a rotated photo', async () => {
      const rotated = await sharp({
        create: {
          width: 900,
          height: 300,
          channels: 3,
          background: { r: 10, g: 120, b: 200 },
        },
      })
        .jpeg()
        .withMetadata({ orientation: 6 })
        .toBuffer();
      const encoded = await AvatarService.encode(rotated);
      const meta = await sharp(encoded).metadata();
      should(meta.width).equal(300);
      should(meta.height).equal(300);
    });

    it('rejects a file that is not an image', async () => {
      await should(
        AvatarService.encode(Buffer.from('not an image'))
      ).be.rejectedWith({ code: AvatarService.INVALID_IMAGE });
    });

    it('rejects an SVG image', async () => {
      const svg = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>'
      );
      await should(AvatarService.encode(svg)).be.rejectedWith({
        code: AvatarService.INVALID_IMAGE,
      });
    });

    it('rejects a TIFF image', async () => {
      await should(
        AvatarService.encode(await makeImage(20, 20, 'tiff'))
      ).be.rejectedWith({ code: AvatarService.INVALID_IMAGE });
    });
  });

  describe('setAvatar / removeAvatar', () => {
    const caverId = 1;

    afterEach(async () => {
      await TCaver.updateOne({ id: caverId }).set({ avatarPath: null });
    });

    it('stores the image and records its path', async () => {
      const avatarPath = await AvatarService.setAvatar(
        'caver',
        caverId,
        await makeImage(600, 600)
      );
      should(avatarPath).match(/^avatars\/cavers\/1-[0-9a-f]{16}\.webp$/);
      should(uploadData.callCount).equal(1);
      should(uploadData.firstCall.args[0]).equal(avatarPath);
      should(
        uploadData.firstCall.args[2].blobHTTPHeaders.blobContentType
      ).equal('image/webp');
      const caver = await TCaver.findOne({ id: caverId });
      should(caver.avatarPath).equal(avatarPath);
      should(deleteBlob.callCount).equal(0);
    });

    it('removes the previous image when it is replaced', async () => {
      const first = await AvatarService.setAvatar(
        'caver',
        caverId,
        await makeImage(50, 50)
      );
      const second = await AvatarService.setAvatar(
        'caver',
        caverId,
        await makeImage(50, 50)
      );
      should(second).not.equal(first);
      should(deleteBlob.callCount).equal(1);
      should(deleteBlob.firstCall.args[0]).equal(first);
    });

    it('stores nothing when the image is rejected', async () => {
      await should(
        AvatarService.setAvatar('caver', caverId, Buffer.from('nope'))
      ).be.rejectedWith({ code: AvatarService.INVALID_IMAGE });
      should(uploadData.callCount).equal(0);
    });

    it('does not record a path when the upload fails', async () => {
      uploadData.rejects(new Error('storage down'));
      try {
        await should(
          AvatarService.setAvatar('caver', caverId, await makeImage(50, 50))
        ).be.rejected();
      } finally {
        uploadData.resolves();
      }
      const caver = await TCaver.findOne({ id: caverId });
      should(caver.avatarPath).be.null();
    });

    it('stores an organization avatar with the extra values', async () => {
      const original = await TGrotto.findOne({ id: 1 });
      try {
        const avatarPath = await AvatarService.setAvatar(
          'organization',
          1,
          await makeImage(50, 50),
          { reviewer: 2 }
        );
        should(avatarPath).startWith('avatars/organizations/1-');
        const organization = await TGrotto.findOne({ id: 1 });
        should(organization.avatarPath).equal(avatarPath);
        should(organization.reviewer).equal(2);
      } finally {
        await TGrotto.updateOne({ id: 1 }).set({
          avatarPath: null,
          reviewer: original.reviewer,
        });
      }
    });

    it('clears the path and removes the image', async () => {
      const avatarPath = await AvatarService.setAvatar(
        'caver',
        caverId,
        await makeImage(50, 50)
      );
      should(await AvatarService.removeAvatar('caver', caverId)).be.true();
      should(deleteBlob.firstCall.args[0]).equal(avatarPath);
      const caver = await TCaver.findOne({ id: caverId });
      should(caver.avatarPath).be.null();
    });

    it('does nothing when there is no avatar to remove', async () => {
      should(await AvatarService.removeAvatar('caver', caverId)).be.false();
      should(deleteBlob.callCount).equal(0);
    });
  });

  describe('concurrent setAvatar / removeAvatar', () => {
    const caverId = 1;

    // Hold every upload until `count` of them are in progress, so the
    // concurrent calls all reach the database write together.
    const holdUploads = (count) => {
      let release;
      const released = new Promise((resolve) => {
        release = resolve;
      });
      uploadData.callsFake(async () => {
        if (uploadData.callCount >= count) release();
        await released;
      });
    };

    const uploadedPaths = () => uploadData.getCalls().map((c) => c.args[0]);
    const deletedPaths = () => deleteBlob.getCalls().map((c) => c.args[0]);

    afterEach(async () => {
      uploadData.resetBehavior();
      uploadData.resolves();
      await TCaver.updateOne({ id: caverId }).set({ avatarPath: null });
    });

    it('deletes every replaced image when two uploads overlap', async () => {
      holdUploads(2);
      const [first, second] = await Promise.all([
        AvatarService.setAvatar('caver', caverId, await makeImage(50, 50)),
        AvatarService.setAvatar('caver', caverId, await makeImage(60, 60)),
      ]);
      const caver = await TCaver.findOne({ id: caverId });
      should([first, second]).containEql(caver.avatarPath);
      // The image that lost the race is deleted, the one recorded is kept
      should(deletedPaths()).eql(
        [first, second].filter((p) => p !== caver.avatarPath)
      );

      should(await AvatarService.removeAvatar('caver', caverId)).be.true();
      should(deletedPaths().sort()).eql(uploadedPaths().sort());
      should((await TCaver.findOne({ id: caverId })).avatarPath).be.null();
    });

    it('leaves no image behind when an upload overlaps a removal', async () => {
      const initial = await AvatarService.setAvatar(
        'caver',
        caverId,
        await makeImage(50, 50)
      );
      const [, removed] = await Promise.all([
        AvatarService.setAvatar('caver', caverId, await makeImage(60, 60)),
        AvatarService.removeAvatar('caver', caverId),
      ]);
      should(removed).be.true();
      const caver = await TCaver.findOne({ id: caverId });
      const referenced = caver.avatarPath ? [caver.avatarPath] : [];
      // Every uploaded image is either still referenced or deleted, once
      should(deletedPaths().concat(referenced).sort()).eql(
        uploadedPaths().sort()
      );
      should(deletedPaths()).containEql(initial);
    });

    it('deletes the uploaded image when the record does not exist', async () => {
      await should(
        AvatarService.setAvatar('caver', 999999, await makeImage(50, 50))
      ).be.rejected();
      should(deletedPaths()).eql(uploadedPaths());
      should(uploadData.callCount).equal(1);
    });
  });

  describe('pending deletions', () => {
    const caverId = 1;

    const pendingPaths = async () =>
      (
        await CommonService.query(
          'SELECT blob_path FROM t_avatar_pending_deletion ORDER BY blob_path'
        )
      ).rows.map((r) => r.blob_path);

    const deletedPaths = () => deleteBlob.getCalls().map((c) => c.args[0]);

    afterEach(async () => {
      deleteBlob.resetBehavior();
      deleteBlob.resolves();
      uploadData.resetBehavior();
      uploadData.resolves();
      await TCaver.updateOne({ id: caverId }).set({ avatarPath: null });
      await CommonService.query('DELETE FROM t_avatar_pending_deletion');
    });

    it('records nothing once an image is replaced and deleted', async () => {
      await AvatarService.setAvatar('caver', caverId, await makeImage(50, 50));
      await AvatarService.setAvatar('caver', caverId, await makeImage(50, 50));
      await AvatarService.removeAvatar('caver', caverId);
      should(await pendingPaths()).be.empty();
    });

    it('retries a removal that failed in storage once it recovers', async () => {
      const avatarPath = await AvatarService.setAvatar(
        'caver',
        caverId,
        await makeImage(50, 50)
      );
      deleteBlob.rejects(new Error('storage down'));
      should(await AvatarService.removeAvatar('caver', caverId)).be.true();
      should((await TCaver.findOne({ id: caverId })).avatarPath).be.null();
      should(await pendingPaths()).eql([avatarPath]);
      const [{ attempts, last_error: lastError }] = (
        await CommonService.query(
          'SELECT attempts, last_error FROM t_avatar_pending_deletion'
        )
      ).rows;
      should(attempts).equal(1);
      should(lastError).equal('storage down');

      // Still down: the path stays recorded
      should(
        await AvatarService.retryPendingDeletions({ graceMs: 0 })
      ).containEql({ deleted: 0, failed: 1 });
      should(await pendingPaths()).eql([avatarPath]);

      deleteBlob.resetHistory();
      deleteBlob.resolves();
      should(
        await AvatarService.retryPendingDeletions({ graceMs: 0 })
      ).containEql({ deleted: 1, failed: 0 });
      should(deletedPaths()).eql([avatarPath]);
      should(await pendingPaths()).be.empty();
    });

    it('retries the deletion of a replaced image', async () => {
      const first = await AvatarService.setAvatar(
        'caver',
        caverId,
        await makeImage(50, 50)
      );
      deleteBlob.rejects(new Error('storage down'));
      const second = await AvatarService.setAvatar(
        'caver',
        caverId,
        await makeImage(50, 50)
      );
      should((await TCaver.findOne({ id: caverId })).avatarPath).equal(second);
      should(await pendingPaths()).eql([first]);

      deleteBlob.resetHistory();
      deleteBlob.resolves();
      await AvatarService.retryPendingDeletions({ graceMs: 0 });
      should(deletedPaths()).eql([first]);
      should(await pendingPaths()).be.empty();
    });

    it('retries the deletion of an upload the record could not take', async () => {
      deleteBlob.rejects(new Error('storage down'));
      await should(
        AvatarService.setAvatar('caver', 999999, await makeImage(50, 50))
      ).be.rejected();
      const [uploaded] = uploadData.lastCall.args;
      should(await pendingPaths()).eql([uploaded]);

      deleteBlob.resolves();
      await AvatarService.retryPendingDeletions({ graceMs: 0 });
      should(await pendingPaths()).be.empty();
    });

    it('leaves recent paths to the uploads that may still be running', async () => {
      await CommonService.query(
        "INSERT INTO t_avatar_pending_deletion (blob_path) VALUES ('avatars/cavers/1-recent.webp')"
      );
      should(await AvatarService.retryPendingDeletions()).containEql({
        deleted: 0,
        failed: 0,
      });
      should(deleteBlob.callCount).equal(0);
      should(await pendingPaths()).eql(['avatars/cavers/1-recent.webp']);
    });

    it('forgets a recorded path a record still references, without deleting it', async () => {
      const avatarPath = 'avatars/cavers/1-referenced.webp';
      await TCaver.updateOne({ id: caverId }).set({ avatarPath });
      await CommonService.query(
        'INSERT INTO t_avatar_pending_deletion (blob_path) VALUES ($1)',
        [avatarPath]
      );
      should(
        await AvatarService.retryPendingDeletions({ graceMs: 0 })
      ).containEql({ kept: 1 });
      should(deleteBlob.callCount).equal(0);
      should(await pendingPaths()).be.empty();
    });
  });

  describe('getUrl', () => {
    it('returns null without an avatar', () => {
      should(AvatarService.getUrl(null)).be.null();
    });

    it('returns the public URL of the image', () => {
      should(AvatarService.getUrl('avatars/cavers/1-ab.webp')).endWith(
        '/documents/avatars/cavers/1-ab.webp'
      );
    });
  });
});
