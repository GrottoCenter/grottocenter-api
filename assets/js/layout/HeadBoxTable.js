'use strict';

var HeadBoxTable = React.createClass({
    displayName: 'HeadBoxTable',
    render: function() {
        return (
            React.createElement('div', {className: "headBoxTableBox"},
                                "Hello, world! I am a CommentBox."
                               )
        );
    }
});
ReactDOM.render(
    React.createElement(HeadBoxTable, null),
    document.getElementById('testtable')
);