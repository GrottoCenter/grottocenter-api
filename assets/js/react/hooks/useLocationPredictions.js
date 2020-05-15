import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";

/* global google */

const API_KEY = '';
/**
 * Custom hook that fetches and returns places predictions
 * @param input : String containing the user research (eg : fra) 
 * @param type : String that can only be (country, region, county, city)
 * @param country : Optional string containing a Iso2 country code
 * @param bounds : Optional LatLng Google object used for localization restriction 
 * @param startLength : Optional Int specifying the amount of chars an user has to type to trigger the autocomplete
 */
export default function useLocationPredictions(input, type, country = null, bounds = null, startLength = 2) {
    const [predictions, setPredictions] = useState([]);
    
    /**
     * Fetches the most look a like places based on the user input and localization restriction parameters
     * @param input : String containing the user research (eg : fra) 
     * @param type : String that can only be (country, region, county, city)
     * @param country : Optional string containing a Iso2 country code
     * @param bounds : Optional LatLng Google object used for localization restriction 
     * @return : An array of Google places object https://developers.google.com/places/web-service/autocomplete?hl=fr#place_autocomplete_results
     */
    function fetchPlacesPredictions(input, type, country, bounds) {
        var service = new google.maps.places.AutocompleteService();
        var tmp = [];
        if (type === 'city' || type === 'county') {
            var tmp = [];

            // r = radius of the earth in statute miles
            var r = 3963.0;  
            const latCenter = bounds.getCenter().lat();
            const lngCenter = bounds.getCenter().lng();
            const latNE = bounds.getNorthEast().lat();
            const lngNE = bounds.getNorthEast().lng();

            // Convert lat or lng from decimal degrees into radians (divide by 57.2958)
            var lat1 = latCenter / 57.2958; 
            var lon1 = lngCenter / 57.2958;
            var lat2 = latNE / 57.2958;
            var lon2 = lngNE / 57.2958;

            // distance = circle radius from center to Northeast corner of bounds
            var dis = r * Math.acos(Math.sin(lat1) * Math.sin(lat2) + 
            Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1));

            // convert to meters
            dis = dis * 1.60934 * 1000;
            fetch(`https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&types=${type === 'city' ? '(cities)' : '(regions)'}&key=${API_KEY}&location=${latCenter},${lngCenter}&radius=${dis}&strictbounds=true` , {
                method: "GET",
            })
            .then((resp) => {
                return resp.json()
            }) 
            .then((data) => {
                for (var i = 0; i < data.predictions.length; i++) {
                    if (type === 'county') {
                        if (data.predictions[i].types.includes('administrative_area_level_2')) {
                            tmp.push({ label: `${data.predictions[i].structured_formatting.main_text}`, id: `${data.predictions[i].place_id}` });
                        }
                    } else {
                        tmp.push({ label: `${data.predictions[i].structured_formatting.main_text}`, id: `${data.predictions[i].place_id}` });
                    }
                }
                setPredictions(tmp);      
            })
            .catch((error) => {
                console.log(error, "error while retrieving predictions")
            });

        } else {
            service.getPlacePredictions(type === 'country' ? {
                input: input,
                types: ['(regions)']
            } : {
                input: input,
                types: ['(regions)'],
                componentRestrictions: {country: country}
            }, (predictions) => {
                if (predictions) {
                    var tmp =[];
                    for (var i = 0; i < predictions.length; i++) {
                        if (type === 'country') {
                            if (predictions[i].types.includes('country')) {
                                tmp.push({ label: `${predictions[i].structured_formatting.main_text}`, id: `${predictions[i].place_id}` });
                            }  
                        } else {
                            if (predictions[i].types.includes('administrative_area_level_1')) {
                                tmp.push({ label: `${predictions[i].structured_formatting.main_text}`, id: `${predictions[i].place_id}` });
                            }  
                        }
                    }
                }
                setPredictions(tmp);
            });
        }
    }
    // Set a timeout to avoid redoing the request
    const debouncedFetchPlacePredictions = useCallback(
        debounce(fetchPlacesPredictions, 500),
        []
    );

    useEffect(() => {
        if (input.length >= startLength)
            debouncedFetchPlacePredictions(input, type, country, bounds);
    }, [input]);

    return predictions;

}