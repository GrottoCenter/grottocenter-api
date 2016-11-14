/**
 * TODO Add comment
 */
 
var SimpleButton = React.createClass({
    displayName: 'SimpleButton',

    render: function() {
        return (
            <a className="btn btn-success" href={this.props.href}>{this.props.text}</a>
        );
    }
});
