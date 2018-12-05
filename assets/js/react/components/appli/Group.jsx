import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import styled from 'styled-components';
import EmailIcon from '@material-ui/icons/Email';
import Translate from '../common/Translate';
import EntriesList from '../common/entry/EntriesList';

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
  margin-right: 20px;
`;

const CaverIcon = styled.img`
  display: inline-block;
  margin-right: 10px;
  vertical-align: text-bottom;
  width: 3rem;
`;

const EntryIcon = styled.img`
  display: inline-block;
  vertical-align: text-bottom;
  width: 3rem;
`;

const GroupCaversNb = styled.span`
  font-size: 3rem;
`;

const GroupEntriesNb = styled.span`
  font-size: 3rem;
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
        <GroupCaversNb>
          {group.cavers.length}
        </GroupCaversNb>
        <CaverIcon src="../../../../images/caver.svg" alt="Caver icon" />
        <GroupEntriesNb>
          {group.entries.length}
        </GroupEntriesNb>
        <EntryIcon src="../../../../images/entry.svg" alt="Entry icon" />
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

        <p>
          {group.customMessage}
        </p>

        <EntriesList entries={group.entries} />

      </div>
    );
  }
  return <div />;
};

Group.propTypes = {
  isFetching: PropTypes.bool.isRequired,
  group: PropTypes.shape({}),
};
Group.defaultProps = {
  group: undefined,
};

export default Group;
