import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import {
  Typography,
  Card as MuiCard,
  CardActions as MuiCardActions,
  IconButton as MuiIconButton,
  CardContent as MuiCardContent,
  CardHeader,
} from '@material-ui/core';
import styled from 'styled-components';
import CreateIcon from '@material-ui/icons/Create';

const Card = styled(MuiCard)`
  margin: ${({ theme }) => theme.spacing(2)}px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
`;

const CardContent = styled(MuiCardContent)`
  flex-grow: 1;
`;

const CardActions = styled(MuiCardActions)`
  display: flex;
`;

const Title = styled.div`
  display: flex;
  justify-content: space-between;
`;

const IconButton = styled(MuiIconButton)`
  margin-left: auto;
`;

const FixedContent = ({ title, icon, content, footer, onEdit }) => {
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
        <Typography variant="caption">{footer}</Typography>
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

FixedContent.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node,
  content: PropTypes.node.isRequired,
  footer: PropTypes.string.isRequired,
  onEdit: PropTypes.func,
};

export default FixedContent;
