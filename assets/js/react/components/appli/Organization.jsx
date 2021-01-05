import React from 'react';
import PropTypes from 'prop-types';
import { pathOr, __, isNil } from 'ramda';
import {
  CircularProgress,
  Badge,
  Card,
  CardContent,
  CardHeader,
  Typography,
} from '@material-ui/core';
import styled from 'styled-components';
import EmailIcon from '@material-ui/icons/Email';
import LocationIcon from '@material-ui/icons/LocationOn';
import { useIntl } from 'react-intl';

import CavesList from '../common/cave/CavesList';
import Translate from '../common/Translate';

const CaverIcon = styled.img`
  display: inline-block;
  height: 4rem;
  width: 4rem;
`;

const EntryIcon = styled.img`
  display: inline-block;
  height: 4rem;
  vertical-align: text-bottom;
  width: 4rem;
`;

const StyledBadge = styled(Badge)`
  color: #eee;
  font-size: 1.5rem;
  font-weight: bold;
  padding: 1px;
`;

const ContentWrapper = styled.div`
  display: flex;
  padding: ${({ theme }) => theme.spacing(1)}px;
`;

const StyledLocationIcon = styled(LocationIcon)`
  margin-right: ${({ theme }) => theme.spacing(1)}px;
`;

const StyledEmailIcon = styled(EmailIcon)`
  margin-right: ${({ theme }) => theme.spacing(1)}px;
`;

const Organization = ({ isFetching, organization }) => {
  const safeGet = pathOr('N/A', __, organization || {});
  const { formatMessage } = useIntl();

  if (isNil(organization) && !isFetching) {
    return (
      <Translate>
        Error, the organization data you are looking for is not available.
      </Translate>
    );
  }

  return (
    <>
      {isFetching ? (
        <CircularProgress />
      ) : (
        <Card>
          <CardHeader
            avatar={
              <>
                <StyledBadge
                  color="primary"
                  badgeContent={
                    !isNil(organization.cavers) ? organization.cavers.length : 0
                  }
                >
                  <CaverIcon src="/images/caver.svg" alt="Caver icon" />
                </StyledBadge>

                <StyledBadge
                  color="primary"
                  badgeContent={organization.exploredCaves.length}
                >
                  <EntryIcon src="/images/entry-cluster.svg" alt="Cave icon" />
                </StyledBadge>
              </>
            }
            title={
              <Typography variant="h1" color="secondary">
                {safeGet(['name'])}
              </Typography>
            }
            subheader={
              <>
                {organization.yearBirth &&
                  `${formatMessage({ id: 'Since' })} ${organization.yearBirth}`}
                {organization.yearBirth &&
                  organization.isOfficialPartner &&
                  ` - `}
                {organization.isOfficialPartner && (
                  <>{formatMessage({ id: 'Official partner' })}</>
                )}
              </>
            }
          />
          <CardContent>
            <ContentWrapper>
              <StyledLocationIcon color="primary" />
              <Typography>
                {`${safeGet(['country'])} - ${safeGet(['region'])} - ${safeGet([
                  'county',
                ])}`}
                {!isNil(organization.city) && ` - ${organization.city}`}
                {!isNil(organization.village) && ` - ${organization.village}`}
                {!isNil(organization.postalCode) &&
                  ` - ${organization.postalCode}`}
                {!isNil(organization.address) && ` - ${organization.address}`}
              </Typography>
            </ContentWrapper>

            {organization.mail && (
              <ContentWrapper>
                <StyledEmailIcon color="primary" />
                <Typography>{organization.mail}</Typography>
              </ContentWrapper>
            )}

            <ContentWrapper>
              <Typography>{organization.customMessage}</Typography>
            </ContentWrapper>

            <hr />
            <CavesList
              caves={organization.exploredCaves}
              title={
                <strong>
                  <Translate>Explored caves</Translate>
                </strong>
              }
              emptyMessageComponent={
                <Translate>No explored caves found.</Translate>
              }
            />
            <hr />
            <CavesList
              caves={organization.partneredCaves}
              title={
                <strong>
                  <Translate>Partnered caves</Translate>
                </strong>
              }
              emptyMessageComponent={
                <Translate>No partnered caves found.</Translate>
              }
            />
          </CardContent>
        </Card>
      )}
    </>
  );
};

Organization.propTypes = {
  // TODO : mark some properties as required + add details for the "any""
  classes: PropTypes.shape({
    root: PropTypes.any,
    badge: PropTypes.any,
  }).isRequired,
  isFetching: PropTypes.bool.isRequired,
  organization: PropTypes.shape({
    address: PropTypes.string,
    mail: PropTypes.string,
    customMessage: PropTypes.string,
    city: PropTypes.string,
    country: PropTypes.string,
    county: PropTypes.string,
    isOfficialPartner: PropTypes.bool,
    name: PropTypes.string,
    region: PropTypes.string,
    postalCode: PropTypes.string,
    village: PropTypes.string,
    exploredCaves: PropTypes.arrayOf(PropTypes.any),
    partneredCaves: PropTypes.arrayOf(PropTypes.any),
    cavers: PropTypes.any,
    yearBirth: PropTypes.any,
  }),
};

Organization.defaultProps = {
  organization: undefined,
};

export default Organization;
