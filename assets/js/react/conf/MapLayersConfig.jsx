import * as L from 'leaflet';

/*
This files is used to config all the map layers offered.

Concerning the bounds of a layer,
they represent the area on the map for which the layer is available.

If the layer is available for the entire map, we should set its bounds to
" new L.LatLngBounds(new L.LatLng(-90, -200), new L.LatLng(90, 200)) "
 */

export const layers = [
  {
    name: 'OpenStreetMap Basic',
    attribution: 'http://osm.org/copyright',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    bounds: new L.LatLngBounds(new L.LatLng(-90, -200), new L.LatLng(90, 200)),
  },
  {
    name: 'Fond de carte Russie',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    bounds: new L.LatLngBounds(new L.LatLng(70, 70), new L.LatLng(80, 118)),
  },
  {
    name: 'Satellite',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    bounds: new L.LatLngBounds(new L.LatLng(50, -10), new L.LatLng(60, 2)),
  },
  {
    name: 'Fond de carte Amérique latine',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    bounds: new L.LatLngBounds(new L.LatLng(-37, -75), new L.LatLng(-20, -40)),
  },
];
