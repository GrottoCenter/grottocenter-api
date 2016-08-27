//var BasicCard = require("../../../BasicCard");

var HomepageCards = React.createClass({
    displayName: 'HomepageCards',
    render: function() {
        return (
            React.createElement('div', null,
                React.createElement(BasicCard)
            )
        );
    }
});

ReactDOM.render(
    React.createElement(HomepageCards, null),
    document.getElementById('homepagecards')
);