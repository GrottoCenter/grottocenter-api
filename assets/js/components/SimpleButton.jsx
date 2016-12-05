/**
 * TODO Add comment
 */
import React from 'react';
var SimpleButton = React.createClass({
    displayName: 'SimpleButton',

    render: function() {
        return (
          <ReactRouter.Link className={this.props.className} to={this.props.href} activeClassName="active">{this.props.children}</ReactRouter.Link>
        );
    }
});
