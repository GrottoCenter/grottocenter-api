const should = require('should');
const CommonService = require('../../../api/services/CommonService');

// Feature: db-query-performance-fixes
// Schema assertions for the query performance fixes migration

const NEW_INDEXES = [
  { table: 't_notification', name: 'idx_t_notification_notified' },
  { table: 't_comment', name: 'idx_t_comment_entrance' },
  { table: 't_comment', name: 'idx_t_comment_cave' },
];

describe('QueryPerformanceFixes - Schema assertions', () => {
  describe('New indexes exist', () => {
    NEW_INDEXES.forEach(({ table, name }) => {
      it(`should have index ${name} on ${table}`, async () => {
        const result = await CommonService.query(
          'SELECT indexname, tablename FROM pg_indexes WHERE indexname = $1',
          [name]
        );
        should(result.rows).have.length(
          1,
          `Expected index ${name} to exist on ${table}`
        );
        should(result.rows[0].tablename).equal(table);
      });
    });
  });

  describe('Comment indexes are non-partial', () => {
    it('should have non-partial idx_t_comment_entrance (no WHERE clause)', async () => {
      const result = await CommonService.query(
        `SELECT indexdef FROM pg_indexes
         WHERE indexname = 'idx_t_comment_entrance'`,
        []
      );
      should(result.rows).have.length(1);
      should(result.rows[0].indexdef.toLowerCase()).not.containEql('where');
    });

    it('should have non-partial idx_t_comment_cave (no WHERE clause)', async () => {
      const result = await CommonService.query(
        `SELECT indexdef FROM pg_indexes
         WHERE indexname = 'idx_t_comment_cave'`,
        []
      );
      should(result.rows).have.length(1);
      should(result.rows[0].indexdef.toLowerCase()).not.containEql('where');
    });
  });

  describe('t_last_change has primary key', () => {
    it('should have an id column on t_last_change', async () => {
      const result = await CommonService.query(
        `SELECT column_name, data_type FROM information_schema.columns
         WHERE table_name = 't_last_change' AND column_name = 'id'`,
        []
      );
      should(result.rows).have.length(1);
      should(result.rows[0].data_type).equal('integer');
    });

    it('should have a primary key constraint on t_last_change', async () => {
      const result = await CommonService.query(
        `SELECT constraint_name FROM information_schema.table_constraints
         WHERE table_name = 't_last_change' AND constraint_type = 'PRIMARY KEY'`,
        []
      );
      should(result.rows.length).be.greaterThan(0);
    });
  });
});
