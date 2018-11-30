import React from 'react';
import PropTypes from 'prop-types';
import Translate from '../common/Translate';

const Group = (props) => {
  const { group } = props;
  return (
    <div>
          <h1>{group.Name}</h1>
          <p>{group.Country}{' - '}
            {group.Region}{' - '} 
            {group.County}
            {group.City ? ' - ' + group.City : (group.Village ? ' - ' + group.Village : '')}
            {group.PostalCode ? ' - ' + group.PostalCode : ''}
          </p>
          <p><b><Translate>Contact</Translate></b>: {group.Contact}</p>
          <p>
            {group.Custom_message}
          </p>
    </div>
  );
};

Group.propTypes = {
    group: PropTypes.object.isRequired,
};

export default Group;
