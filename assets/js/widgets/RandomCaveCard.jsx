
var RandomCaveCard = React.createClass({
  displayName: 'RandomCaveCard',

  getInitialState: function() {
    return {ramdomCave: []};
  },

  componentWillMount: function() {
    this.fetchData({});
  },

  fetchData: function(filters) {
    var _this = this;
    var url = "/cave/findRandom";

    $.get(url, function(data) {
      _this.setState({ramdomCave: data[0]});
    });
  },

  render: function() {
    return (
      <div>
        <BasicCard title={this.state.ramdomCave.name} image="entry" text="">
          <DisplayCaveDetailsCardContent cave={this.state.ramdomCave}/>
        </BasicCard>
      </div>
    );
  }
});
