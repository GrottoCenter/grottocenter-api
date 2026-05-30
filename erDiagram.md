# ERD Documentation — Scientific Observations (Issue 1562)

This document describes the entity-relationship diagram for the scientific observation system. It enables researchers to record geolocated observation points, attach various types of scientific data (measurements, contamination records, human activity records), and link them to supporting metadata.

## t_point

A geographic location where observations are made. Can be inside a cave or in any outdoor location (river, surface, etc.). Repurposed from the legacy geology survey point table (which was empty in all environments).

| Field | Purpose |
|-------|---------|
| id | Primary key, auto-increment |
| id_author | Caver who created this record (required) |
| id_reviewer | Caver who last modified this record |
| date_inscription | When the record was created in the system |
| date_reviewed | When the record was last modified |
| label | Short identifier/name for the point (required) |
| point_geom | PostGIS geometry point (SRID 4326) for spatial queries |
| latitude | WGS84 latitude, high precision (24,20) — nullable for underground points without GPS |
| longitude | WGS84 longitude, high precision (24,20) — nullable for underground points without GPS |
| id_cave | Optional reference to a cave — NULL if the point is not inside a cave |
| is_deleted | Soft-delete flag |

**Constraints:** None specific beyond required fields.

## t_observation

A scientific observation event at a specific point and time. Groups all data collected during a single field visit or monitoring session.

| Field | Purpose |
|-------|---------|
| id | Primary key, auto-increment |
| id_author | Caver who created this record (required) |
| id_reviewer | Caver who last modified this record |
| date_inscription | When the record was created in the system |
| date_reviewed | When the record was last modified |
| observation_date | When the observation was actually made in the field (required) |
| id_point | The geographic point where this observation took place (nullable — set when location is precise) |
| id_cave | The cave this observation relates to (nullable — set when observation is cave-wide, e.g., contamination of a large body of water) |
| id_observation_type | Category of observation: pollution, physical measurements, biospeleological, or human activities (required) |
| observation_type_code | Denormalized from t_observation_type.code for BI (required) |
| point_label | Denormalized from t_point.label for BI (nullable) |
| latitude | Denormalized from t_point.latitude for BI geo charts (nullable) |
| longitude | Denormalized from t_point.longitude for BI geo charts (nullable) |
| is_deleted | Soft-delete flag |

**Constraint:** At least one of `id_point` or `id_cave` must be set (enforced at DB level via CHECK).

**Relationships:** An observation can have names, descriptions, documents, time series, human activities, and contamination records.

## t_observation_type

Lookup table categorizing observations. Linked to standard ontologies.

| Field | Purpose |
|-------|---------|
| id | Primary key |
| code | Stable i18n key for front-end localization (e.g., "pollution", "physical_measurements") |
| url | URI linking to the relevant ontology definition |

**Seed values:**
1. pollution — `https://ontology.uis-speleo.org/ontology/#pollution`
2. physical_measurements — `http://www.w3.org/ns/sosa/Observation`
3. biospeleological_observation — `https://dwc.tdwg.org/list/#dwc_Occurrence`
4. human_activities — `https://ontology.uis-speleo.org/ontology/#humanActivities`

## t_name

Shared multilingual naming table. A single entity (point or observation) can have multiple names in different languages, with one marked as the main name.

| Field | Purpose |
|-------|---------|
| id | Primary key, auto-increment |
| name | The name text (max 200 chars) |
| is_main | Whether this is the primary/display name for the entity |
| id_author | Caver who created this name (required) |
| id_reviewer | Caver who last modified this name |
| date_inscription | When the name was created |
| date_reviewed | When the name was last modified |
| id_language | Language of this name |
| id_observation | Observation this name belongs to (nullable, polymorphic FK) |
| id_method | Method this name belongs to (nullable, polymorphic FK) |
| is_deleted | Soft-delete flag |

## t_description

Free-text descriptions attached to observations. Supports multilingual content with relevance ranking.

