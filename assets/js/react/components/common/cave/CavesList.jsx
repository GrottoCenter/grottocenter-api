import React from 'react';
import PropTypes from 'prop-types';
import List from '@material-ui/core/List';
import { withStyles } from '@material-ui/core/styles';
import Translate from '../Translate';
import CaveListItem from './CaveListItem';

const styles = () => ({
  cavesList: {
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%',
  },
});

const CavesList = (props) => {
  const { caves, classes } = props;
  return (
    <div>
      {caves.length > 0
        ? (
          <div>
            <b><Translate>Caves list</Translate></b>
            :
            <List className={classes.cavesList}>
              {caves.sort((a, b) => a.name > b.name).map(cave => (
                <CaveListItem key={cave.id} cave={cave} />
              ))}
            </List>
          </div>
        ) : (
          <div>
            <Translate>This massif has no caves repertoried yet</Translate>
            .
          </div>
        )
    }
    </div>
  );
};


CavesList.propTypes = {
  caves: PropTypes.arrayOf(PropTypes.object),
  classes: PropTypes.shape({}).isRequired,
};
CavesList.defaultProps = {
  caves: undefined,
};

export default withStyles(styles)(CavesList);
