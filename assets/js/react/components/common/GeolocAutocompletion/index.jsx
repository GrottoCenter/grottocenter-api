import * as React from 'react';
import useLocationPredictions from '../../../hooks/useLocationPredictions';
import usePlacesDetail from '../../../hooks/usePlacesDetail';

/**
 * Example of gelocalisation autocomplete on all fields and translation gestion
 */
const example = () => {
  // contryCode : needed to restric the localization for the region field
  // input** : Value retrieved when the user is typing into the input.
  // **Code : ID of Place Object. Needed for translation and place restriction.
  // **Bounds : Google Bounds Object, needed for the localization restriction.
  // **Translated : Name of the fields translated with countryCode.

  const [inputCountry, setInputCountry] = React.useState('');
  const [countryId, setCountryId] = React.useState('');
  const countryCode = usePlacesDetail(countryId);

  const [inputRegion, setInputRegion] = React.useState('');
  const [regionId, setRegionId] = React.useState('');
  const regionBounds = usePlacesDetail(regionId, countryCode);

  const [inputCounty, setInputCounty] = React.useState('');
  const [countyId, setCountyId] = React.useState('');
  const countyBounds = usePlacesDetail(countyId, countryCode);

  const [inputCity, setInputCity] = React.useState('');
  const [cityId, setCityId] = React.useState('');

  const regionTranslated = usePlacesDetail(regionId, 'ru');
  const countyTranslated = usePlacesDetail(countyId, 'ru');
  const cityTranslated = usePlacesDetail(cityId, 'ru');

  // Hook to enable autocomplete on a field
  const predictionsCountry = useLocationPredictions(
    inputCountry,
    'country',
    null,
    null,
  );
  const predictionsRegions = useLocationPredictions(
    inputRegion,
    'region',
    countryCode,
    null,
  );
  const predictionsCounty = useLocationPredictions(
    inputCounty,
    'county',
    null,
    regionBounds[1],
  );
  const predictionsCity = useLocationPredictions(
    inputCity,
    'city',
    null,
    countyBounds[1],
  );

  // Triggered when a prediction is selected, retrieves place's detail
  const onSelect = (prediction, type) => {
    if (prediction) {
      if (type === 'country') {
        setInputCountry(prediction.label);
        setCountryId(prediction.id);
      } else if (type === 'region') {
        setInputRegion(prediction.label);
        setRegionId(prediction.id);
      } else if (type === 'county') {
        setInputCounty(prediction.label);
        setCountyId(prediction.id);
      } else if (type === 'city') {
        setInputCity(prediction.label);
        setCityId(prediction.id);
      }
    }
  };

  return (
    <div>
      <input
        value={inputCountry}
        onChange={(event) => setInputCountry(event.target.value)}
      />
      <ul>
        {predictionsCountry.map((prediction) => (
          <li
            role="presentation"
            onClick={() => onSelect(prediction, 'country')}
            onKeyPress={() => onSelect(prediction, 'country')}
          >
            {prediction.label}
          </li>
        ))}
      </ul>

      <input
        value={inputRegion}
        onChange={(event) => setInputRegion(event.target.value)}
      />
      <ul>
        {predictionsRegions.map((prediction) => (
          <li
            role="presentation"
            onClick={() => onSelect(prediction, 'region')}
            key={prediction.id}
          >
            {prediction.label}
          </li>
        ))}
      </ul>

      <input
        value={inputCounty}
        onChange={(event) => setInputCounty(event.target.value)}
      />
      <ul>
        {predictionsCounty.map((prediction) => (
          <li
            role="presentation"
            onClick={() => onSelect(prediction, 'county')}
            key={prediction.id}
          >
            {prediction.label}
          </li>
        ))}
      </ul>

      <input
        value={inputCity}
        onChange={(event) => setInputCity(event.target.value)}
      />
      <ul>
        {predictionsCity.map((prediction) => (
          <li
            role="presentation"
            onClick={() => onSelect(prediction, 'city')}
            key={prediction.id}
          >
            {prediction.label}
          </li>
        ))}
      </ul>

      <div className="results">
        <h2>Translated fields</h2>
        <ul>
          <li>Country : {countryCode}</li>
          <li>Region : {regionTranslated[0]}</li>
          <li>County : {countyTranslated[0]}</li>
          <li>City : {cityTranslated[0]}</li>
        </ul>
      </div>
    </div>
  );
};

export default example;
