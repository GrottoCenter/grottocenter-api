import React from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-leaflet';
import styled from 'styled-components';
import DescriptionIcon from '@material-ui/icons/Description';
import LocationCityIcon from '@material-ui/icons/LocationCity';
import PlaceIcon from '@material-ui/icons/Place';
import { withTheme } from '@material-ui/core/styles';
import GCLink from '../../GCLink';
import { detailPageV2Links } from '../../../../conf/Config';
import withContext from '../../../../helpers/Routing';
import Translate from '../../Translate';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const StyledTitle = styled.h5`
  text-align: center;
`;

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

const Info = styled.span`
  font-weight: 500;
  font-size: medium;
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

//
//
// M A I N - C O M P O N E N T
//
//

const MapEntryPopup = ({ entry }, context) => {
  const GCLinkWithContext = withContext(GCLink, context);

  return (
    <Popup autoPan={false}>
      <React.Fragment>
        <div>
          <GCLinkWithContext
            internal={false}
            href={`/ui/entries/${entry.id}`}
            target="_blank"
            style={{ verticalAlign: '' }}
          >
            <StyledTitle>
              {entry.name}
              <StyledDescriptionIcon />
            </StyledTitle>
          </GCLinkWithContext>

          <MainDiv>
            <StyledLocationCityIcon />
            <SubDiv>
              {entry.city}
              <br />
              {entry.region && entry.region}
            </SubDiv>
          </MainDiv>

          <MainDiv>
            <StyledPlaceIcon />
            <SubDiv>
              {'Lat : '}
              {entry.latitude.toFixed(6)}
              <br />
              {'Lng : '}
              {entry.longitude.toFixed(6)}
            </SubDiv>
          </MainDiv>

          {entry.cave && entry.cave.name && (
            <MainDiv>
              <ImageElement
                src="../../../../../images/entry-cluster.svg"
                alt=""
              />
              <SubDiv>
                <Translate>Caves</Translate>
                {' : '}
                <Info>
                  <span>{entry.cave.name}</span>
                </Info>
              </SubDiv>
            </MainDiv>
          )}

          {entry.cave && entry.cave.depth && (
            <div>
              <ImageElement src="../../../../../images/depth.svg" alt="" />
              <Translate>Depth</Translate>
              {' : '}
              <Info>
                {entry.cave.depth}
                {' m'}
              </Info>
            </div>
          )}

          {entry.cave && entry.cave.length && (
            <div>
              <ImageElement src="../../../../../images/length.svg" alt="" />
              <Translate>Length</Translate>
              {' : '}
              <Info>
                {entry.cave.length}
                {' m'}
              </Info>
            </div>
          )}
        </div>
      </React.Fragment>
    </Popup>
  );
};

// This make sure you have router in you this.context
MapEntryPopup.contextTypes = {
  router: PropTypes.object.isRequired,
};

MapEntryPopup.propTypes = {
  entry: PropTypes.object.isRequired,
};

export default MapEntryPopup;
