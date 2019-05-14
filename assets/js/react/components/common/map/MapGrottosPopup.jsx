import React from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-leaflet';
import styled from 'styled-components';
import DescriptionIcon from '@material-ui/icons/Description';
import GCLink from '../GCLink';
import { detailPageV2Links } from '../../../conf/Config';
import withContext from '../../../helpers/Routing';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const ImageElement = styled.img`
  width: 30px;
  vertical-align: middle;
  margin-right: 10px;
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

//
//
// M A I N - C O M P O N E N T
//
//

const MapGrottosPopup = ({ grotto }, context) => {
  const GCLinkWithContext = withContext(GCLink, context);

  const externalLinkEntry = `${(detailPageV2Links[locale] !== undefined) ? detailPageV2Links[locale] : detailPageV2Links['*']}&category=grotto&id=${grotto.id}}`; //eslint-disable-line

  return (
    <Popup autoPan={false}>
      <React.Fragment>
        <div>
          <GCLinkWithContext internal={false} href={externalLinkEntry} target="_blank">
            <h5 style={{ textAlign: 'center' }}>
              {grotto.name}
              <DescriptionIcon style={{ verticalAlign: 'middle' }} />
            </h5>
          </GCLinkWithContext>

          {grotto.address
          && (
          <MainDiv>
            <ImageElement src="../../../../../images/localisation.svg" alt="" />
            <SubDiv>{grotto.address}</SubDiv>
          </MainDiv>
          )}

          <MainDiv>
            <ImageElement src="../../../../../images/map-coordinates.svg" alt="" />
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
