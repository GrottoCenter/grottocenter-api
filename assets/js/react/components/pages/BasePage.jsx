import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { directionManager } from './../../containers/TextDirectionProvider';
import { RIGHT_TO_LEFT } from './../../conf/Config';

//
//
// M A I N - C O M P O N E N T
//
//

class BasePage extends Component {
  render() {
    return (
      <div style={{direction: (this.props.direction === RIGHT_TO_LEFT ? 'rtl' : 'ltr')}}>
        {this.props.children}
      </div>
    );
  }
}

BasePage.propTypes = {
  direction: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

export default directionManager()(BasePage);
