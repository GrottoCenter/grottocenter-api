import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { ListItem } from '@material-ui/core';

export const Icon = styled.img`
  width: 20px;
  height: 20px;
`;

export const StyledLink = styled(Link)`
  color: inherit;
  text-decoration: inherit;
`;

export const StyledListItem = styled(ListItem)`
  padding-left: ${({ theme, $nested }) => ($nested ? theme.spacing(4) : 0)}px;
`;
