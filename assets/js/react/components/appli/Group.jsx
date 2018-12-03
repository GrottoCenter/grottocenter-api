import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
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
  const { group } = props;

  let completeAddress = `${group.Country} - ${group.Region} - ${group.County}`;
  if (group.City) completeAddress += ` - ${group.City}`;
  else if (group.Village) completeAddress += ` - ${group.Village}`;
  if (group.PostalCode) completeAddress += ` - ${group.PostalCode}`;
  if (group.Address) completeAddress += ` - ${group.Address}`;

  const result = (
    <div>
      <GroupIcon src="../../../../images/club.svg" alt="Club icon" />
      <GroupName>
        {group.Name}
      </GroupName>
      <p>
        {group.Year_birth ? (
          <i>
            <Translate>Since</Translate>
            {' '}
            {group.Year_birth}
          </i>
        ) : ''}

        {group.Is_official_partner ? (
          <span>
            {group.Year_birth ? ' - ' : ''}
            <Translate>Official partner</Translate>
            {' '}
            <GClogo src="../../../../images/logoGC.png" alt="GC logo" />
          </span>
        ) : ''}
      </p>

      <div>
        {completeAddress}
      </div>

      {group.Contact ? (
        <div>
          <EmailIconStyled />
          <b>
            <Translate>Contact</Translate>
          </b>
        :
          {' '}
          {group.Contact}
        </div>
      ) : ''}

      <div>
        {group.Custom_message}
      </div>
    </div>
  );
  return result;
};

Group.propTypes = {
  group: PropTypes.object.isRequired,
};

export default Group;
