import React, {PropTypes} from 'react';
import { GridContainer } from "../common/Grid";
import Translate from '../common/Translate';

const Group = (props) => {
  const { group } = props;
  return (
    <GridContainer>
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
          
    </GridContainer>
  );
};

Group.propTypes = {
    group: PropTypes.object.isRequired,
};

export default Group;
