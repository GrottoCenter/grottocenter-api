import React from 'react';
import PropTypes from 'prop-types';
import {Marker, Popup} from 'react-leaflet';
import Button from '@material-ui/core/Button';
import ImageLoupe from '@material-ui/icons/Loupe';
import { withStyles } from '@material-ui/core/styles';
import GCLink from '../GCLink';
import { grottoDetailPath } from '../../../conf/Config';
import withContext from '../../../helpers/Routing';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const mainMarkerIcon = L.icon({
  iconUrl: '/images/gc-helmet.svg',
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

const MapGrottoMarker = ({ grotto, position }, context) => {
  const GCLinkWithContext = withContext(GCLink, context);
  const ButtonWithContext = withContext(Button, context);
  const StyledImageLoupeComponent = <StyledImageLoupe />;

  return (
    <Marker icon={mainMarkerIcon} position={position} zIndexOffset={1000}>
      <Popup autoPan={false}>
        <React.Fragment>
          <div>
            <h6>{grotto.name}</h6>
          </div>

          {grotto.id && (
            <GCLinkWithContext internal href={grottoDetailPath + grotto.id}>
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
MapGrottoMarker.contextTypes = {
  router: PropTypes.object.isRequired,
};

MapGrottoMarker.propTypes = {
  grotto: PropTypes.object.isRequired,
  position: PropTypes.object.isRequired,
};

export default MapGrottoMarker;
