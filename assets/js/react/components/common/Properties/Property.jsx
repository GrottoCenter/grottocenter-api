import { isNil } from 'ramda';
import { Tooltip, Typography } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

export const StyledTypography = styled(Typography)`
  margin-left: ${({ theme, variant }) =>
    variant === 'caption' && theme.spacing(2)}px;
`;

export const PropertyWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing(1)}px;
  & > svg {
    margin-right: ${({ theme }) => theme.spacing(1)}px;
  }
`;

// Doesn't work properly with SRR (renderToString)
const TooltipWrapper = ({ label, children }) => (
  <div>
    {label ? (
      <Tooltip title={label}>{children}</Tooltip>
    ) : (
      <div>{children}</div>
    )}
  </div>
);

const Property = ({
  loading = false,
  label,
  value,
  icon,
  secondary = false,
}) => (
  <PropertyWrapper>
    {!isNil(icon) && icon}
    <TooltipWrapper title={label}>
      {loading ? (
        <Skeleton variant="text" width="100%" />
      ) : (
        <StyledTypography variant={secondary ? 'caption' : 'body1'}>
          {value || ''}
        </StyledTypography>
      )}
    </TooltipWrapper>
  </PropertyWrapper>
);

TooltipWrapper.propTypes = {
  label: PropTypes.string,
};

Property.propTypes = {
  loading: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  // eslint-disable-next-line react/forbid-prop-types
  icon: PropTypes.object,
  secondary: PropTypes.bool,
  ...TooltipWrapper.propTypes,
};

export default Property;
