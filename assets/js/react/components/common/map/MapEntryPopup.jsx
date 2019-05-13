import React from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-leaflet';
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

const MapEntryPopup = ({ entry }, context) => {
  const GCLinkWithContext = withContext(GCLink, context);
  const ButtonWithContext = withContext(Button, context);
  const StyledImageLoupeComponent = <StyledImageLoupe />;

  const externalLink = `${(detailPageV2Links[locale] !== undefined) ? detailPageV2Links[locale] : detailPageV2Links['*']}&category=entry&id=${entry.id}}`; //eslint-disable-line

  return (
    <Popup autoPan={false}>
      <React.Fragment>
        <div>
          <GCLinkWithContext internal={false} href={externalLink} target="_blank" /*href={entryDetailPath + entry.id}*/>
            <h6>{entry.name}</h6>
          </GCLinkWithContext>
          <div>
            {entry.city}
            {' '}
            (
            {entry.region}
            )
          </div>
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
