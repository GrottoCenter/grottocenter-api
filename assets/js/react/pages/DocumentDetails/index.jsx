import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import { Terrain, Home } from '@material-ui/icons';
import { isNil } from 'ramda';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import Overview from './Overview';
import Section from './Section';
import CustomIcon from '../../components/common/CustomIcon';
import { fetchDocumentDetails } from '../../actions/DocumentDetails';
import {
  makeDetails,
  makeEntities,
  makeOrganizations,
  makeOverview,
} from './transformers';

const Wrapper = styled.div`
  & > div {
    margin-bottom: ${({ theme }) => theme.spacing(3)}px;
  }
`;

const DocumentPage = ({
  loading = true,
  overview,
  organizations,
  details,
  entities,
}) => {
  const { formatMessage, formatDate } = useIntl();
  return (
    <Wrapper>
      <Overview {...overview} loading={loading} />
      <Section
        loading={loading}
        title={formatMessage({ id: 'Organizations' })}
        content={[
          {
            Icon: () => <Home fontSize="large" color="primary" />,
            label: formatMessage({ id: 'Editor' }),
            value: organizations.editor,
          },
          {
            Icon: () => <CustomIcon type="bibliography" />,
            label: formatMessage({ id: 'Library' }),
            value: organizations.library,
          },
        ]}
      />
      <Section
        loading={loading}
        title={formatMessage({ id: 'Details' })}
        content={[
          {
            label: formatMessage({ id: 'Identifier' }),
            value: details.identifier,
          },
          {
            label: formatMessage({ id: 'BBS reference' }),
            value: details.bbsReference,
          },
          {
            label: formatMessage({ id: 'Document Type' }),
            value: details.documentType,
          },
          {
            label: formatMessage({ id: 'Publication date' }),
            value: details.publicationDate
              ? formatDate(details.publicationDate)
              : null,
          },
          {
            label: formatMessage({ id: 'Document parent' }),
            value: details.parentDocument,
          },
          {
            label: formatMessage({ id: 'Pages' }),
            value: details.pages,
          },
          {
            label: formatMessage({ id: 'Subjects' }),
            value: details.subjects,
            type: 'list',
          },
          {
            label: formatMessage({ id: 'Regions' }),
            value: details.regions,
            type: 'list',
          },
        ]}
      />
      <Section
        loading={loading}
        title={formatMessage({ id: 'Linked Entities' })}
        content={[
          {
            Icon: () => <Terrain fontSize="large" color="primary" />,
            label: formatMessage({ id: 'Massif' }),
            value: entities.massif,
          },
          {
            Icon: () => <CustomIcon type="entry" />,
            label: formatMessage({ id: 'Entry' }),
            value: entities.entry,
          },
          {
            Icon: () => <CustomIcon type="cave_system" />,
            label: formatMessage({ id: 'Cave' }),
            value: entities.cave,
          },
        ]}
      />
    </Wrapper>
  );
};

const HydratedDocumentPage = ({ id }) => {
  const { documentId: documentIdFromRoute } = useParams();
  const documentId = documentIdFromRoute || id;
  const dispatch = useDispatch();
  const { isLoading, details, error } = useSelector(
    (state) => state.documentDetails,
  );

  useEffect(() => {
    if (!isNil(documentId)) {
      dispatch(fetchDocumentDetails(documentId));
    }
  }, [documentId]);

  return (
    <DocumentPage
      overview={makeOverview(details || {})}
      organizations={makeOrganizations(details || {})}
      details={makeDetails(details || {})}
      entities={makeEntities(details || {})}
      loading={isNil(documentId) || isLoading || !isNil(error)}
    />
  );
};

export default HydratedDocumentPage;

DocumentPage.propTypes = {
  loading: PropTypes.bool,
  overview: PropTypes.shape({
    createdBy: PropTypes.string.isRequired,
    authors: PropTypes.arrayOf(PropTypes.string).isRequired,
    language: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
  }),
  organizations: PropTypes.shape({
    editor: PropTypes.string,
    library: PropTypes.string,
  }),
  details: PropTypes.shape({
    identifier: PropTypes.string,
    bbsReference: PropTypes.string,
    documentType: PropTypes.string,
    publicationDate: PropTypes.string,
    parentDocument: PropTypes.string,
    pages: PropTypes.string,
    subjects: PropTypes.arrayOf(PropTypes.string),
    regions: PropTypes.arrayOf(PropTypes.string),
  }),
  entities: PropTypes.shape({
    massif: PropTypes.string,
    cave: PropTypes.string,
    entry: PropTypes.string,
  }),
};

HydratedDocumentPage.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
