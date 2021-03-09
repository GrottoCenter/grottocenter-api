import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { isNil } from 'ramda';
import {
  Card as MuiCard,
  CardActions,
  CardContent,
  CardHeader,
  IconButton as MuiIconButton,
  Typography,
} from '@material-ui/core';
import CreateIcon from '@material-ui/icons/Create';

const Card = styled(MuiCard)`
  overflow: inherit;
  margin: ${({ theme }) => theme.spacing(2)}px;
`;

const IconButton = styled(MuiIconButton)`
  margin-left: auto;
`;

const Title = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ScrollableContent = ({ title, icon, onEdit, content, footer }) => {
  return (
    <Card>
      <CardHeader
        title={
          <Title>
            <Typography variant="h1" color="secondary">
              {title}
            </Typography>
            {!isNil(icon) && icon}
          </Title>
        }
      />
      <CardContent>{content}</CardContent>
      <CardActions disableSpacing>
        <Typography variant="caption" align="right">
          {footer}
        </Typography>
        <IconButton
          size="small"
          aria-label="edit"
          disabled={isNil(onEdit)}
          onClick={onEdit}
        >
          <CreateIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

ScrollableContent.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node,
  onEdit: PropTypes.func,
  content: PropTypes.node.isRequired,
  footer: PropTypes.string,
};

export default ScrollableContent;
