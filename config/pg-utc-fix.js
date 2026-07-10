/**
 * pg-utc-fix.js
 *
 * Force the pg driver to handle all timestamps in UTC. Without this, on
 * machines with a non-UTC timezone:
 * - Write side: dates are serialized using the local offset, storing e.g.
 *   20:00 (CEST) instead of 18:00 (UTC) in timestamp without time zone columns.
 * - Read side: values from timestamp without time zone columns are interpreted
 *   as local time, subtracting the offset and returning a Date 2h earlier.
 * Both cause mismatches with Postgres now() which always returns UTC.
 *
 * Production runs in UTC so this is a no-op there — it only corrects behavior
 * on developer machines with non-UTC system clocks.
 *
 * sails-postgresql delegates to machinepack-postgresql which bundles its own
 * pg instance (different version, not deduped). We must configure THAT instance
 * in addition to the top-level pg.
 */

const pg = require('pg');

// machinepack-postgresql bundles pg@8.11 internally (not deduped with our
// top-level pg@8.x). We must patch it separately.
// eslint-disable-next-line import/no-extraneous-dependencies
const mpPg = require('machinepack-postgresql/node_modules/pg');

[pg, mpPg].forEach((driver) => {
  // eslint-disable-next-line no-param-reassign
  driver.defaults.parseInputDatesAsUTC = true;
  driver.types.setTypeParser(1114, (str) => new Date(`${str}Z`));
});
