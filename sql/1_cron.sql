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


SELECT cron.schedule_in_database(
    'Refresh info views every 3 days', -- every 3 days at 4h40
    '40 4 */3 * *',
    $$
        REFRESH MATERIALIZED VIEW CONCURRENTLY v_massif_info;
        REFRESH MATERIALIZED VIEW CONCURRENTLY v_country_info;
        REFRESH MATERIALIZED VIEW CONCURRENTLY v_region_info;
    $$,
    'grottoce'
);


-- To view all jobs: select * from cron.job;
-- To remove a job: SELECT cron.unschedule('Refresh data quality view daily');
