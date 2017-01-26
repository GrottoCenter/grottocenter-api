/**
 * TODO Add comment
 */
import React from 'react';
import ReactRouter from 'react-router';

const SimpleButton = () => (
  <ReactRouter.Link className={this.props.className} to={this.props.href} activeClassName="active">{this.props.children}</ReactRouter.Link>
);

export default SimpleButton;
