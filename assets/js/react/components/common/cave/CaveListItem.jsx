import React from 'react';
import PropTypes from 'prop-types';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { withStyles } from '@material-ui/core';
import { withRouter } from 'react-router-dom';
import styled from 'styled-components';

const CaveDepthIcon = styled.img`
  display: inline-block;
  vertical-align: text-bottom;
  width: 2.5rem;
`;

const CaveLengthIcon = styled.img`
  display: inline-block;
  vertical-align: text-bottom;
  width: 2.5rem;
`;

const styles = (theme) => ({
  caveItem: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    listStyleType: 'none',
    width: '20%',
    padding: '10px',
    whiteSpace: 'nowrap',
    [theme.breakpoints.down('md')]: {
      width: '50%',
    },
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
  caveLink: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
  },
  caveText: {
    overflow: 'hidden',
    padding: 0,
    textOverflow: 'ellipsis',
    width: '100%',
  },
});

const CaveListItem = (props) => {
  const { classes, cave } = props;
  const handleClick = () => {
    cave.id && props.history.push(`/ui/caves/${cave.id}`);
  };

  return (
    <ListItem className={classes.caveItem} button onClick={handleClick}>
      {cave.name}
      <ListItemText className={classes.caveText}>
        {cave.depth ? (
          <>
            <CaveDepthIcon src="/images/depth.svg" alt="Cave depth icon" />
            <span
              style={{ marginRight: '5px', verticalAlign: 'super' }}
            >{`${cave.depth.toLocaleString()}m`}</span>
          </>
        ) : (
          ''
        )}
        {cave.length ? (
          <>
            <CaveLengthIcon src="/images/length.svg" alt="Cave depth icon" />
            <span
              style={{ verticalAlign: 'super' }}
            >{`${cave.length.toLocaleString()}m`}</span>
          </>
        ) : (
          ''
        )}
      </ListItemText>
    </ListItem>
  );
};

CaveListItem.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  cave: PropTypes.shape({}),
  history: PropTypes.shape({ push: PropTypes.func }).isRequired,
};
CaveListItem.defaultProps = {
  cave: undefined,
};

export default withRouter(withStyles(styles)(CaveListItem));