| Field | Purpose |
|-------|---------|
| id | Primary key, auto-increment |
| id_author | Caver who wrote this description (required) |
| id_reviewer | Caver who last modified this description |
| date_inscription | When the description was created (defaults to now) |
| date_reviewed | When the description was last modified |
| relevance | Numeric ranking for ordering multiple descriptions (default 0) |
| title | Short title for the description (required, max 300 chars) |
| body | Full description text |
| id_language | Language of this description (required, ISO 639-2 3-char code) |
| id_observation | The observation this description belongs to (nullable, polymorphic FK) |
| id_point | The point this description belongs to (nullable, polymorphic FK) |
| id_method | The method this description belongs to (nullable, polymorphic FK) |
| is_deleted | Soft-delete flag |

## t_time_series

A sequence of measurements from a single sensor measuring one quantity kind over a time period. Acts as a grouping layer above individual measurements to enable efficient querying of large datasets.

| Field | Purpose |
|-------|---------|
| id | Primary key, auto-increment |
| id_author | Caver who created this record (required) |
| id_reviewer | Caver who last modified this record |
| date_inscription | When the record was created in the system |
| date_reviewed | When the record was last modified |
| id_observation | The observation this time series belongs to (required) |
| id_sensor_configuration | The sensor configuration that produced the data (required) — determines unit, precision, and detection limits |
| id_medium | The environmental medium being measured (water, air, soil, etc.) — optional |
| id_method | Sampling method/protocol used (optional) |
| sampling_interval_seconds | Expected time between readings (NULL for irregular sampling) |
| start_date | Timestamp of the first measurement in this series (indexed for BI) |
| end_date | Timestamp of the last measurement in this series (indexed for BI) |
| measurement_count | Number of measurements in this series |
| min_value | Minimum recorded value (for quick filtering without scanning measurements) |
| max_value | Maximum recorded value (for quick filtering without scanning measurements) |
| data_quality | Validation status: raw, validated, suspect, rejected (default: raw, CHECK constraint) |
| quantity_kind_code | Denormalized from t_sensor_configuration → t_quantity_kind.code for BI (required) |
| unit_symbol | Denormalized from t_sensor_configuration → t_unit.symbol for BI (required) |
| medium_code | Denormalized from t_medium.code for BI (nullable) |
| timezone_offset | Original timezone of the data logger (e.g., "Europe/Paris", "+02:00") for display purposes — timestamps are stored as UTC (nullable) |
| is_deleted | Soft-delete flag |

## t_measurement

Individual data points within a time series. This table can grow very large (millions of rows for long-running data loggers). **Partitioned by timestamp** (quarterly ranges) for efficient time-range queries.

| Field | Purpose |
|-------|---------|
| id | Primary key (composite with timestamp for partitioning), auto-increment |
| id_time_series | The time series this measurement belongs to (required) |
| value | The measured numeric value in the device's configured unit (determined by t_time_series → t_sensor_configuration → t_unit) (required) |
| value_si | The measured value converted to SI units for cross-sensor comparison (required — same as value when sensor already uses SI) |
| timestamp | When this specific reading was taken (required, timestamptz — always stored as UTC) |

**Partitioning:** `PARTITION BY RANGE (timestamp)` with quarterly partitions.

## t_device

Represents a physical measurement device (e.g., a multi-parameter data logger). A single device can measure multiple quantities — each measurement channel is represented as a separate `t_sensor_configuration` record.

| Field | Purpose |
|-------|---------|
| id | Primary key, auto-increment |
| name | Instrument name (e.g., "Tinytag TGP-4500") (required) |
| brand_name | Manufacturer/brand name (e.g., "Gemini Data Loggers") |
| product_url | Link to the specific product page |
| manufacturer_url | Link to the manufacturer's website |

## t_sensor_configuration

Per-channel configuration of a device. Each record represents one measurement channel (quantity kind) with its unit and precision settings. The same device can have multiple configurations for different quantities it measures.

| Field | Purpose |
|-------|---------|
| id | Primary key, auto-increment |
| id_device | The physical device this configuration belongs to (required) |
| id_quantity_kind | What physical quantity this channel measures — aligned with QUDT ontology (required) |
| id_unit | Unit of measurement for this configuration's readings (required) |
| precision_upper | Upper precision bound — maximum positive deviation from the true value |
| precision_lower | Lower precision bound — maximum negative deviation from the true value |
| resolution | Smallest change the sensor can detect/report in this configuration |
| detection_limit_min | Lower detection limit — readings below this value are unreliable |
| detection_limit_max | Upper detection limit — readings above this value are unreliable / sensor saturated |

