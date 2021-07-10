import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Button as MuiButton } from '@material-ui/core';
import ConvertIcon from '@material-ui/icons/Transform';
import { useIntl } from 'react-intl';
import { anyPass, isEmpty, isNil } from 'ramda';
import { useFullScreen } from 'react-browser-hooks';
import CustomControl, { customControlProps } from '../CustomControl';
import StandardDialog from '../../../StandardDialog';
import Convert from './Convert';

const Wrapper = styled.div`
  background: white;
`;

const Button = styled(MuiButton)`
  background-color: white;
`;

const isNilOrEmpty = anyPass([isNil, isEmpty]);

const ConverterControl = ({
  position = 'bottomleft',
  projectionsList = [],
  ...props
}) => {
  const { fullScreen } = useFullScreen();
  const { formatMessage } = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <CustomControl position={position} {...props}>
      <Wrapper>
        <Button
          aria-label="data-control"
          onClick={handleOpenMenu}
          startIcon={<ConvertIcon fontSize="inherit" />}
          // TODO enable on fullscreen as it's currently hidden
          disabled={fullScreen || isNilOrEmpty(projectionsList)}
        >
          {formatMessage({ id: 'Converter' })}
        </Button>
      </Wrapper>
      {!isNilOrEmpty(projectionsList) && (
        <StandardDialog
          title={formatMessage({ id: 'Converter' })}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <Convert list={projectionsList} />
        </StandardDialog>
      )}
    </CustomControl>
  );
};

ConverterControl.propTypes = {
  ...customControlProps,
  projectionsList: PropTypes.arrayOf(PropTypes.shape({})),
};

export default ConverterControl;
