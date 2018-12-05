import React from 'react';
import PropTypes from 'prop-types';
import List from '@material-ui/core/List';
import { withStyles } from '@material-ui/core/styles';
import Translate from '../Translate';
import EntryListItem from './EntryListItem';

const styles = () => ({
  entriesList: {
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%',
  },
});

const EntriesList = (props) => {
  const { entries, classes } = props;
  return (
    <div>
      { entries.length > 0 ? (
        <div>
          <b><Translate>Entries related to this group</Translate></b>
          <List className={classes.entriesList}>
            {entries.sort((a, b) => a.name > b.name).map(entry => (
              <EntryListItem key={entry.id} entry={entry} />
            ))}
          </List>
        </div>
      ) : (
        <i><Translate>There is no entries related to this group currently</Translate></i>
      ) }
    </div>
  );
};


EntriesList.propTypes = {
  entries: PropTypes.arrayOf(PropTypes.object),
  classes: PropTypes.shape({}).isRequired,
};
EntriesList.defaultProps = {
  entries: undefined,
};

export default withStyles(styles)(EntriesList);
