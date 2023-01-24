#!/bin/bash
# This script will refresh the dashboard views 
# in the database

# Refresh once a week, at 04:00 on Sunday
# Usage : 0 4 * * 0 bash ./refresh_views_procedure.sh

# Constants
DATABASE="grottoce"

# Refresh views
psql $DATABASE <<END
    REFRESH MATERIALIZED VIEW CONCURRENTLY v_massif_info;
END