import React, { useContext, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import PropTypes from 'prop-types';
import { entranceValidator, documentValidator, dateChecker } from './Helper';
import { ImportPageContentContext } from './Provider';

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const CSVDataValidator = ({ selectedFile, errorHandler }) => {
  const [data, setData] = React.useState([]);
  const [columns, setColumns] = React.useState([]);
  const { selectedType, updateAttribute } = useContext(
    ImportPageContentContext,
  );
  const [validator] = React.useState(
    selectedType === 0 ? entranceValidator : documentValidator,
  );

  const processData = (dataString) => {
    const dataStringLines = dataString.split(/\r\n|\n/);
    const headers = dataStringLines[0].split(
      /,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/,
    );

    const list = [];
    for (let i = 1; i < dataStringLines.length; i += 1) {
      const row = dataStringLines[i].split(
        /,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/,
      );

      if (headers && row.length === headers.length) {
        const obj = {};
        for (let j = 0; j < headers.length; j += 1) {
          let cell = row[j];
          if (cell.length > 0) {
            if (cell[0] === '"') cell = cell.substring(1, cell.length - 1);
            if (cell[cell.length - 1] === '"')
              cell = cell.substring(cell.length - 2, 1);
          }
          if (headers[j]) {
            obj[headers[j]] = cell;
          }
        }

        if (Object.values(obj).filter((x) => x).length > 0) {
          list.push(obj);
        }
      }
    }

    const CSVColumnsBlankLess = headers.map((column) => {
      return column.replace(/( |\s|\r|\t|\n)+/g, '');
    });

    list.forEach((row) => {
      const currentRow = row;
      Object.keys(currentRow).forEach((key) => {
        currentRow[key.replace(/( |\s|\r|\t|\n)+/g, '')] = currentRow[key];
        if (key.includes(' ')) delete currentRow[key];
      });
    });

    setData(list);
    setColumns(CSVColumnsBlankLess);
  };

  const read = (file) => {
    const reader = new window.FileReader();
    reader.onload = (evt) => {
      const excelData = evt.target.result;
      const wb = XLSX.read(excelData, { type: 'binary', dateNF: 'yyyy-mm-dd' });

      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];

      const CSVData = XLSX.utils.sheet_to_csv(ws);
      processData(CSVData);
    };
    reader.readAsText(file);
  };

  const validate = () => {
    const validatorArray = Object.keys(validator);
    const headerErrors = {};
    const importErrors = {};

    if (
      (selectedType === 0 &&
        columns.length !== 28 &&
        selectedFile !== undefined) ||
      (selectedType === 1 &&
        columns.length !== 25 &&
        selectedFile !== undefined)
    ) {
      importErrors.delimiter = 'DELIMITER_ERROR';
    } else {
      columns.forEach((columnValue) => {
        if (!validatorArray.includes(columnValue))
          headerErrors[columnValue] = 'INVALID_HEADER';
      });
      if (Object.keys(headerErrors).length !== 0)
        importErrors.header = headerErrors;
      else {
        for (let i = 0; i < data.length; i += 1) {
          const currentDataRow = data[i];

          if (
            (selectedType === 0 && currentDataRow.length > 28) ||
            (selectedType === 1 && currentDataRow.length > 25)
          ) {
            importErrors.delimiter = 'DELIMITER_ERROR';
          } else {
            for (let j = 0; j < validatorArray.length; j += 1) {
              let currentData = currentDataRow[validatorArray[j]];
              const columnName = validatorArray[j];
              const columnType = validator[validatorArray[j]].type;

              if (columnType === 'date') {
                if (currentData !== null && currentData !== '') {
                  if (!dateChecker(currentData))
                    importErrors[columnName] = 'INVALID_DATE_FORMAT';
                  else {
                    currentData = new Date(currentData);
                    if (currentData.getTime() > new Date().getTime())
                      importErrors[columnName] = 'DATE_IN_FUTURE';
                    else if (
                      validatorArray[j] === 'dct:rights/dct:modified' &&
                      new Date(
                        currentDataRow['dct:rights/dct:created'],
                      ).getTime() > currentData.getTime()
                    )
                      importErrors[columnName] = 'MODIFIED_BEFORE_CREATED';
                  }
                } else importErrors[columnName] = 'FIELD_NULL';
              }
            }
          }
        }
      }
    }

    errorHandler(importErrors);

    return Object.keys(importErrors).length === 0;
  };

  const prevColumns = usePrevious(columns);
  const prevData = usePrevious(data);
  useEffect(() => {
    if (
      (prevColumns !== undefined && prevColumns !== columns) ||
      (prevData !== undefined && prevData !== data)
    ) {
      if (prevData.length !== 0) {
        if (validate()) updateAttribute('importData', data);
      }
    }
  }, [columns, data]);

  useEffect(() => {
    if (selectedFile !== null) read(selectedFile);
  }, [selectedFile]);

  return <></>;
};

CSVDataValidator.propTypes = {
  errorHandler: PropTypes.func,
  selectedFile: PropTypes.shape({
    path: PropTypes.string,
    name: PropTypes.string,
    lastModified: PropTypes.number,
    webkitRelativePath: PropTypes.string,
    size: PropTypes.number,
    type: PropTypes.string,
  }),
};

export default CSVDataValidator;
