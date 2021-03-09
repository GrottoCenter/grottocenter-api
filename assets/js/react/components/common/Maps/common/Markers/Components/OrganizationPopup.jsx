import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import DescriptionIcon from '@material-ui/icons/Description';
import LocationCityIcon from '@material-ui/icons/LocationCity';
import PlaceIcon from '@material-ui/icons/Place';
import { withTheme } from '@material-ui/core';
import GCLink from '../../../../GCLink';

const StyledTitle = styled.h5`
  text-align: center;
`;

const MainDiv = styled.div`
  display: table-row;
  margin-bottom: 10px;
`;

const SubDiv = styled.div`
  display: table-cell;
  vertical-align: middle;
  padding-bottom: 10px;
  font-size: small;
`;

const StyledDescriptionIcon = styled(DescriptionIcon)`
  vertical-align: middle;
`;

const StyledPlaceIcon = withTheme(styled(PlaceIcon)`
  color: ${(props) => props.theme.palette.secondary4Color};
`);

const StyledLocationCityIcon = withTheme(styled(LocationCityIcon)`
  color: ${(props) => props.theme.palette.secondary4Color};
`);

export const OrganizationPopup = ({ organization }) => {
  const grottoDetailedPageLink = `/ui/organizations/${organization.id}`;

  return (
    <>
      <div>
        <GCLink internal={false} href={grottoDetailedPageLink} target="_blank">
          <StyledTitle>
            {organization.name}
            <StyledDescriptionIcon />
          </StyledTitle>
        </GCLink>
        {organization.address && (
          <MainDiv>
            <StyledLocationCityIcon />
            <SubDiv>{organization.address}</SubDiv>
          </MainDiv>
        )}
        <MainDiv>
          <StyledPlaceIcon />
          <SubDiv>
            {'Lat : '}
            {organization.latitude.toFixed(6)}
            <br />
            {'Lng : '}
            {organization.longitude.toFixed(6)}
          </SubDiv>
        </MainDiv>
      </div>
    </>
  );
};

OrganizationPopup.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  organization: PropTypes.object.isRequired,
};

export default OrganizationPopup;
