
var LightPage = React.createClass({
  displayName: 'Light page',

  render: function() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
});
