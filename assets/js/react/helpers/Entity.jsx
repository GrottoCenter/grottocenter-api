import React from 'react';
import styled from 'styled-components';

//
//
// H E L P E R - F U N C T I O N S
//
//

export const isMappable = entry => entry.latitude && entry.longitude;

const EntryIcon = styled.img`
  height: 30px;
  margin-right: 10px;
  width: 30px;
`;

const GroupIcon = styled.img`
  height: 30px;
  margin-right: 10px;
  width: 30px;
`;

export const entityOptionForSelector = option => (
  <React.Fragment>
    {option.type === 'entry' || option.type === 'cave' ? <EntryIcon src="../../../../images/entry.svg" alt="Entry icon" /> : ''}
    {option.type === 'grotto' ? <GroupIcon src="../../../../images/club.svg" alt="Group icon" /> : '' }

    {option.label}
  </React.Fragment>
);
