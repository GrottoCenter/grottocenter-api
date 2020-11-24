import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import {
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@material-ui/core';
import { includes, isNil, pathOr } from 'ramda';

import { DocumentFormContext } from '../Provider';

// ===================================

const PropertyName = styled(TableCell)`
  font-weight: bold;
  text-transform: uppercase;
`;

const Property = ({ name, value, customToString = (v) => String(v) }) => {
  // Handle '', null, undefined and []
  if (
    isNil(value) ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return '';
  }

  return (
    <TableRow>
      <PropertyName align="right">{name}</PropertyName>
      <TableCell>
        {Array.isArray(value) ? (
          <ul>
            {value.map((v) => (
              <li>
                {customToString(v)}
                <br />
              </li>
            ))}
          </ul>
        ) : (
          // whiteSpace property for description multi-lines display
          <span style={{ whiteSpace: 'pre-line' }}>
            {customToString(value)}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
};

Property.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.any, // eslint-disable-line react/forbid-prop-types
  customToString: PropTypes.func,
};

// ===================================

const Step4 = ({ stepId }) => {
  const { formatMessage, formatDate } = useIntl();
  const { docAttributes, validatedSteps } = useContext(DocumentFormContext);

  const memoizedValues = [includes(stepId, validatedSteps)];

  return useMemo(
    () => (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="right">
                {formatMessage({ id: 'Property name' })}
              </TableCell>
              <TableCell>{formatMessage({ id: 'Property value' })}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <Property
              name={formatMessage({ id: 'Document type' })}
              value={pathOr(null, ['documentType', 'name'], docAttributes)}
            />

            {pathOr('', ['documentMainLanguage', 'refName'], docAttributes) !==
              '' && (
              <Property
                name={formatMessage({ id: 'Document main language' })}
                value={formatMessage({
                  id: docAttributes.documentMainLanguage.refName,
                })}
              />
            )}

            {pathOr(
              '',
              ['titleAndDescriptionLanguage', 'refName'],
              docAttributes,
            ) !== '' && (
              <Property
                name={formatMessage({ id: 'Title and description language' })}
                value={formatMessage({
                  id: docAttributes.titleAndDescriptionLanguage.refName,
                })}
              />
            )}

            <Property
              name={formatMessage({ id: 'Title' })}
              value={docAttributes.title}
            />
            <Property
              name={formatMessage({ id: 'Description' })}
              value={docAttributes.description}
            />
            <Property
              name={formatMessage({ id: 'Publication Date' })}
              value={
                docAttributes.publicationDate &&
                formatDate(docAttributes.publicationDate)
              }
            />
            <Property
              name={formatMessage({ id: 'Authors' })}
              value={docAttributes.authors}
              customToString={(author) =>
                author.name
                  ? `${author.name} ${author.surname}`
                  : author.nickname
              }
            />
            <Property
              name={formatMessage({ id: 'Subjects' })}
              value={docAttributes.subjects}
              customToString={(subject) =>
                `${subject.code} - ${subject.subject}`
              }
            />
            <Property
              name={formatMessage({ id: 'Parent document' })}
              value={pathOr(null, ['partOf', 'name'], docAttributes)}
            />
            <Property
              name={formatMessage({ id: 'Editor' })}
              value={pathOr(null, ['editor', 'name'], docAttributes)}
            />
            <Property
              name={formatMessage({ id: 'Library' })}
              value={pathOr(null, ['library', 'name'], docAttributes)}
            />
            <Property
              name={formatMessage({ id: 'Regions' })}
              value={docAttributes.regions}
              customToString={(region) => region.name}
            />
            <Property
              name={formatMessage({ id: 'Massif' })}
              value={pathOr(null, ['massif', 'name'], docAttributes)}
            />
            <Property
              name={formatMessage({ id: 'Issue' })}
              value={docAttributes.issue}
            />
            {(docAttributes.startPage !== 0 || docAttributes.endPage !== 0) && (
              <>
                <Property
                  name={formatMessage({ id: 'Start Page' })}
                  value={docAttributes.startPage}
                />
                <Property
                  name={formatMessage({ id: 'End Page' })}
                  value={docAttributes.endPage}
                />
              </>
            )}
            <Property
              name={formatMessage({ id: 'Comment' })}
              value={docAttributes.authorComment}
            />
            <Property
              name={formatMessage({ id: 'Identifier' })}
              value={docAttributes.identifier}
            />
            <Property
              name={formatMessage({ id: 'Identifier Type' })}
              value={
                docAttributes.identifierType
                  ? docAttributes.identifierType.id.toUpperCase()
                  : null
              }
            />
          </TableBody>
        </Table>
      </TableContainer>
    ),
    memoizedValues,
  );
};

Step4.propTypes = {
  stepId: PropTypes.number.isRequired,
};

export default Step4;
