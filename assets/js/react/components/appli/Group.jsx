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

const Group = ({ isFetching, group }) => {
  const safeGet = pathOr('N/A', __, group || {});
  const { formatMessage } = useIntl();

  if (isNil(group) && !isFetching) {
    return (
      <Translate>
        Error, the group data you are looking for is not available.
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
                  badgeContent={!isNil(group.cavers) ? group.cavers.length : 0}
                >
                  <CaverIcon src="/images/caver.svg" alt="Caver icon" />
                </StyledBadge>

                <StyledBadge
                  color="primary"
                  badgeContent={group.exploredCaves.length}
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
                {group.yearBirth &&
                  `${formatMessage({ id: 'Since' })} ${group.yearBirth}`}
                {group.yearBirth && group.isOfficialPartner && ` - `}
                {group.isOfficialPartner && (
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
                {!isNil(group.city) && ` - ${group.city}`}
                {!isNil(group.village) && ` - ${group.village}`}
                {!isNil(group.postalCode) && ` - ${group.postalCode}`}
                {!isNil(group.address) && ` - ${group.address}`}
              </Typography>
            </ContentWrapper>

            {group.mail && (
              <ContentWrapper>
                <StyledEmailIcon color="primary" />
                <Typography>{group.mail}</Typography>
              </ContentWrapper>
            )}

            <ContentWrapper>
              <Typography>{group.customMessage}</Typography>
            </ContentWrapper>

            <hr />
            <CavesList
              caves={group.exploredCaves}
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
              caves={group.partneredCaves}
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

Group.propTypes = {
  // TODO : mark some properties as required + add details for the "any""
  classes: PropTypes.shape({
    root: PropTypes.any,
    badge: PropTypes.any,
  }).isRequired,
  isFetching: PropTypes.bool.isRequired,
  group: PropTypes.shape({
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

Group.defaultProps = {
  group: undefined,
};

export default Group;
