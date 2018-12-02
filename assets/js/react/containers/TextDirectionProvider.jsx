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

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { LEFT_TO_RIGHT, RIGHT_TO_LEFT } from '../conf/Config';

class TextDirectionProvider extends Component {
  getChildContext() {
    const { direction } = this.props;
    return {
      direction: direction || RIGHT_TO_LEFT,
    };
  }

  render() {
    const { children } = this.props;
    return children;
  }
}

TextDirectionProvider.propTypes = {
  children: PropTypes.element.isRequired,
  direction: PropTypes.string.isRequired,
};

TextDirectionProvider.childContextTypes = {
  direction: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  direction: (state.currentLanguage === 'ar' || state.currentLanguage === 'he') ? RIGHT_TO_LEFT : LEFT_TO_RIGHT,
});

export default connect(mapStateToProps)(TextDirectionProvider);

export function directionManager() {
  return (WrappedComponent) => {
    const TextDirectionManagedComponent = (props, context) => {
      const { direction } = context;
      return context
        ? <WrappedComponent direction={direction} {...props} />
        : <WrappedComponent direction={RIGHT_TO_LEFT} {...props} />;
    };

    TextDirectionManagedComponent.contextTypes = {
      direction: PropTypes.string.isRequired,
    };

    return TextDirectionManagedComponent;
  };
}