## t_quantity_kind

Lookup table defining what physical quantity is being measured. Aligned with the [QUDT Quantity Kinds vocabulary](https://www.qudt.org/doc/2024/03/DOC_VOCAB-QUANTITY-KINDS-ALL-v2.1.html).

| Field | Purpose |
|-------|---------|
| id | Primary key |
| code | Stable i18n key for front-end localization (e.g., "Temperature", "RelativeHumidity") |
| url | QUDT URI (e.g., `http://qudt.org/vocab/quantitykind/Temperature`) |
| symbol_si | SI unit symbol for this quantity kind (e.g., "K" for Temperature, "m" for Length, "Pa" for Pressure) |

## t_unit

Lookup table for units of measurement.

| Field | Purpose |
|-------|---------|
| id | Primary key |
| code | Stable i18n key for front-end localization (e.g., "degree_celsius") |
| symbol | Unit symbol (e.g., "°C", "ppm", "%") |

## t_method

Lookup table for sampling methods/protocols. Names are managed via `t_name` (multilingual). Must have at least one name.

| Field | Purpose |
|-------|---------|
| id | Primary key |
| url | URI linking to a standard method definition |

## t_medium

Lookup table for environmental media in which measurements or contamination are observed.

| Field | Purpose |
|-------|---------|
| id | Primary key |
| code | Stable i18n key for front-end localization (e.g., "water", "air", "soil", "sediment") |
| url | URI linking to an ontology definition |

## t_human_activity

Records of human activities observed at a point. Each record is tied to a specific observation.

| Field | Purpose |
|-------|---------|
| id | Primary key, auto-increment |
| id_author | Caver who created this record (required) |
| id_reviewer | Caver who last modified this record |
| date_inscription | When the record was created |
| date_reviewed | When the record was last modified |
| id_observation | The observation this activity belongs to (required) |
| id_human_activity_type | Type of human activity observed (required) |
| is_deleted | Soft-delete flag |

## t_human_activity_type

Lookup table for types of human activities. Aligned with the UIS speleology ontology.

| Field | Purpose |
|-------|---------|
| id | Primary key |
| code | Stable i18n key for front-end localization (e.g., "guided_tourist_cave", "mine") |
| url | UIS ontology URI |

**Seed values:** 17 types including guided tourist cave, waste disposal, road drain, storage, habitation, livestock shelter, food source, water source, guano mining, mine, human burial site, sacred site, temple, place of a legend, scientific activity, place of manufacture, traffic way.

## t_contamination

Records of contamination observed at a point, specifying what contaminant was found and in which medium.

| Field | Purpose |
|-------|---------|
| id | Primary key, auto-increment |
| id_author | Caver who created this record (required) |
| id_reviewer | Caver who last modified this record |
| date_inscription | When the record was created |
| date_reviewed | When the record was last modified |
| id_observation | The observation this contamination belongs to (required) |
| id_contaminant_type | What type of contaminant was found (required) |
| id_medium | In which medium the contamination was observed — water, air, soil, etc. (required) |
| medium_code | Denormalized from t_medium.code for BI (required) |
| is_deleted | Soft-delete flag |

## t_contaminant_type

Lookup table for types of contaminants.

| Field | Purpose |
|-------|---------|
| id | Primary key |
| code | Stable i18n key for front-end localization |
| url | URI linking to an ontology definition |

## t_time_series_quality_log

Audit trail for data quality transitions. Logs every change to `t_time_series.data_quality`, enabling dashboards showing validation progress.

| Field | Purpose |
|-------|---------|
| id | Primary key, auto-increment |
| id_time_series | The time series whose quality changed (required) |
| old_quality | Previous quality value (nullable — NULL for initial assignment) |
| new_quality | New quality value (required) |
| changed_by | Caver who made the change (required) |
| changed_at | When the change occurred (timestamptz, defaults to now) |
