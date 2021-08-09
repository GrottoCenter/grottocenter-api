import { keys, includes } from 'ramda';
import { ENTRANCE } from './constants';

const requiredColumnsDocument = [
  'id',
  'rdf:type',
  'dct:rights/cc:attributionName',
  'dct:rights/karstlink:licenseType',
  'gn:countryCode',
];

const requiredColumnsEntrance = [
  'id',
  'rdf:type',
  'dct:rights/cc:attributionName',
  'dct:rights/karstlink:licenseType',
  'gn:countryCode',
  'w3geo:latitude',
  'w3geo:longitude',
];

const checkData = (data, selectedType, formatMessage) => {
  const errors = [];
  data.forEach((row, index) => {
    if (row.errors.length !== 0) {
      row.errors.forEach((err) => {
        errors.push({
          errorMessage: err.message,
          row: err.row + 2,
        });
      });
    } else {
      const requiredColumns =
        selectedType === ENTRANCE
          ? requiredColumnsEntrance
          : requiredColumnsDocument;

      const rowDataKeys = keys(row.data);
      requiredColumns.forEach((requiredColumn) => {
        if (
          !includes(requiredColumn, rowDataKeys) ||
          row.data[requiredColumn] === ''
        ) {
          errors.push({
            errorMessage: formatMessage(
              {
                id: 'column value missing',
                defaultMessage:
                  'The following column is missing a value : {column}.',
              },
              { column: requiredColumn },
            ),
            row: index + 2,
          });
        }
      });
    }
  });
  return errors;
};

export default checkData;
