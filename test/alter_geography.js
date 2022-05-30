const ALTER_GEOGRAPHY_QUERY = `
ALTER TABLE public.t_massif ALTER COLUMN geog_polygon TYPE geography USING geog_polygon::geography;
`;

module.exports = ALTER_GEOGRAPHY_QUERY;
