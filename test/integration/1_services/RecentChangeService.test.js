const should = require('should');
const sinon = require('sinon');
const RecentChangeService = require('../../../api/services/RecentChangeService');
const CommonService = require('../../../api/services/CommonService');

describe('RecentChangeService', () => {
  describe('getRecent()', () => {
    let stub;

    afterEach(() => {
      if (stub) {
        stub.restore();
        stub = null;
      }
    });

    it('should get recent changes', async () => {
      const changes = await RecentChangeService.getRecent();
      should(changes).be.an.Array();
    });

    it('should group changes by author and entity', async () => {
      const mockChanges = [
        {
          date_change: new Date('2024-01-01T12:00:00'),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'entrance',
          id_entity: 1,
          type_change: 'create',
          name: 'Entrance 1',
        },
        {
          date_change: new Date('2024-01-01T12:05:00'),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'entrance',
          id_entity: 1,
          type_change: 'update',
          name: 'Entrance 1',
        },
      ];
      stub = sinon.stub(CommonService, 'query').resolves({ rows: mockChanges });
      const changes = await RecentChangeService.getRecent();
      should(changes).be.an.Array();
      should(changes.length).equal(1);
      should(changes[0].mainAction).equal('create');
    });

    it('should not group delete changes', async () => {
      const mockChanges = [
        {
          date_change: new Date('2024-01-01T12:00:00'),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'entrance',
          id_entity: 1,
          type_change: 'delete',
          name: 'Entrance 1',
        },
        {
          date_change: new Date('2024-01-01T12:05:00'),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'entrance',
          id_entity: 1,
          type_change: 'update',
          name: 'Entrance 1',
        },
      ];
      stub = sinon.stub(CommonService, 'query').resolves({ rows: mockChanges });
      const changes = await RecentChangeService.getRecent();
      should(changes).be.an.Array();
      should(changes.length).equal(2);
    });

    it('should filter out duplicate cave changes after entrance', async () => {
      const baseTime = new Date('2024-01-01T12:00:00').getTime();
      const mockChanges = [
        {
          date_change: new Date(baseTime),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'cave',
          id_entity: 1,
          type_change: 'create',
          name: 'Cave 1',
        },
        {
          date_change: new Date(baseTime + 1000),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'entrance',
          id_entity: 1,
          type_change: 'create',
          name: 'Entrance 1',
        },
        {
          date_change: new Date(baseTime + 2000),
          id_author: 2,
          nickname: 'user2',
          type_entity: 'entrance',
          id_entity: 2,
          type_change: 'create',
          name: 'Entrance 2',
        },
      ];
      stub = sinon.stub(CommonService, 'query').resolves({ rows: mockChanges });
      const changes = await RecentChangeService.getRecent();
      should(changes).be.an.Array();
      should(changes.length).equal(2);
      should(changes.find((c) => c.mainEntityType === 'cave')).be.undefined();
    });

    it('should filter out duplicate cave changes before entrance', async () => {
      const mockChanges = [
        {
          date_change: new Date('2024-01-01T12:00:01'),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'entrance',
          id_entity: 1,
          type_change: 'create',
          name: 'Entrance 1',
        },
        {
          date_change: new Date('2024-01-01T12:00:00'),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'cave',
          id_entity: 1,
          type_change: 'create',
          name: 'Cave 1',
        },
      ];
      stub = sinon.stub(CommonService, 'query').resolves({ rows: mockChanges });
      const changes = await RecentChangeService.getRecent();
      should(changes).be.an.Array();
      should(changes.length).equal(1);
      should(changes[0].mainEntityType).equal('entrance');
    });

    it('should keep cave changes when not near entrance changes', async () => {
      const mockChanges = [
        {
          date_change: new Date('2024-01-01T12:00:00'),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'cave',
          id_entity: 1,
          type_change: 'create',
          name: 'Cave 1',
        },
      ];
      stub = sinon.stub(CommonService, 'query').resolves({ rows: mockChanges });
      const changes = await RecentChangeService.getRecent();
      should(changes).be.an.Array();
      should(changes.length).equal(1);
      should(changes[0].mainEntityType).equal('cave');
    });

    it('should handle changes with related entities', async () => {
      const mockChanges = [
        {
          date_change: new Date('2024-01-01T12:00:00'),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'description',
          id_entity: 1,
          type_change: 'create',
          type_related_entity: 'entrance',
          id_related_entity: 1,
          name: 'Entrance 1',
        },
      ];
      stub = sinon.stub(CommonService, 'query').resolves({ rows: mockChanges });
      const changes = await RecentChangeService.getRecent();
      should(changes).be.an.Array();
      should(changes.length).equal(1);
      should(changes[0].mainEntityType).equal('entrance');
      should(changes[0].subEntityTypes).containEql('description');
    });

    it('should not group changes beyond time threshold', async () => {
      const mockChanges = [
        {
          date_change: new Date('2024-01-01T12:00:00'),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'entrance',
          id_entity: 1,
          type_change: 'update',
          name: 'Entrance 1',
        },
        {
          date_change: new Date('2024-01-01T20:00:00'),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'entrance',
          id_entity: 1,
          type_change: 'update',
          name: 'Entrance 1',
        },
      ];
      stub = sinon.stub(CommonService, 'query').resolves({ rows: mockChanges });
      const changes = await RecentChangeService.getRecent();
      should(changes).be.an.Array();
      should(changes.length).equal(2);
    });

    it('should handle restore action priority', async () => {
      const mockChanges = [
        {
          date_change: new Date('2024-01-01T12:00:00'),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'entrance',
          id_entity: 1,
          type_change: 'restore',
          name: 'Entrance 1',
        },
        {
          date_change: new Date('2024-01-01T12:05:00'),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'entrance',
          id_entity: 1,
          type_change: 'update',
          name: 'Entrance 1',
        },
      ];
      stub = sinon.stub(CommonService, 'query').resolves({ rows: mockChanges });
      const changes = await RecentChangeService.getRecent();
      should(changes).be.an.Array();
      should(changes.length).equal(1);
      should(changes[0].mainAction).equal('restore');
    });

    it('should handle multiple sub entity types', async () => {
      const mockChanges = [
        {
          date_change: new Date('2024-01-01T12:00:00'),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'description',
          id_entity: 1,
          type_change: 'create',
          type_related_entity: 'entrance',
          id_related_entity: 1,
          name: 'Entrance 1',
        },
        {
          date_change: new Date('2024-01-01T12:05:00'),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'location',
          id_entity: 1,
          type_change: 'update',
          type_related_entity: 'entrance',
          id_related_entity: 1,
          name: 'Entrance 1',
        },
      ];
      stub = sinon.stub(CommonService, 'query').resolves({ rows: mockChanges });
      const changes = await RecentChangeService.getRecent();
      should(changes).be.an.Array();
      should(changes.length).equal(1);
      should(changes[0].subEntityTypes).containEql('description');
      should(changes[0].subEntityTypes).containEql('location');
    });

    it('should set subAction to change when different actions', async () => {
      const mockChanges = [
        {
          date_change: new Date('2024-01-01T12:00:00'),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'description',
          id_entity: 1,
          type_change: 'create',
          type_related_entity: 'entrance',
          id_related_entity: 1,
          name: 'Entrance 1',
        },
        {
          date_change: new Date('2024-01-01T12:05:00'),
          id_author: 1,
          nickname: 'user1',
          type_entity: 'description',
          id_entity: 2,
          type_change: 'update',
          type_related_entity: 'entrance',
          id_related_entity: 1,
          name: 'Entrance 1',
        },
      ];
      stub = sinon.stub(CommonService, 'query').resolves({ rows: mockChanges });
      const changes = await RecentChangeService.getRecent();
      should(changes).be.an.Array();
      should(changes.length).equal(1);
      should(changes[0].subAction).equal('change');
    });
  });

  describe('setNameCreate()', () => {
    it('should update name for created entity', async () => {
      await RecentChangeService.setNameCreate('cave', 1, 1, 'Test Cave');
    });
  });

  describe('setDeleteRestoreAuthor()', () => {
    it('should update author for delete action', async () => {
      await RecentChangeService.setDeleteRestoreAuthor('delete', 'cave', 1, 1);
    });

    it('should update author for restore action', async () => {
      await RecentChangeService.setDeleteRestoreAuthor('restore', 'cave', 1, 1);
    });
  });
});
