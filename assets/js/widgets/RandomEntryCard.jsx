import React from 'react';

export class EntryData extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
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
}

export class EntryTitle extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <h4>
        {this.props.entry.region} - {this.props.entry.country}
        <br/><br/>
        <a href="fichedetailleecavite.html" target="blank">{this.props.entry.name}</a>
      </h4>
    );
  }
}

export class EntryStat extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
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
}

export class EntryStatItem extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.itemScore == undefined) {
      return (
        <div/>
      );
    }

    var score = this.props.itemScore;
    var starText = "star" +  (score > 1 ? "s" : "");
    var imgName = "images/" + score + starText + ".svg";
    var imgAlt = score + " " + starText;

    return (
      <li>{this.props.itemLabel} :
        <img src={imgName} alt={imgAlt}/>
        <i className="icon icon-user"></i>
      </li>
    );
  }
}

export class EntryInfo extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
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
}

export class EntryInfoItem extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
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
}

export class EntryImage extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
        <div className="col-xs-6">
          <img className="img img-responsive" src="images/topo1.png" alt="topo"/>
        </div>
    );
  }
}

export default class RandomEntryCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ramdomEntry: []
    };
    this.fetchData({});
  }

  fetchData(filters) {
    var _this = this;
    var url = "/entry/findRandom";

    $.get(url, function(data) {
      _this.setState({ramdomEntry: data[0]});
    });
  }

  render() {
    if (this.state.ramdomEntry.length != 0) {
      return (
        <div>
          <EntryData entry={this.state.ramdomEntry}/>
        </div>
      );

    } else {
      return (
        <div/>
      );
    }
  }
}
