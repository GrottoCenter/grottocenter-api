var HeadBox = React.createClass({
    displayName: 'HeadBox',
    render: function() {
        return (
            React.createElement('div', {className: "commentBox"},
                                "Hello, world! I am a CommentBox."
                               )
        );
    }
});
ReactDOM.render(
    React.createElement(HeadBox, null),
    document.getElementById('example')
);