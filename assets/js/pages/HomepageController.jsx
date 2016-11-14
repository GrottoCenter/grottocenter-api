/**
 * TODO Add comment
 */
 
var HomepageController = React.createClass({
  displayName: 'Homepage controller',

  getInitialState: function() {
    return {};
  },

  componentDidMount: function() {},

  render: function() {
    return <Homepage/>;
  }
});

ReactDOM.render(React.createElement(HomepageController, null), document.getElementById('homepage_wrapper'));
