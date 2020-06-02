import * as React from 'react';
import useLocationPredictions from '../../../hooks/useLocationPredictions';
import usePlacesDetail from '../../../hooks/usePlacesDetail';

const sessionToken =
  Math.random()
    .toString(36)
    .substring(2, 15) +
  Math.random()
    .toString(36)
    .substring(2, 15);

/**
 * Example of gelocalisation autocomplete on all fields and translation gestion
 */
const example = () => {
  // contryCode : needed to restric the localization for the region field
  // input : Value retrieved when the user is typing into the input.
  // id : ID of Place Object. Needed for translation and place restriction.
  // **Bounds : Google Bounds Object, needed for the localization restriction.
  // **Translated : Name of the fields translated with countryCode.

  const [formValue, setFormValue] = React.useState({
    country: { id: '', input: '' },
    region: { id: '', input: '' },
    county: { id: '', input: '' },
    city: { id: '', input: '' },
  });

  const countryCode = usePlacesDetail(formValue.country.id, null, sessionToken);
  const regionBounds = usePlacesDetail(
    formValue.region.id,
    countryCode,
    sessionToken,
  );
  const countyBounds = usePlacesDetail(
    formValue.county.id,
    countryCode,
    sessionToken,
  );

  const regionTranslated = usePlacesDetail(
    formValue.region.id,
    countryCode,
    sessionToken,
  );
  const countyTranslated = usePlacesDetail(
    formValue.county.id,
    countryCode,
    sessionToken,
  );
  const cityTranslated = usePlacesDetail(
    formValue.city.id,
    countryCode,
    sessionToken,
  );

  // Hook to enable autocomplete on a field
  const predictionsCountry = useLocationPredictions(
    formValue.country.input,
    'country',
    sessionToken,
    null,
  );
  const predictionsRegions = useLocationPredictions(
    formValue.region.input,
    'region',
    sessionToken,
    countryCode,
    null,
  );
  const predictionsCounty = useLocationPredictions(
    formValue.county.input,
    'county',
    sessionToken,
    null,
    regionBounds[1],
  );
  const predictionsCity = useLocationPredictions(
    formValue.city.input,
    'city',
    sessionToken,
    null,
    countyBounds[1],
  );

  // Sets state value (id & label) of the specified type
  const handleFormChange = (field, type) => {
    switch (type) {
      case 'country':
        setFormValue({ ...formValue, country: field });
        break;
      case 'region':
        setFormValue({ ...formValue, region: field });
        break;
      case 'county':
        setFormValue({ ...formValue, county: field });
        break;
      case 'city':
        setFormValue({ ...formValue, city: field });
        break;
      default:
        break;
    }
  };

  return (
    <div>
      <input
        value={formValue.country.input}
        onChange={(event) =>
          setFormValue({
            ...formValue,
            country: { id: '', input: event.target.value },
          })
        }
      />
      <ul>
        {predictionsCountry.map((prediction) => (
          <li
            key={prediction.id}
            role="presentation"
            onClick={() =>
              handleFormChange(
                { id: prediction.id, input: prediction.label },
                'country',
              )
            }
          >
            {prediction.label}
          </li>
        ))}
      </ul>

      <input
        value={formValue.region.input}
        onChange={(event) =>
          setFormValue({
            ...formValue,
            region: { id: '', input: event.target.value },
          })
        }
      />
      <ul>
        {predictionsRegions.map((prediction) => (
          <li
            role="presentation"
            onClick={() =>
              handleFormChange(
                { id: prediction.id, input: prediction.label },
                'region',
              )
            }
            key={prediction.id}
          >
            {prediction.label}
          </li>
        ))}
      </ul>

      <input
        value={formValue.county.input}
        onChange={(event) =>
          setFormValue({
            ...formValue,
            county: { id: '', input: event.target.value },
          })
        }
      />
      <ul>
        {predictionsCounty.map((prediction) => (
          <li
            role="presentation"
            onClick={() =>
              handleFormChange(
                { id: prediction.id, input: prediction.label },
                'county',
              )
            }
            key={prediction.id}
          >
            {prediction.label}
          </li>
        ))}
      </ul>

      <input
        value={formValue.city.input}
        onChange={(event) =>
          setFormValue({
            ...formValue,
            city: { id: '', input: event.target.value },
          })
        }
      />
      <ul>
        {predictionsCity.map((prediction) => (
          <li
            role="presentation"
            onClick={() =>
              handleFormChange(
                { id: prediction.id, input: prediction.label },
                'city',
              )
            }
            key={prediction.id}
          >
            {prediction.label}
          </li>
        ))}
      </ul>

      <div className="results">
        <h2>Translated fields</h2>
        <ul>
          <li id="countryTranslated">Country : {countryCode}</li>
          <li id="regionTranslated">Region : {regionTranslated[0]}</li>
          <li id="countyTranslated">County : {countyTranslated[0]}</li>
          <li id="cityTranslated">City : {cityTranslated[0]}</li>
        </ul>
      </div>
    </div>
  );
};

export default example;
