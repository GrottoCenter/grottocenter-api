import React from 'react';

/* global google */
const API_KEY = '';

/**
 * Class used to translate Google places and retrieve Google places detail with Google API's information
 */
export default class PlacesDetail extends React.Component {
    constructor(props) {
        super(props);
    }
    /**
     * Translate the given Google Places id in the given languageCode
     * @param id : Google places ID
     * @param languageCode : Iso2 country code
     * @return : Google Places detailed object https://developers.google.com/places/web-service/details?hl=fr#PlaceDetailsResults in the language specified
     */
    translatePlaceDetail = (id, languageCode, callback) => {
        if (!id || !languageCode) {
            callback({});
        } else {
            setTimeout(() => {
                fetch(`https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/details/json?placeid=${id}&language=${languageCode}&sensor=true&key=${API_KEY}` , {
                    method: "GET",
                })
                .then((resp) => {
                    return resp.json()
                }) 
                .then((data) => {
                    console.log(data);
                    callback(data.result);      
                })
                .catch((error) => {
                    console.log(error, "error while translating place")
                });
            });
        }
    }
    /**
     * Retrieves the detail of the given Google Places id and creates a Google LatLngBounds object 
     * @param : Google places ID
     * @return : An array containing a Google Places detailed object https://developers.google.com/places/web-service/details?hl=fr#PlaceDetailsResults and a LatLngBounds Google object
     */
    getPlaceDetail = (id, callback) => {
        if (!id) {
            callback({});
        } else {
            var service = new google.maps.places.PlacesService(document.createElement('div'));
            service.getDetails({placeId: id}, (place) => {
                var bounds = new google.maps.LatLngBounds(
                    new google.maps.LatLng(place.geometry.viewport.Ya.i, place.geometry.viewport.Ua.i),
                    new google.maps.LatLng(place.geometry.viewport.Ya.j, place.geometry.viewport.Ua.j));
                callback([place, bounds]);
            });
        }
    }  
}