/**
 * Component used to manage text direction on child components
 *
 * Be careful: this component uses React context, which is a beta functionality
 *
 * TextDirectionProvider:
 * Component to add on top of all components that will manage text direction
 *
 * directionManager():
 * Function to use inside child components that give access to a new prop named
 * "direction"
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import { LEFT_TO_RIGHT, RIGHT_TO_LEFT } from '../conf/Config';

class TextDirectionProvider extends Component {
  getChildContext() {
    return {
      direction: this.props.direction || RIGHT_TO_LEFT,
    };
  }

  render() {
    return this.props.children;
  }
}

TextDirectionProvider.propTypes = {
  children: PropTypes.element.isRequired,
  direction: PropTypes.string.isRequired
};

TextDirectionProvider.childContextTypes = {
  direction: PropTypes.string.isRequired
};

const mapStateToProps = (state) => {
  return {
    direction: (state.currentLanguage === 'ar' || state.currentLanguage === 'he') ? RIGHT_TO_LEFT : LEFT_TO_RIGHT
  }
};

export default connect(mapStateToProps)(TextDirectionProvider);

export function directionManager() {
  return (Component) => {
    const TextDirectionManagedComponent = (props, context) => (
      context
        ? <Component direction={context.direction} {...props} />
        : <Component direction={RIGHT_TO_LEFT} {...props} />
    );

    TextDirectionManagedComponent.contextTypes = {
      direction: PropTypes.string.isRequired
    };

    return TextDirectionManagedComponent;
  };
}
