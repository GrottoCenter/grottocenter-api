const should = require('should');
const fs = require('fs');
const path = require('path');
const FileService = require('../../../api/services/FileService');

describe('FileService', () => {
  describe('document.getUrl()', () => {
    it('should return document URL', () => {
      const url = FileService.document.getUrl('test.pdf');
      should(url).be.a.String();
      should(url).containEql('local-uploads/documents');
      should(url).containEql('test.pdf');
    });
  });

  describe('document.create()', () => {
    it('should throw error for invalid file name', async () => {
      const file = {
        originalname: 'invalidname',
        buffer: Buffer.from('test'),
        size: 100,
      };
      try {
        await FileService.document.create(file, 1);
        should.fail('Should have thrown error');
      } catch (err) {
        should(err.message).equal(FileService.INVALID_NAME);
        should(err.fileName).equal('invalidname');
      }
    });

    it('should throw error for invalid file format', async () => {
      const file = {
        originalname: 'test.xyz',
        buffer: Buffer.from('test'),
        size: 100,
      };
      try {
        await FileService.document.create(file, 1);
        should.fail('Should have thrown error');
      } catch (err) {
        should(err.message).equal(FileService.INVALID_FORMAT);
        should(err.fileName).equal('test.xyz');
      }
    });

    it('should create file without credentials', async () => {
      const file = {
        originalname: 'test.pdf',
        buffer: Buffer.from('test'),
        size: 100,
      };
      await FileService.document.create(file, 1);
      const createdFile = await TFile.find({ document: 1 })
        .sort('id DESC')
        .limit(1);
      should(createdFile.length).equal(1);
      should(createdFile[0].fileName).equal('test.pdf');
      await TFile.destroyOne(createdFile[0].id);
    });

    it('should create file with fetchResult', async () => {
      const file = {
        originalname: 'test2.pdf',
        buffer: Buffer.from('test'),
        size: 100,
      };
      const result = await FileService.document.create(file, 1, true);
      should(result).be.an.Object();
      should(result.fileName).equal('test2.pdf');
      await TFile.destroyOne(result.id);
    });

    it('should create file with isValidated false', async () => {
      const file = {
        originalname: 'test3.pdf',
        buffer: Buffer.from('test'),
        size: 100,
      };
      const result = await FileService.document.create(file, 1, true, false);
      should(result).be.an.Object();
      should(result.isValidated).equal(false);
      await TFile.destroyOne(result.id);
    });
  });

  describe('document.delete()', () => {
    it('should delete file', async () => {
      const file = {
        originalname: 'todelete.pdf',
        buffer: Buffer.from('test'),
        size: 100,
      };
      const created = await FileService.document.create(file, 1, true);
      const deleted = await FileService.document.delete(created);
      should(deleted).be.an.Object();
      should(deleted.id).equal(created.id);
    });
  });

  describe('update()', () => {
    let initialFile = {
      id: 1,
      name: '',
    };
    before(async () => {
      initialFile = await TFile.findOne(initialFile.id);
    });
    after(async () => {
      await TFile.updateOne(initialFile.id).set({ name: initialFile.name });
    });

    it('should update the file name', async () => {
      const newName = 'new_file_name';
      const res = await FileService.document.update({
        ...initialFile,
        fileName: newName,
      });
      should(res.fileName).equal(newName);
    });
  });

  describe('dbExport.getUrl()', () => {
    it('should return a local URL for the file', () => {
      const url = FileService.dbExport.getUrl('test.zip', 3600000);
      should(url).be.a.String();
      should(url).containEql('local-uploads/db-exports/test.zip');
    });
  });

  describe('dbExport.getMetadata()', () => {
    it('should return null when metadata file does not exist', async () => {
      // Remove any leftover metadata from prior tests
      const metadataPath = path.resolve(
        __dirname,
        '../../../.local-uploads/db-exports/exportMetadata.json'
      );
      if (fs.existsSync(metadataPath)) fs.unlinkSync(metadataPath);

      const metadata = await FileService.dbExport.getMetadata();
      should(metadata).be.null();
    });
  });

  describe('dbExport.setMetadata()', () => {
    it('should write metadata locally and return null', async () => {
      const result = await FileService.dbExport.setMetadata(1024);
      should(result).be.null();
    });
  });

  describe('dbExport.upload()', () => {
    it('should return a writable stream for local storage', () => {
      const uploadStream = FileService.dbExport.upload(
        'test.zip',
        'application/zip'
      );
      should(uploadStream).not.be.null();
      should(uploadStream.writable).be.true();
      // Clean up: end the stream without writing anything
      uploadStream.end();
    });
  });

  describe('document.create() with spaces in filename', () => {
    it('should handle file names with spaces', async () => {
      const file = {
        originalname: 'test file.pdf',
        buffer: Buffer.from('test'),
        size: 100,
      };
      const result = await FileService.document.create(file, 1, true);
      should(result).be.an.Object();
      should(result.fileName).equal('test file.pdf');
      should(result.path).containEql('_');
      await TFile.destroyOne(result.id);
    });
  });

  describe('document.create() with multiple dots in filename', () => {
    it('should accept file name with multiple dots and use last extension', async () => {
      const file = {
        originalname: 'test.file.pdf',
        buffer: Buffer.from('test'),
        size: 100,
      };
      // Should not throw — extension is 'pdf' (last segment after last dot)
      await FileService.document.create(file, 1);
    });
  });

  describe('document.create() with no extension', () => {
    it('should throw error for file name without extension', async () => {
      const file = {
        originalname: 'testfile',
        buffer: Buffer.from('test'),
        size: 100,
      };
      try {
        await FileService.document.create(file, 1);
        should.fail('Should have thrown error');
      } catch (err) {
        should(err.message).equal(FileService.INVALID_NAME);
      }
    });
  });
});
