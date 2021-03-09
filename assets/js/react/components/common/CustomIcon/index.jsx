import { Icon as MuiIcon } from '@material-ui/core';
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const Icon = styled(MuiIcon)`
  text-align: center;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  margin: ${({ theme, margin }) => (margin ? theme.spacing(margin) : 0)}px;
`;

const Img = styled.img`
  padding: ${({ theme }) => theme.spacing(0)}px;
`;

const CustomIcon = ({ type, size = 35, margin = '0px 4px 0px 0px' }) => (
  <Icon color="inherit" margin={margin} size={size}>
    <Img
      src={`../../../../images/iconsV3/${type}.svg`}
      alt={type}
      height={size}
      width={size}
    />
  </Icon>
);

CustomIcon.propTypes = {
  type: PropTypes.oneOf([
    'entry',
    'depth',
    'length',
    'cave_system',
    'bibliography',
  ]).isRequired,
  size: PropTypes.number,
  margin: PropTypes.number,
};

export default CustomIcon;
