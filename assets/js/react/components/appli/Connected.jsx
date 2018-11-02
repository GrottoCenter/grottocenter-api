import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';

const styles = {
  chip: {
    margin: 4,
  },
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
  },
};

export default class Connected extends React.Component {

  render() {
    return (
      <div style={styles.wrapper}>
        <Chip
          style={styles.chip}
        >
          <Avatar src="images/uxceo-128.jpg" />
          Kurdty
        </Chip>

      </div>
    );
  }
}
