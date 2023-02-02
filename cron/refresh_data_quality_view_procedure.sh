#!/bin/bash
# This script will refresh the data quality view
# in the database

# Refresh once a day, at 04:00 on every day-of-week from Sunday through Saturday.
# Usage : 0 4 * * 0-6 bash ./refresh_data_quality_view_procedure.sh

# Constants
DATABASE="grottoce"

# Refresh view
psql $DATABASE <<END
    REFRESH MATERIALIZED VIEW CONCURRENTLY v_data_quality_compute_entrance;
END