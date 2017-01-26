import React, {PropTypes} from 'react';

export default class LightPage extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}

LightPage.propTypes = {
  children: PropTypes.node.isRequired
};
