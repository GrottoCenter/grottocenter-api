import React from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-leaflet';
import styled from 'styled-components';
import DescriptionIcon from '@material-ui/icons/Description';

import GCLink from '../../GCLink';
import withContext from '../../../../helpers/Routing';

const StyledTitle = styled.h5`
  text-align: center;
`;

const StyledDescriptionIcon = styled(DescriptionIcon)`
  vertical-align: middle;
`;

const MapCavesPopup = ({ cave }, context) => {
  const GCLinkWithContext = withContext(GCLink, context);

  return (
    <Popup autoPan={false}>
      <>
        <div>
          <GCLinkWithContext
            internal={false}
            href={`/ui/caves/${cave.id}`}
            target="_blank"
            style={{ verticalAlign: '' }}
          >
            <StyledTitle>
              {cave.name}
              <StyledDescriptionIcon />
            </StyledTitle>
          </GCLinkWithContext>
        </div>
      </>
    </Popup>
  );
};

// This make sure you have router in you this.context
MapCavesPopup.contextTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  router: PropTypes.object.isRequired,
};

MapCavesPopup.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  cave: PropTypes.object.isRequired,
};

export default MapCavesPopup;
