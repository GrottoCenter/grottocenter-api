/**
 * TODO Add comment
 */

var DisplayCaveDetailsCardContent = React.createClass({
  render: function() {
    return (
      <div className="randomcave row">
        <div className="col-xs-6">
          <h4>
            Pyrénées Orientales (66) - FR
            <br/><br/>
            <a href="fichedetailleecavite.html" target="blank">{this.props.cave.name}</a>
          </h4>

          <ul className="rating">
            <li>Interest :
              <img src="images/1star.svg"/>
              2
              <i className="icon icon-user"></i>
            </li>
            <li>Ease of move :
              <img src="images/5stars.svg"/>
              2
              <i className="icon icon-user"></i>
            </li>
            <li>Access :
              <img src="images/2stars.svg"/>
              2
              <i className="icon icon-user"></i>
            </li>
          </ul>

          <div className="infos">
            <span><img src="images/time-to-go.svg" height="50" width="50" title="time to go"/>
              01h30</span>
            <span><img src="images/underground_time.svg" height="50" width="50" title="underground time"/>
              21h30</span>
            <span><img src="images/length.svg" height="50" width="50" title="length"/> {this.props.cave.length}
              m</span>
            <span><img src="images/depth.svg" height="50" width="50" title="depth"/> {this.props.cave.depth}
              m</span>
          </div>
        </div>
        <div className="col-xs-6">
          <img className="img img-responsive" src="images/topo1.png"/>
        </div>
      </div>
    );
  }
});

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
