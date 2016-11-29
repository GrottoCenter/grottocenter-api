"use strict";

var EntryData = React.createClass({
  render: function() {
    var comment = this.props.entry.comments[0];
    return (
      <div className="randomcave row">
        <div className="col-xs-6">
          <EntryTitle entry={this.props.entry}/>
          <EntryStat comment={comment}/>
          <EntryInfo comment={comment} cave={this.props.entry.caves[0]}/>
        </div>
        <EntryImage/>
      </div>
    );
  }
});

var EntryTitle = React.createClass({
  render: function() {
    return (
      <h4>
        {this.props.entry.region} - {this.props.entry.country}
        <br/><br/>
        <a href="fichedetailleecavite.html" target="blank">{this.props.entry.name}</a>
      </h4>
    );
  }
});

var EntryStat = React.createClass({
  render: function() {
    if (this.props.comment == undefined) {
      return (
        <div>At this time, there is no comment for this entry</div>
      );
    }
    return (
      <ul className="rating">
        <EntryStatItem itemScore={this.props.comment.relevance} itemLabel="Interest"/>
        <EntryStatItem itemScore={this.props.comment.caving} itemLabel="Ease of move"/>
        <EntryStatItem itemScore={this.props.comment.approach} itemLabel="Access"/>
      </ul>
    );
  }
});

var EntryStatItem = React.createClass({
  render: function() {
    if (this.props.itemScore == undefined) {
      return (
        <div/>
      );
    }
    var score = this.props.itemScore;
    var imgName = "images/" + score + "star.svg";
    var imgAlt = score + " stars";
    return (
      <li>{this.props.itemLabel} :
        <img src={imgName} alt={imgAlt}/>
        <i className="icon icon-user"></i>
      </li>
    );
  }
});

var EntryInfo = React.createClass({
  render: function() {
    var rows = [];
    if (this.props.comment != undefined) {
      rows.push(<EntryInfoItem key="eiik1" itemImg="time-to-go.svg" itemLabel="time to go" itemValue={this.props.comment.eTTrail}/>);
      rows.push(<EntryInfoItem key="eiik2" itemImg="underground_time.svg" itemLabel="underground time" itemValue={this.props.comment.eTUnderground}/>);
    }
    if (this.props.cave != undefined) {
      rows.push(<EntryInfoItem key="eiik3" itemImg="length.svg" itemLabel="length" itemValue={this.props.cave.length} itemUnit="m"/>);
      rows.push(<EntryInfoItem key="eiik4" itemImg="depth.svg" itemLabel="depth" itemValue={this.props.cave.depth} itemUnit="m"/>);
    }
    return (
      <div className="infos">
        {rows}
      </div>
    );
  }
});

var EntryInfoItem = React.createClass({
  render: function() {
    if (this.props.itemValue == undefined) {
      return (
        <span/>
      );
    }
    var imgName = "images/" + this.props.itemImg;
    return (
      <span><img src={imgName} height="50" width="50" title={this.props.itemLabel} alt={this.props.itemLabel}/>
        {this.props.itemValue}
        {this.props.itemUnit}</span>
    );
  }
});

var EntryImage = React.createClass({
  render: function() {
    return (
        <div className="col-xs-6">
          <img className="img img-responsive" src="images/topo1.png" alt="topo"/>
        </div>
    );
  }
});

var RandomEntryCard = React.createClass({
  displayName: 'RandomEntryCard',

  getInitialState: function() {
    return {ramdomEntry: []};
  },

  componentWillMount: function() {
    this.fetchData({});
  },

  fetchData: function(filters) {
    var _this = this;
    var url = "/entry/findRandom";

    $.get(url, function(data) {
      _this.setState({ramdomEntry: data[0]});
    });
  },

  render: function() {
    if (this.state.ramdomEntry.length != 0) {
      return (
        <div>
          <BasicCard title={this.state.ramdomEntry.name} image="entry" text="">
            <EntryData entry={this.state.ramdomEntry}/>
          </BasicCard>
        </div>
      );

    } else {
      return (
        <div/>
      );
    }
  }
});
