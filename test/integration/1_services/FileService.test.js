const should = require('should');
const FileService = require('../../../api/services/FileService');

describe('FileService', () => {
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
});
