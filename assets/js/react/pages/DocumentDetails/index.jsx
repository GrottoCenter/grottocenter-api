import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import { Terrain, Home } from '@material-ui/icons';
import { isNil } from 'ramda';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';

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
import { usePermissions } from '../../hooks';

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
  isValidated,
  onEdit,
}) => {
  const { formatMessage } = useIntl();
  return (
    <Wrapper>
      <Overview {...overview} loading={loading} isValidated={isValidated} onEdit={onEdit} />
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
            label: formatMessage({ id: 'Document type' }),
            value:
              details.documentType &&
              formatMessage({ id: details.documentType }),
          },
          {
            label: formatMessage({ id: 'Publication date' }),
            value: details.publicationDate,
          },
          {
            label: formatMessage({ id: 'Publication (BBS legacy)' }),
            value: details.oldPublication,
          },
          {
            label: formatMessage({ id: 'Publication number (BBS legacy)' }),
            value: details.oldPublicationFascicule,
          },
          {
            label: formatMessage({ id: 'Parent document' }),
            value: details.parentDocument,
          },
          {
            label: formatMessage({ id: 'Pages' }),
            value: details.pages,
          },
          {
            label: formatMessage({ id: 'Subjects' }),
            value: details.subjects.map((s) =>
              formatMessage({
                id: s.code,
                defaultMessage: s.subject,
              }),
            ),
            type: 'list',
          },
          {
            label: formatMessage({ id: 'Regions' }),
            value: details.regions.map((r) =>
              formatMessage({
                id: r.code,
                defaultMessage: r.name,
              }),
            ),
            type: 'list',
          },
          {
            label: formatMessage({ id: 'Author comment' }),
            value: details.authorComment,
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
            label: formatMessage({ id: 'Entrance' }),
            value: entities.entrance,
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
  const history = useHistory();
  const editPath = useRef('/ui');
  const permissions = usePermissions();
  
  useEffect(() => {
    if (!isNil(documentId)) {
      dispatch(fetchDocumentDetails(documentId));
      editPath.current = '/ui/documents/edit/'+documentId;
    }
  }, [documentId]);

  const onEdit = () => {
    if(permissions.isAuth){
      history.push(editPath.current)
    }else{
      return undefined;
    }
  }

  return (
    <DocumentPage
      overview={makeOverview(details || {})}
      organizations={makeOrganizations(details || {})}
      details={makeDetails(details || {})}
      entities={makeEntities(details || {})}
      loading={isNil(documentId) || isLoading || !isNil(error)}
      isValidated={details.modifiedDocJson === null}
      onEdit={onEdit}
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
    authorComment: PropTypes.string,
    identifier: PropTypes.string,
    bbsReference: PropTypes.string,
    documentType: PropTypes.string,
    oldPublication: PropTypes.string,
    oldPublicationFascicule: PropTypes.string,
    publicationDate: PropTypes.string,
    parentDocument: PropTypes.string,
    pages: PropTypes.string,
    subjects: PropTypes.arrayOf(
      PropTypes.shape({
        code: PropTypes.string,
        subject: PropTypes.string,
      }),
    ),
    regions: PropTypes.arrayOf(
      PropTypes.shape({
        code: PropTypes.string,
        name: PropTypes.string,
      }),
    ),
  }),
  entities: PropTypes.shape({
    massif: PropTypes.string,
    cave: PropTypes.string,
    entrance: PropTypes.string,
  }),
  isValidated: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
};

HydratedDocumentPage.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
