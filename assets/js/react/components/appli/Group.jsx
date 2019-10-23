import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import styled from 'styled-components';
import EmailIcon from '@material-ui/icons/Email';
import LocationIcon from '@material-ui/icons/LocationOn';

import Badge from '@material-ui/core/Badge';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Translate from '../common/Translate';
import EntriesList from '../common/entry/EntriesList';

const GClogo = styled.img`
  display: inline-block;
  vertical-align: baseline;
  height: 3rem;
`;

const GroupName = styled.h1`
  display: inline-block;
  margin-right: 20px;
`;

const CaverIcon = styled.img`
  display: inline-block;
  height: 3.5rem;
  width: 3.5rem;
`;

const EntryIcon = styled.img`
  display: inline-block;
  height: 3.5rem;
  vertical-align: text-bottom;
  width: 3.5rem;
`;

const EmailIconStyled = withStyles({
  root: {
    verticalAlign: 'bottom',
  },
})(EmailIcon);

const LocationIconStyled = withStyles({
  root: {
    verticalAlign: 'bottom',
  },
})(LocationIcon);

const styles = {
  badge: {
    color: '#eee',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    padding: '1px',
  },
  root: {
    marginRight: '10px',
    verticalAlign: 'baseline',
  },
};

const Group = (props) => {
  const { isFetching, group, classes } = props;
  if (isFetching) {
    return (<CircularProgress />);
  }
  if (group) {
    let completeAddress = `${group.country} - ${group.region} - ${group.county}`;
    if (group.city) completeAddress += ` - ${group.city}`;
    else if (group.village) completeAddress += ` - ${group.village}`;
    if (group.postalCode) completeAddress += ` - ${group.postalCode}`;
    if (group.address) completeAddress += ` - ${group.address}`;

    return (
      <Card>
        <CardContent>
          <GroupName>
            {group.name}
          </GroupName>

          <Badge classes={{ badge: classes.badge, root: classes.root }} color="primary" badgeContent={group.cavers.length}>
            <CaverIcon src="/images/caver.svg" alt="Caver icon" />
          </Badge>

          <Badge classes={{ badge: classes.badge, root: classes.root }} color="primary" badgeContent={group.entries.length}>
            <EntryIcon src="/images/entry.svg" alt="Entry icon" />
          </Badge>

          <p>
            {group.yearBirth ? (
              <i>
                <Translate>Since</Translate>
                {' '}
                {group.yearBirth}
              </i>
            ) : ''}

            {group.isOfficialPartner ? (
              <span>
                {group.yearBirth ? ' - ' : ''}
                <Translate>Official partner</Translate>
                <GClogo src="/images/logoGC.png" alt="GC logo" />
              </span>
            ) : ''}
          </p>

          <div>
            <LocationIconStyled />
            {completeAddress}
          </div>

          {group.contact ? (
            <div>
              <EmailIconStyled />
              {' '}
              {group.contact}
            </div>
          ) : ''}

          <p>
            {group.customMessage}
          </p>

          <EntriesList entries={group.entries} />
        </CardContent>
      </Card>
    );
  }
  return <div />;
};

Group.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  isFetching: PropTypes.bool.isRequired,
  group: PropTypes.shape({}),
};
Group.defaultProps = {
  group: undefined,
};

export default withStyles(styles)(Group);
