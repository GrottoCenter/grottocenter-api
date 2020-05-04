import React from 'react';
import PropTypes from 'prop-types';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { withStyles } from '@material-ui/core';
import { withRouter } from 'react-router-dom';
import GClink from '../GCLink';
import { detailPageV2Links } from '../../../conf/Config';

const styles = (theme) => ({
  entryItem: {
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
  entryLink: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
  },
  entryText: {
    overflow: 'hidden',
    padding: 0,
    textOverflow: 'ellipsis',
    width: '100%',
  },
});

const EntryListItem = (props) => {
  const { classes, entry } = props;

  return (
    <ListItem
      className={classes.entryItem}
      button /*onClick={() => props.history.push(`/ui/entries/${entry.id}`)}*/
    >
      <GClink
        className={classes.entryLink}
        internal={false}
        target="_blank"
        href={`/ui/entries/${entry.id}`}
      >
        {entry.name}
      </GClink>
      <ListItemText className={classes.entryText}>
        {entry.country}
        {' - '}
        {entry.region}
      </ListItemText>
    </ListItem>
  );
};

EntryListItem.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  entry: PropTypes.shape({}),
  history: PropTypes.shape({ push: PropTypes.func }).isRequired,
};

EntryListItem.defaultProps = {
  entry: undefined,
};

export default withRouter(withStyles(styles)(EntryListItem));
