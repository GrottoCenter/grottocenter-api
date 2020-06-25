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

import EntriesList from '../common/entry/EntriesList';

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

  return (
    <>
      {isFetching || isNil(group) ? (
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
                  badgeContent={group.entries.length}
                >
                  <EntryIcon src="/images/entry.svg" alt="Entry icon" />
                </StyledBadge>
              </>
            }
            title={
              <Typography variant="h5" color="secondary">
                {safeGet(['name'])}
              </Typography>
            }
            subheader={
              <>
                {group.yearBirth &&
                  `${formatMessage({ id: 'Since' })} - ${group.yearBirth} -`}
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

            {group.contact && (
              <ContentWrapper>
                <StyledEmailIcon color="primary" />
                <Typography>{group.contact}</Typography>
              </ContentWrapper>
            )}

            <ContentWrapper>
              <Typography>{group.customMessage}</Typography>
            </ContentWrapper>

            <EntriesList entries={group.entries} />
          </CardContent>
        </Card>
      )}
    </>
  );
};

Group.propTypes = {
  isFetching: PropTypes.bool.isRequired,
  group:
    PropTypes.shape({
      customMessage: PropTypes.string,
      entries: PropTypes.arrayOf(PropTypes.object),
      postalCode: PropTypes.string,
      address: PropTypes.string,
      village: PropTypes.string,
      city: PropTypes.string,
      isOfficialPartner: PropTypes.bool,
      yearBirth: PropTypes.string,
      cavers: PropTypes.arrayOf(PropTypes.object),
      name: PropTypes.string,
      contact: PropTypes.string,
    }) || undefined,
};

Group.defaultProps = {
  group: undefined,
};

export default Group;
