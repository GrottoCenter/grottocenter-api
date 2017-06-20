import React, {Component, PropTypes} from 'react';
import GrottoAppBar from '../homepage/GrottoAppBar';
import {directionManager, RIGHT_TO_LEFT} from './../../containers/TextDirectionProvider';

class BasePage extends Component {
  constructor(props) {
    super(props);
    I18n.locale = catalog; //eslint-disable-line no-undef
  }

  render() {
    return (
      <div style={{direction: (this.props.direction === RIGHT_TO_LEFT ? 'rtl' : 'ltr')}}>
        <GrottoAppBar/>
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
