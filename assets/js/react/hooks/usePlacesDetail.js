import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { placesDetail } from '../conf/Config';

/**
 * Hook used to translate Google places and retrieve Google places detail
 */
export default function usePlacesDetail(placeId, countryCode) {
  const [placeDetail, setPlaceDetail] = useState([]);

  /**
   * Retrieves the detail of the given Google Places id in the given language
   * @param id : Google places ID
   * @param languageCode : optional Iso2 country code
   * @return : Google Places detailed object https://developers.google.com/places/web-service/details?hl=fr#PlaceDetailsResults in the language specified
   */
  function getPlaceDetail(id, languageCode = null) {
    let url = `${placesDetail}?place_id=${id}`;
    if (languageCode) {
      url += `&language=${languageCode}`;
    }
    fetch(url, {
      method: 'GET',
    })
      .then((resp) => {
        return resp.json();
      })
      .then((data) => {
        if (languageCode !== null) {
          const bounds = {
            latNE: data.result.geometry.viewport.northeast.lat,
            lngNE: data.result.geometry.viewport.northeast.lng,
            latSO: data.result.geometry.viewport.southwest.lat,
            lngSO: data.result.geometry.viewport.southwest.lng,
          };
          bounds.latCenter = (bounds.latNE + bounds.latSO) / 2;
          bounds.lngCenter = (bounds.lngNE + bounds.lngSO) / 2;
          setPlaceDetail([
            data.result.address_components[0].short_name,
            bounds,
          ]);
        } else {
          setPlaceDetail(data.result.address_components[0].short_name);
        }
      });
  }

  // Set a timeout to avoid redoing the request
  const debouncedFetchPlaceDetail = useCallback(
    debounce(getPlaceDetail, 500),
    [],
  );

  useEffect(() => {
    if (placeId !== '') {
      debouncedFetchPlaceDetail(placeId, countryCode);
    }
  }, [placeId]);

  return placeDetail;
}
