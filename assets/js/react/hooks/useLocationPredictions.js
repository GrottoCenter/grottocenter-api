import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { placesAutocomplete } from '../conf/Config';

const API_KEY = 'AIzaSyDEhu_hKSYRA_z3alWshvH2P41vDdHgO2o';
/**
 * Custom hook that fetches and returns places predictions
 * @param input : String containing the user research (eg : fra)
 * @param type : String that can only be (country, region, county, city)
 * @param country : Optional string containing a Iso2 country code
 * @param bounds : Optional LatLng Google object used to restrict localization
 * @param startLength : Optional Int, amount of chars to trigger autocomplete
 */
export default function useLocationPredictions(
  input,
  type,
  country = null,
  bounds = null,
  startLength = 3,
) {
  const [predictions, setPredictions] = useState([]);

  /**
   * Converts Google Bounds to lat lng and radius
   * @param boundsGoogle : LatLng Google object used to restrict localization
   * @return Object containing a latitude, longitude and a radius
   */
  function getLocalizationRestriction(boundsGoogle) {
    const latCenter = boundsGoogle.getCenter().lat();
    const lngCenter = boundsGoogle.getCenter().lng();
    const latNE = boundsGoogle.getNorthEast().lat();
    const lngNE = boundsGoogle.getNorthEast().lng();
    // Convert lat or lng from decimal degrees into radians
    const lat1 = latCenter / 57.2958;
    const lon1 = lngCenter / 57.2958;
    const lat2 = latNE / 57.2958;
    const lon2 = lngNE / 57.2958;
    // r = radius of the earth in statute miles
    const r = 3963.0;
    // distance = circle radius from center to Northeast corner of bounds
    let dis =
      r *
      Math.acos(
        Math.sin(lat1) * Math.sin(lat2) +
          Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1),
      );
    // convert to meters
    dis = dis * 1.60934 * 1000;
    return {
      lat: latCenter,
      lng: lngCenter,
      radius: dis,
    };
  }

  /**
   * Filter the array of suggestions by type of administration
   * @param suggestions : Places suggestions returned by Google API
   * @param typeAdmin : Administrative type used to filter the suggestions
   * @return Array of predictions filtered by the type of administration
   */
  function sortPredictions(suggestions, typeAdmin) {
    const predictionsResults = [];
    let typeAdm = typeAdmin;
    if (typeAdmin !== 'country' && typeAdmin !== 'city') {
      typeAdm =
        typeAdmin === 'region'
          ? 'administrative_area_level_1'
          : 'administrative_area_level_2';
    }
    for (let i = 0; i < suggestions.length; i += 1) {
      if (typeAdmin === 'city') {
        predictionsResults.push({
          label: `${suggestions[i].structured_formatting.main_text}`,
          id: `${suggestions[i].place_id}`,
        });
      } else if (suggestions[i].types.includes(typeAdm)) {
        predictionsResults.push({
          label: `${suggestions[i].structured_formatting.main_text}`,
          id: `${suggestions[i].place_id}`,
        });
      }
    }
    return predictionsResults;
  }

  /**
   * Fetches places suggestions with user input and localization optional params
   * @param userInput : String containing the user research (eg : fra)
   * @param typeAdmin : String that can only be (country, region, county, city)
   * @param countryRestriction : Optional string containing a Iso2 country code
   * @param boundsRestriction : Optional LatLng Google object
   * @return : An array of Google places object https://developers.google.com/places/web-service/autocomplete?hl=fr#place_autocomplete_results
   */
  function fetchPlacesPredictions(
    userInput,
    typeAdmin,
    countryRestriction,
    boundsRestriction,
  ) {
    const service = new window.google.maps.places.AutocompleteService();
    if (typeAdmin === 'city' || typeAdmin === 'county') {
      const localization = getLocalizationRestriction(boundsRestriction);
      fetch(
        `${placesAutocomplete}?input=${userInput}&types=${
          typeAdmin === 'city' ? '(cities)' : '(regions)'
        }&key=${API_KEY}&location=${localization.lat},${localization.lng}&radius=${localization.radius}&strictbounds=true`,
        {
          method: 'GET',
        },
      )
        .then((resp) => {
          return resp.json();
        })
        .then((data) => {
          setPredictions(sortPredictions(data.predictions, typeAdmin));
        });
    } else {
      service.getPlacePredictions(
        typeAdmin === 'country'
          ? {
              input: userInput,
              types: ['(regions)'],
            }
          : {
              input: userInput,
              types: ['(regions)'],
              componentRestrictions: { country: countryRestriction },
            },
        (suggestions) => {
          if (suggestions)
            setPredictions(sortPredictions(suggestions, typeAdmin));
        },
      );
    }
  }
  // Set a timeout to avoid redoing the request
  const debouncedFetchPlacePredictions = useCallback(
    debounce(fetchPlacesPredictions, 500),
    [],
  );

  useEffect(() => {
    if (input.length >= startLength)
      debouncedFetchPlacePredictions(input, type, country, bounds);
  }, [input]);

  return predictions;
}
