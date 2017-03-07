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

import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

export const LEFT_TO_RIGHT = 'LTR';
export const RIGHT_TO_LEFT = 'RTL';

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

const mapPropToState = (state) => {
  return {
    direction: state.currentLanguage === 'ar' ? RIGHT_TO_LEFT : LEFT_TO_RIGHT
  }
};

export default connect(mapPropToState)(TextDirectionProvider);

export function directionManager() {
  return (Component) => {
    const TextDirectionManagedComponent = (props, context) => {
      return <Component direction={context.direction} {...props} />;
    };

    TextDirectionManagedComponent.contextTypes = {
      direction: PropTypes.string.isRequired
    };

    return TextDirectionManagedComponent;
  };
}
