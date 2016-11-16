"use strict";

var SimpleButton = React.createClass({
    displayName: 'SimpleButton',

    render: function() {
        return (
          <ReactRouter.Link className="btn btn-success" to={this.props.href} activeClassName="active">{this.props.text}</ReactRouter.Link>
        );
    }
});
