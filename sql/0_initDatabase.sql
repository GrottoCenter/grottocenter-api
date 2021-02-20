DROP DATABASE IF EXISTS grottoce;
CREATE DATABASE grottoce ENCODING utf8 LC_COLLATE "en_US.utf8";
-- Add Postgis for massif and for later
CREATE EXTENSION postgis;
\c grottoce;
