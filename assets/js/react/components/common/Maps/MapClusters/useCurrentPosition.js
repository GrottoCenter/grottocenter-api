import { useEffect, useState } from 'react';
import { useMapEvent } from 'react-leaflet';
import { isEmpty, isNil } from 'ramda';

const useCurrentPosition = (defaultPosition) => {
  const [position, setPosition] = useState(null);
  const map = useMapEvent('locationfound', (e) => {
    setPosition(e.latlng);
    // TODO currently defaultPosition is not set. Sharing a map url will not work and it will always inter this condition
    if (isNil(defaultPosition) || isEmpty(defaultPosition)) {
      map.flyTo(e.latlng, map.getZoom());
    }
  });

  useEffect(() => {
    map.locate();
  }, []);

  return position;
};

export default useCurrentPosition;
