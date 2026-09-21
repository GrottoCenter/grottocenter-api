// Mean Earth radius (IUGG arithmetic mean), in kilometres.
const EARTH_RADIUS_KM = 6371.0088;

const toRad = (degrees) => (degrees * Math.PI) / 180;

/**
 * Compute the surface area, in km², of the bounding box that
 * `ST_MakeEnvelope(sw_lng, sw_lat, ne_lng, ne_lat, 4326)` builds from the same
 * four values.
 *
 * Exact on a sphere: integrating R²·cos(φ) over the box gives
 * R²·Δλ·(sin(φ₂) − sin(φ₁)). Compared against PostGIS
 * `ST_Area(...::geography)` the deviation from the WGS84 ellipsoid is under
 * 0.5%, which is immaterial for a policy threshold. Sanity check: the whole
 * world yields exactly 4πR².
 *
 * Two deliberate choices, both of which make this match what the SQL actually
 * scans rather than what a "nice" geographic helper would return:
 *
 * 1. The deltas are absolute, NOT wrap-aware. `ST_MakeEnvelope` normalises its
 *    inputs to min/max, so inverted longitudes describe the *complement* of the
 *    intended strip, not a box crossing the antimeridian. Verified on PostGIS
 *    3.4.3: `ST_MakeEnvelope(170,-10,-170,10,4326)` is
 *    `POLYGON((170 -10,170 10,-170 10,-170 -10,170 -10))`, and `ST_Within`
 *    accepts `POINT(0 0)` while rejecting `POINT(175 0)` — 340° wide, ~83.6M
 *    km². Treating that as a 20° strip would understate the most expensive
 *    requests we have by a factor of 17.
 *
 * 2. It is computed here rather than by PostGIS. A `::geography` cast measures
 *    geodesic edges, which take the short way round and so disagree with the
 *    planar `ST_Within` predicate for the case above; worse, it raises
 *    "Antipodal (180 degrees long) edge detected!" for whole-world bounds,
 *    precisely the input a size check exists to reject.
 *
 * @param {{lat: number|string, lng: number|string}} southWestBound
 * @param {{lat: number|string, lng: number|string}} northEastBound
 * @returns {number} area in km², or NaN if any coordinate is not a finite
 *   number (query parameters reach us as strings, and are coerced here)
 */
const computeBoundingBoxAreaKm2 = (southWestBound, northEastBound) => {
  const swLat = Number(southWestBound.lat);
  const swLng = Number(southWestBound.lng);
  const neLat = Number(northEastBound.lat);
  const neLng = Number(northEastBound.lng);

  if (![swLat, swLng, neLat, neLng].every(Number.isFinite)) return NaN;

  const dLngRad = Math.abs(toRad(neLng - swLng));

  // sin(φ₂) − sin(φ₁) rewritten as 2·sin((φ₂−φ₁)/2)·cos((φ₂+φ₁)/2): the same
  // value at the same cost, but the subtraction form cancels catastrophically
  // for thin boxes near a pole, where both sines approach 1.
  const dSinLat = Math.abs(
    2 * Math.sin(toRad(neLat - swLat) / 2) * Math.cos(toRad(neLat + swLat) / 2)
  );

  return EARTH_RADIUS_KM * EARTH_RADIUS_KM * dLngRad * dSinLat;
};

module.exports = computeBoundingBoxAreaKm2;
