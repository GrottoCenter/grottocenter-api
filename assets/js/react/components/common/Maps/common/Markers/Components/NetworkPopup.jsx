import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import DescriptionIcon from '@material-ui/icons/Description';

import GCLink from '../../../../GCLink';
import withContext from '../../../../../../helpers/Routing';

const StyledTitle = styled.h5`
  text-align: center;
`;

const StyledDescriptionIcon = styled(DescriptionIcon)`
  vertical-align: middle;
`;

export const NetworkPopup = ({ network }, context) => {
  const GCLinkWithContext = withContext(GCLink, context);

  return (
    <>
      <div>
        <GCLinkWithContext
          internal={false}
          href={`/ui/caves/${network.id}`}
          target="_blank"
          style={{ verticalAlign: '' }}
        >
          <StyledTitle>
            {network.name}
            <StyledDescriptionIcon />
          </StyledTitle>
        </GCLinkWithContext>
      </div>
    </>
  );
};

// This make sure you have router in you this.context
NetworkPopup.contextTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  router: PropTypes.object.isRequired,
};

NetworkPopup.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  network: PropTypes.object.isRequired,
};

export default NetworkPopup;
