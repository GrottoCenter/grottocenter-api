import React from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-leaflet';
import styled from 'styled-components';
import DescriptionIcon from '@material-ui/icons/Description';
import LocationCityIcon from '@material-ui/icons/LocationCity';
import PlaceIcon from '@material-ui/icons/Place';
import { withTheme } from '@material-ui/core';
import GCLink from '../GCLink';
import { detailPageV2Links } from '../../../conf/Config';
import withContext from '../../../helpers/Routing';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

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

const StyledPlaceIcon = withTheme()(styled(PlaceIcon)`
  color: ${props => props.theme.palette.secondary4Color};
`);

const StyledLocationCityIcon = withTheme()(styled(LocationCityIcon)`
  color: ${props => props.theme.palette.secondary4Color};
`);

//
//
// M A I N - C O M P O N E N T
//
//

const MapGrottosPopup = ({ grotto }, context) => {
  const GCLinkWithContext = withContext(GCLink, context);

  const externalLinkEntry = `${(detailPageV2Links[locale] !== undefined) ? detailPageV2Links[locale] : detailPageV2Links['*']}&category=grotto&id=${grotto.id}}`;

  return (
    <Popup autoPan={false}>
      <React.Fragment>
        <div>
          <GCLinkWithContext internal={false} href={externalLinkEntry} target="_blank">
            <StyledTitle>
              {grotto.name}
              <StyledDescriptionIcon />
            </StyledTitle>
          </GCLinkWithContext>

          {grotto.address
          && (
            <MainDiv>
              <StyledLocationCityIcon />
              <SubDiv>
                {grotto.address}
              </SubDiv>
            </MainDiv>
          )}

          <MainDiv>
            <StyledPlaceIcon />
            <SubDiv>
              {'Lat : '}
              {grotto.latitude.toFixed(6)}
              <br />
              {'Lng : '}
              {grotto.longitude.toFixed(6)}
            </SubDiv>
          </MainDiv>
        </div>
      </React.Fragment>
    </Popup>
  );
};

// This make sure you have router in you this.context
MapGrottosPopup.contextTypes = {
  router: PropTypes.object.isRequired,
};

MapGrottosPopup.propTypes = {
  grotto: PropTypes.object.isRequired,
};

export default MapGrottosPopup;
