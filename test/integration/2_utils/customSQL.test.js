const should = require('should');
const { forTestDatabase } = require('../../customSQL');

const MIGRATION = [
  '\\c grottoce;',
  '',
  'CREATE TABLE IF NOT EXISTS t_x (id int);',
  'ALTER TABLE t_x OWNER TO gc_owner;',
  'CREATE OR REPLACE FUNCTION f() RETURNS void LANGUAGE sql AS $$ SELECT 1 $$;',
  'ALTER FUNCTION f() OWNER TO gc_owner;',
  '-- Runs as the job owner',
  '\\c postgres;',
  '',
  "SELECT cron.alter_job(1, command := 'SELECT 1');",
  '',
].join('\n');

const EXPECTED = [
  '',
  'CREATE TABLE IF NOT EXISTS t_x (id int);',
  'CREATE OR REPLACE FUNCTION f() RETURNS void LANGUAGE sql AS $$ SELECT 1 $$;',
  '-- Runs as the job owner',
  '',
].join('\n');

describe('customSQL', () => {
  describe('forTestDatabase()', () => {
    it('drops the database switches and the ownership, and stops at the cron section', () => {
      should(forTestDatabase(MIGRATION)).equal(EXPECTED);
    });

    it('reads a CRLF checkout the same way', () => {
      should(forTestDatabase(MIGRATION.replace(/\n/g, '\r\n'))).equal(EXPECTED);
    });
  });
});
