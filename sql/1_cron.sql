\c postgres;
CREATE EXTENSION pg_cron;

SELECT cron.schedule_in_database(
    'Refresh data quality view daily',
    '20 4 * * *', -- every day at 4h20
    $$
        REFRESH MATERIALIZED VIEW CONCURRENTLY v_data_quality_compute_entrance;
    $$,
    'grottoce'
);


-- Three separate jobs so that a failure in one view never rolls back or blocks the others.
SELECT cron.schedule_in_database(
    'Refresh massif info view every 3 days',
    '40 4 */3 * *', -- every 3 days at 4h40
    $$
        REFRESH MATERIALIZED VIEW CONCURRENTLY v_massif_info;
    $$,
    'grottoce'
);

SELECT cron.schedule_in_database(
    'Refresh country info view every 3 days',
    '45 4 */3 * *', -- every 3 days at 4h45 (staggered 5 min after massif)
    $$
        REFRESH MATERIALIZED VIEW CONCURRENTLY v_country_info;
    $$,
    'grottoce'
);

SELECT cron.schedule_in_database(
    'Refresh region info view every 3 days',
    '50 4 */3 * *', -- every 3 days at 4h50 (staggered 10 min after massif)
    $$
        REFRESH MATERIALIZED VIEW CONCURRENTLY v_region_info;
    $$,
    'grottoce'
);


-- To view all jobs: select * from cron.job;
-- To remove a job: SELECT cron.unschedule('Refresh massif info view every 3 days');
