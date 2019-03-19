import React from 'react';
import PropTypes from 'prop-types';
import {Marker, Popup} from 'react-leaflet';
import Button from '@material-ui/core/Button';
import ImageLoupe from '@material-ui/icons/Loupe';
import { withStyles } from '@material-ui/core/styles';
import GCLink from '../GCLink';
import { entryDetailPath, detailPageV2Links } from '../../../conf/Config';
import withContext from '../../../helpers/Routing';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const mainMarkerIcon = L.icon({
  iconUrl: '/images/gc-entry.svg',
  iconSize: [
    48, 48,
  ],
  iconAnchor: [
    16, 32,
  ],
  popupAnchor: [0, -32],
});

const StyledImageLoupe = withStyles(theme => ({
  root: {
    fill: theme.palette.accent1Color,
  },
}), { withTheme: true })(ImageLoupe);

//
//
// M A I N - C O M P O N E N T
//
//

const MapEntryMarker = ({ entry, position }, context) => {
  const GCLinkWithContext = withContext(GCLink, context);
  const ButtonWithContext = withContext(Button, context);
  const StyledImageLoupeComponent = <StyledImageLoupe />;

  const externalLink = `${(detailPageV2Links[locale] !== undefined) ? detailPageV2Links[locale] : detailPageV2Links['*']}&category=entry&id=${entry.id}`; //eslint-disable-line

  return (
    <Marker icon={mainMarkerIcon} position={position} zIndexOffset={1000}>
      <Popup autoPan={false}>
        <React.Fragment>
          <div>
            <h6>{entry.name}</h6>
            <div>
              {entry.city}
              {' '}
              (
              {entry.region}
              )
            </div>
          </div>

          {entry.id && (
            <GCLinkWithContext internal={false} href={externalLink} target="_blank" /*href={entryDetailPath + entry.id}*/>
              <ButtonWithContext variant="text">
                {StyledImageLoupeComponent}
              </ButtonWithContext>
            </GCLinkWithContext>
          )}
        </React.Fragment>
      </Popup>
    </Marker>
  );
};

// This make sure you have router in you this.context
MapEntryMarker.contextTypes = {
  router: PropTypes.object.isRequired,
};

MapEntryMarker.propTypes = {
  entry: PropTypes.object.isRequired,
  position: PropTypes.object.isRequired,
};

export default MapEntryMarker;
