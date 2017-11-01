import React from 'react';
import Avatar from 'material-ui/Avatar';
import Chip from 'material-ui/Chip';

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
