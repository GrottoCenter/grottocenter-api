const should = require('should');
const sinon = require('sinon');
const DeviceService = require('../../../api/services/DeviceService');
const SearchService = require('../../../api/services/SearchService');

describe('DeviceService', () => {
  describe('getPopulatedDevice()', () => {
    it('should return a populated device object for an existing ID', async () => {
      const device = await DeviceService.getPopulatedDevice(1);

      should(device).not.be.null();
      should(device).have.property('id', 1);
      should(device).have.property('name');
      should(device).have.property('author');
      should(device.author).be.an.Object();
      should(device.author).have.property('id');
      should(device).have.property('reviewer');
      should(device.reviewer).be.an.Object();
      should(device.reviewer).have.property('id');
      should(device).have.property('configurations');
      should(device.configurations).be.an.Array();
    });

    it('should return null for a non-existent device ID', async () => {
      const device = await DeviceService.getPopulatedDevice(99999);

      should(device).be.null();
    });
  });

  describe('updateInSearch()', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should re-index the device from the database by id', async () => {
      const syncStub = sinon.stub(SearchService, 'syncDocuments').resolves();

      await DeviceService.updateInSearch({ id: 1 });

      should(syncStub.calledOnceWithExactly('devices', [1])).be.true();
    });

    it('should accept a bare id', async () => {
      const syncStub = sinon.stub(SearchService, 'syncDocuments').resolves();

      await DeviceService.updateInSearch(7);

      should(syncStub.calledOnceWithExactly('devices', [7])).be.true();
    });
  });
});
