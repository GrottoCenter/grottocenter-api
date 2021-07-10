import React from 'react';
import { isNil } from 'ramda';
import { useIntl } from 'react-intl';
import { Tooltip, Fab } from '@material-ui/core';
import { Share, Print, GpsFixed, Map } from '@material-ui/icons';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import ReactToPrint from 'react-to-print';
import { isMobile } from 'react-device-detect';
import grey from '@material-ui/core/colors/grey';

const Wrapper = styled.div`
  position: sticky;
  top: ${({ theme }) => theme.appBarHeight}px;
  display: flex;
  flex-wrap: wrap;
  flex-direction: ${!isMobile && 'row-reverse'};
  justify-content: ${isMobile && 'space-between'};
  //over leaflet
  z-index: 1001;
  @media print {
    display: none;
  }
`;

const StyledFab = styled(Fab)`
  margin: ${({ theme }) => theme.spacing(2)}px;
  :disabled {
    background-color: ${grey[100]};
  }
`;

const ActionButton = ({ Icon, label, onClick }) => {
  const { formatMessage } = useIntl();
  const tooltipMessage = isNil(onClick)
    ? formatMessage({ id: 'disabled' })
    : label;

  return (
    <Tooltip title={tooltipMessage}>
      <span>
        <StyledFab
          aria-label={label}
          size="small"
          disabled={isNil(onClick)}
          onClick={onClick}
        >
          {Icon}
        </StyledFab>
      </span>
    </Tooltip>
  );
};

const ActionBar = ({ printRef }) => {
  const { formatMessage } = useIntl();

  return (
    <Wrapper>
      <ReactToPrint
        trigger={() => (
          <ActionButton
            Icon={<Print fontSize={isMobile ? 'small' : 'default'} />}
            label={formatMessage({ id: 'Print' })}
          />
        )}
        content={() => printRef.current}
      />
      <ActionButton
        Icon={
          <Share fontSize={isMobile ? 'small' : 'default'} color="inherit" />
        }
        label={formatMessage({ id: 'Share' })}
      />
      <ActionButton
        Icon={<GpsFixed fontSize={isMobile ? 'small' : 'default'} />}
        label={formatMessage({ id: 'GeoHack' })}
      />
      <ActionButton
        Icon={<Map fontSize={isMobile ? 'small' : 'default'} />}
        label={formatMessage({ id: 'Map' })}
      />
    </Wrapper>
  );
};

ActionButton.propTypes = {
  Icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

ActionBar.propTypes = {
  printRef: PropTypes.shape({
    // eslint-disable-next-line react/forbid-prop-types
    current: PropTypes.any,
  }).isRequired,
};

export default ActionBar;
