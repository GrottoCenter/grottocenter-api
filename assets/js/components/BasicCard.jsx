import React from 'react';

/**
 * TODO Add comment
 */
export default class BasicCard extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
  }

  render() {
    return (
      <div className="basicCard">
        <figure>
          <img src={this.props.image} alt=""/>
        </figure>
        <div>
          <h3>{this.props.title}</h3>
        </div>
        <div>
          <p>{this.props.children}</p>
        </div>
        <div>
          <a href="#">Read More</a>
        </div>
      </div>
    );
  }
}
