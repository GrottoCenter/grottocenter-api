import React from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-leaflet';
import styled from 'styled-components';
import DescriptionIcon from '@material-ui/icons/Description';
import GCLink from '../../GCLink';
import { detailPageV2Links } from '../../../../conf/Config';
import withContext from '../../../../helpers/Routing';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const StyledTitle = styled.h5`
  text-align: center;
`;

const StyledDescriptionIcon = styled(DescriptionIcon)`
  vertical-align: middle;
`;

//
//
// M A I N - C O M P O N E N T
//
//

const MapCavesPopup = ({ cave }, context) => {
  const GCLinkWithContext = withContext(GCLink, context);

  const externalLinkEntry = `${
    detailPageV2Links[locale] !== undefined ? detailPageV2Links[locale] : detailPageV2Links['*']
  }&category=cave&id=${cave.id}}`; //eslint-disable-line

  return (
    <Popup autoPan={false}>
      <React.Fragment>
        <div>
          <GCLinkWithContext internal={false} href={externalLinkEntry} target="_blank">
            <StyledTitle>
              {cave.name}
              <StyledDescriptionIcon />
            </StyledTitle>
          </GCLinkWithContext>
        </div>
      </React.Fragment>
    </Popup>
  );
};

// This make sure you have router in you this.context
MapCavesPopup.contextTypes = {
  router: PropTypes.object.isRequired,
};

MapCavesPopup.propTypes = {
  cave: PropTypes.object.isRequired,
};

export default MapCavesPopup;
