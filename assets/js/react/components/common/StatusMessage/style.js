import { Typography } from '@material-ui/core';
import styled from 'styled-components';

export default styled(Typography)`
  ${({ theme }) => `
    border-radius: ${theme.shape.borderRadius};
    color: ${theme.palette.common.white};
    margin: ${theme.spacing(0)}px 0;
    padding: ${theme.spacing(2)}px;
  `}
`;
