import React from 'react';
import { isNil } from 'ramda';
import { useIntl } from 'react-intl';
import { Tooltip, IconButton } from '@material-ui/core';
import { Share, Print, GpsFixed, Map } from '@material-ui/icons';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import ReactToPrint from 'react-to-print';
import { isMobile } from 'react-device-detect';

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.palette.backgroundColor};
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

const ActionButton = ({ Icon, label, onClick }) => {
  const { formatMessage } = useIntl();
  const tooltipMessage = isNil(onClick)
    ? formatMessage({ id: 'disabled' })
    : label;

  return (
    <Tooltip title={tooltipMessage}>
      <span>
        <IconButton disabled={isNil(onClick)} onClick={onClick}>
          {Icon}
        </IconButton>
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
  // eslint-disable-next-line react/forbid-prop-types
  printRef: PropTypes.any.isRequired,
};

export default ActionBar;
