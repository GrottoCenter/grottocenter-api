import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import styled from 'styled-components';
import EmailIcon from '@material-ui/icons/Email';
import Translate from '../common/Translate';

const GroupIcon = styled.img`
  display: inline-block;
  margin-right: 10px;
  vertical-align: baseline;
  width: 3rem;
`;

const GClogo = styled.img`
  display: inline-block;
  vertical-align: baseline;
  height: 3rem;
`;

const GroupName = styled.h1`
  display: inline-block;
`;

const EmailIconStyled = withStyles({
  root: {
    verticalAlign: 'bottom',
  },
})(EmailIcon);

const Group = (props) => {
  const { isFetching, group } = props;
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
      <div>
        <GroupIcon src="../../../../images/club.svg" alt="Club icon" />
        <GroupName>
          {group.name}
        </GroupName>
        <p>
          {group.yearBirth ? (
            <i>
              <Translate>Since</Translate>
              {' '}
              {group.yearBirth}
            </i>
          ) : ''}

          {group.Is_official_partner ? (
            <span>
              {group.yearBirth ? ' - ' : ''}
              <Translate>Official partner</Translate>
              {' '}
              <GClogo src="../../../../images/logoGC.png" alt="GC logo" />
            </span>
          ) : ''}
        </p>

        <div>
          {completeAddress}
        </div>

        {group.contact ? (
          <div>
            <EmailIconStyled />
            <b>
              <Translate>Contact</Translate>
            </b>
          :
            {' '}
            {group.contact}
          </div>
        ) : ''}

        <div>
          {group.customMessage}
        </div>
      </div>
    );
  }
  return <div />;
};

Group.propTypes = {
  isFetching: PropTypes.bool.isRequired,
  group: PropTypes.object,
};
Group.defaultProps = {
  group: undefined,
};

export default Group;
