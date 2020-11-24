import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { anyPass, forEach, isEmpty, isNil, map as rMap } from 'ramda';
import { renderToString } from 'react-dom/server';

const isNilOrEmpty = anyPass([isNil, isEmpty]);

const useMarkers = (icon, popupContent = null) => {
  const map = useMap();
  const [canvas] = useState(L.canvas());
  const [markers, setMarkers] = useState();
  const options = { icon, renderer: canvas };

  const makeMarkers = rMap((marker) => {
    const { latitude, longitude } = marker;
    if (!isNil(popupContent)) {
      return L.marker([latitude, longitude], options).bindPopup(
        renderToString(popupContent(marker)),
      );
    }
    return L.marker([latitude, longitude], options);
  });

  const addMarkers = forEach((marker) => marker.addTo(map));
  const deleteMarkers = forEach((marker) => marker.remove(map));

  useEffect(() => {
    if (!isNilOrEmpty(markers)) {
      addMarkers(markers);
    }
  }, [markers]);

  const handleUpdateMarkers = (newMarkers) => {
    if (!isNilOrEmpty(markers)) {
      deleteMarkers(markers);
    }
    setMarkers(isNilOrEmpty(newMarkers) ? null : makeMarkers(newMarkers));
  };

  return handleUpdateMarkers;
};

export default useMarkers;
