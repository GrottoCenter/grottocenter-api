import * as React from 'react';
import AsyncSelect from 'react-select/async';
import useLocationPredictions from '../../../hooks/useLocationPredictions';
import PlacesDetails from './PlacesDetail';

/**
 * Example of gelocalisation autocomplete on all fields (country, region, county, city) and gestion of translation 
 */
const example = () => {

  // contryCode : needed to restric the localization for the region field
  // input** : Value retrieved when the user is typing into the input.
  // **Code : ID of Geolocalized Google Object. Needed for translation and to get the localization for county and city.
  // **Bounds : Google Bounds Object, needed for the localization restriction.
  // **Translated : Name of the fields translated in the language specified by the countryCode.
  const [inputCountry, setInputCountry] = React.useState('');
  const [countryId, setCountryId] = React.useState('');
  const [countryCode, setCountryCode] = React.useState('');

  const [inputRegion, setInputRegion] = React.useState('');
  const [regionId, setRegionId] = React.useState('');
  const [regionBounds, setRegionBounds] = React.useState('');

  const [inputCounty, setInputCounty] = React.useState('');
  const [countyId, setCountyId] = React.useState('');
  const [countyBounds, setCountyBounds] = React.useState('');

  const [inputCity, setInputCity] = React.useState('');
  const [cityId, setCityId] = React.useState('');

  const [countryTranslated, setCountryTranslated] = React.useState('');
  const [regionTranslated, setRegionTranslated] = React.useState('');
  const [countyTranslated, setCountyTranslated] = React.useState('');
  const [cityTranslated, setCityTranslated] = React.useState('');

  const [hidden, setHidden] = React.useState(true);

  // Hook to enable autocomplete on a field
  const predictionsCountry = useLocationPredictions(inputCountry, 'country', undefined, undefined, 3);
  const predictionsRegions = useLocationPredictions(inputRegion, 'region', countryCode, undefined, 3);
  const predictionsCounty = useLocationPredictions(inputCounty, 'county', undefined, regionBounds, 3);
  const predictionsCity = useLocationPredictions(inputCity, 'city', undefined, countyBounds, 3);

  // Triggered when an option is selected, changes the state and retrieves detail of the selected option to get bounds information.
  const onSelect = (selected, type) => {
    if (selected) {
        if (type === 'country') {
            setInputCountry(selected.label)
            setCountryId(selected.id)
            new PlacesDetails().getPlaceDetail(selected.id, (result) => {  
              setCountryCode(result[0].address_components[0].short_name)
            });
        } else if (type === 'region') {
            setInputRegion(selected.label)
            setRegionId(selected.id)
            new PlacesDetails().getPlaceDetail(selected.id, (result) => {
                console.log(result);
                setRegionBounds(result[1]);
              });
        } else if (type === 'county') {
            setInputCounty(selected.label);
            setCountyId(selected.id);
            new PlacesDetails().getPlaceDetail(selected.id, (result) => {
                  console.log(result);
                  setCountyBounds(result[1]);
              });
        } else if (type === 'city') {
            setInputCity(selected.label);
            setCityId(selected.id);
        }
    }
  };

  // Triggered by the translate button, translates all the fields.
  const translatePlaces = () => {
    new PlacesDetails().translatePlaceDetail(countryId, countryCode, (result) => {
      setCountryTranslated(result.address_components[0].short_name);
    });
    new PlacesDetails().translatePlaceDetail(regionId, countryCode, (result) => {
      setRegionTranslated(result.address_components[0].long_name);
    });
    new PlacesDetails().translatePlaceDetail(countyId, countryCode, (result) => {
      setCountyTranslated(result.address_components[0].long_name);
    });
    new PlacesDetails().translatePlaceDetail(cityId, countryCode, (result) => {
      setCityTranslated(result.address_components[0].long_name);
    });
}
  
  return (
    <div>
      <input
        value={inputCountry}
        onChange={event => setInputCountry(event.target.value)}
      />
       <ul>
        {predictionsCountry.map((prediction, index) => (
          <li onClick={() => onSelect(prediction, 'country')}>{prediction.label}</li>
        ))}
      </ul>

      <input
        value={inputRegion}
        onChange={event => setInputRegion(event.target.value)}
      />
       <ul>
        {predictionsRegions.map((prediction, index) => (
          <li onClick={() => onSelect(prediction, 'region')} key={prediction.id}>{prediction.label}</li>
        ))}
      </ul>

      <input
        value={inputCounty}
        onChange={event => setInputCounty(event.target.value)}
      />
       <ul>
        {predictionsCounty.map((prediction, index) => (
          <li onClick={() => onSelect(prediction, 'county')} key={prediction.id}>{prediction.label}</li>
        ))}
      </ul>

      <input
        value={inputCity}
        onChange={event => setInputCity(event.target.value)}
      />
       <ul>
        {predictionsCity.map((prediction, index) => (
          <li onClick={() => onSelect(prediction, 'city')} key={prediction.id}>{prediction.label}</li>
        ))}
      </ul>
      
      <button onClick={() => { setHidden(false); translatePlaces()}}>Translate</button>

      <div className="results" hidden={hidden}>
          <ul>
              <li>Country : {countryTranslated}</li>
              <li>Region : {regionTranslated}</li>
              <li>County : {countyTranslated}</li>
              <li>City : {cityTranslated}</li>
          </ul>
      </div>
    </div>
    
);
}

export default example;