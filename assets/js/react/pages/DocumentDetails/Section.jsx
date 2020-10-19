import {
  Card,
  CardContent as MuiCardContent,
  Typography,
  List,
  ListItem,
} from '@material-ui/core';
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { isNil, is } from 'ramda';
import { Skeleton, TreeItem, TreeView } from '@material-ui/lab';
import { ExpandMore, ChevronRight } from '@material-ui/icons';
import { isMobileOnly } from 'react-device-detect';

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 35px;
  margin: 0 ${({ theme }) => theme.spacing(3)}px;
`;

const CardContent = styled(MuiCardContent)`
  display: flex;
  flex-direction: column;
`;

const Text = styled(Typography)`
  margin-left: auto;
`;

const Label = styled(Typography)`
  text-transform: uppercase;
`;

const IconContainer = styled.div`
  min-width: ${isMobileOnly ? '0' : '15%'};
  display: flex;
  justify-content: center;
`;

const isArray = is(Array);
const isString = is(String);

const Item = ({ Icon, label, value, type }) => (
  <Wrapper>
    <IconContainer>{!isNil(Icon) && <Icon />}</IconContainer>
    <Label color="textSecondary" variant="caption">
      {`${label}: `}&nbsp;
    </Label>
    {type === 'tree' && isArray(value) && (
      <TreeView
        defaultCollapseIcon={<ExpandMore />}
        defaultExpandIcon={<ChevronRight />}
      >
        <TreeItem nodeId="1" label="test" />
      </TreeView>
    )}
    {type === 'area' && isArray(value) && (
      <List>
        {value.map((item) => (
          <ListItem key={item} primary={item} />
        ))}
      </List>
    )}
    {isString(value) && <Text>{value}</Text>}
  </Wrapper>
);

const Section = ({ title, content, loading }) => {
  return (
    <Card>
      <CardContent>
        <Typography color="textSecondary" variant="h6" gutterBottom>
          {title}
        </Typography>
        {loading ? (
          <Skeleton variant="rect" height={100} />
        ) : (
          content.map((item) => (
            <Item
              key={item.label}
              Icon={item.Icon}
              label={item.label}
              value={item.value}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default Section;

Item.propTypes = {
  Icon: PropTypes.func,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.arrayOf(PropTypes.string).isRequired,
  ]).isRequired,
  type: PropTypes.oneOf(['list', 'tree']),
};

Section.propTypes = {
  loading: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  content: PropTypes.arrayOf(PropTypes.shape(Item.propTypes)),
};
