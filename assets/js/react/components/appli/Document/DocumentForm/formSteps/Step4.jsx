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
  const { formatMessage } = useIntl();
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
              key="doc_type"
              name={formatMessage({ id: 'Document type' })}
              value={pathOr(null, ['documentType', 'name'], docAttributes)}
            />

            {pathOr('', ['documentMainLanguage', 'refName'], docAttributes) !==
              '' && (
              <Property
                key="main_language"
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
              key="title"
              name={formatMessage({ id: 'Title' })}
              value={docAttributes.title}
            />
            <Property
              key="description"
              name={formatMessage({ id: 'Description' })}
              value={docAttributes.description}
            />
            <Property
              key="publication_date"
              name={formatMessage({ id: 'Publication Date' })}
              value={docAttributes.publicationDate}
            />
            <Property
              key="authors"
              name={formatMessage({ id: 'Authors' })}
              value={docAttributes.authors}
              customToString={(author) =>
                author.name
                  ? `${author.name} ${author.surname}`
                  : author.nickname
              }
            />
            <Property
              key="subjects"
              name={formatMessage({ id: 'Subjects' })}
              value={docAttributes.subjects}
              customToString={(subject) =>
                `${subject.code} - ${subject.subject}`
              }
            />
            <Property
              key="parent_document"
              name={formatMessage({ id: 'Parent document' })}
              value={pathOr(null, ['partOf', 'name'], docAttributes)}
            />
            <Property
              key="editor"
              name={formatMessage({ id: 'Editor' })}
              value={pathOr(null, ['editor', 'name'], docAttributes)}
            />
            <Property
              key="library"
              name={formatMessage({ id: 'Library' })}
              value={pathOr(null, ['library', 'name'], docAttributes)}
            />
            <Property
              key="regions"
              name={formatMessage({ id: 'Regions' })}
              value={docAttributes.regions}
              customToString={(region) => region.name}
            />
            <Property
              key="massif"
              name={formatMessage({ id: 'Massif' })}
              value={pathOr(null, ['massif', 'name'], docAttributes)}
            />
            <Property
              key="issue"
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
              key="comment"
              name={formatMessage({ id: 'Comment' })}
              value={docAttributes.authorComment}
            />
            <Property
              key="identifier"
              name={formatMessage({ id: 'Identifier' })}
              value={docAttributes.identifier}
            />
            <Property
              key="identifier_type"
              name={formatMessage({ id: 'Identifier Type' })}
              value={
                pathOr(null, ['identifierType', 'id'], docAttributes)
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
