var SimpleButton = React.createClass({
    displayName: 'SimpleButton',
	
    render: function() {
        return (
            React.createElement('a', {className: "btn btn-success", href: this.props.href}, this.props.text)
        );
    }
});