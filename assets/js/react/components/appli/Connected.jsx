import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const styles = {
  chip: {
    margin: 4,
  },
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
  },
};

//
//
// M A I N - C O M P O N E N T
//
//

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
