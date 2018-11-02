import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {directionManager, RIGHT_TO_LEFT} from './../../containers/TextDirectionProvider';

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
