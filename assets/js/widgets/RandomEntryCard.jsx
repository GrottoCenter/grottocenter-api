import React, {PropTypes} from 'react';
import FullStarIcon from 'material-ui/svg-icons/toggle/star';
import EmptyStarIcon from 'material-ui/svg-icons/toggle/star-border';
import HalfStarIcon from 'material-ui/svg-icons/toggle/star-half';
import I18n from 'react-ghost-i18n';

export class EntryData extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let stat = this.props.entry.stat;
    let entryInfo = this.props.entry.entryInfo[0];
    let timeInfo = this.props.entry.timeInfo;

    let imageElement = <div/>;
    if (entryInfo.path !== undefined) {
      imageElement = <EntryImage src={entryInfo.path}/>;
    }
    return (
      <div className="row">
        <div className="six columns">
          <EntryTitle entry={this.props.entry}/>
          <EntryStat stat={stat}/>
          <EntryInfo timeInfo={timeInfo} entryInfo={entryInfo}/>
        </div>
        {imageElement}
      </div>
    );
  }
}

EntryData.propTypes = {
  entry: PropTypes.object.isRequired
};

export class EntryTitle extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var lang = locale.substring(0,1).toUpperCase() + locale.substring(1, locale.length); //eslint-disable-line
    return (
      <div className="entryLocation">
        <h5>
          {this.props.entry.region} - {this.props.entry.country}
        </h5>
        <h4>
          <a href={'http://www.grottocenter.org/html/file_' + lang + '.php?lang=' + lang + '&check_lang_auto=false&category=entry&id=' + this.props.entry.id} target="blank">{this.props.entry.name}</a>
        </h4>
      </div>
    );
  }
}

EntryTitle.propTypes = {
  entry: PropTypes.object.isRequired
};

export class EntryStat extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.stat === undefined) {
      return (
        <div>At this time, there is no comment for this entry</div>
      );
    }
    return (
      <ul className="rating">
        <EntryStatItem itemScore={this.props.stat.aestheticism} itemLabel="Interest"/>
        <EntryStatItem itemScore={this.props.stat.caving} itemLabel="Ease of move"/>
        <EntryStatItem itemScore={this.props.stat.approach} itemLabel="Access"/>
      </ul>
    );
  }
}

EntryStat.propTypes = {
  stat: PropTypes.object.isRequired
};

export class EntryStatItem extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.itemScore === undefined) {
      return (
        <div/>
      );
    }

    let score = this.props.itemScore / 2;
    let half = this.props.itemScore % 2;

    let starsToDisplay = [];
    for (let i = 0; i < (score - half); i++) {
      starsToDisplay.push(<FullStarIcon key={'star' + i} color={'#ffd700'}/>);
    }
    if (half === 1) {
      starsToDisplay.push(<HalfStarIcon key={'starh'}  color={'#ffd700'}/>);
    }
    if (score < 5) {
      for (let i = (score + half); i < 5; i++) {
        starsToDisplay.push(<EmptyStarIcon key={'star' + i} color={'#ffd700'}/>);
      }
    }

    return (
      <li>
        <I18n>{this.props.itemLabel}</I18n>
        <div className="stars">{starsToDisplay}</div>
      </li>
    );
  }
}

EntryStatItem.propTypes = {
  itemScore: PropTypes.number,
  itemLabel: PropTypes.string.isRequired
};

export class EntryInfo extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let rows = [];
    if (this.props.timeInfo !== undefined) {
      rows.push(<EntryInfoItem key="eiik1" itemImg="time-to-go.svg" itemLabel="time to go" itemValue={this.props.timeInfo.eTTrail}/>);
      rows.push(<EntryInfoItem key="eiik2" itemImg="underground_time.svg" itemLabel="underground time" itemValue={this.props.timeInfo.eTUnderground}/>);
    }
    if (this.props.entryInfo !== undefined) {
      rows.push(<EntryInfoItem key="eiik3" itemImg="length.svg" itemLabel="length" itemValue={this.props.entryInfo.length} itemUnit="m"/>);
      rows.push(<EntryInfoItem key="eiik4" itemImg="depth.svg" itemLabel="depth" itemValue={this.props.entryInfo.depth} itemUnit="m"/>);
    }
    return (
      <div className="infos">
        {rows}
      </div>
    );
  }
}

EntryInfo.propTypes = {
  timeInfo: PropTypes.object.isRequired,
  entryInfo: PropTypes.object.isRequired
};

export class EntryInfoItem extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.itemValue === undefined) {
      return (
        <span/>
      );
    }
    let imgName = 'images/' + this.props.itemImg;
    return (
      <div className="entryInfo">
        <img src={imgName} height="50" width="50" title={this.props.itemLabel} alt={this.props.itemLabel}/>
        <span className="value">{this.props.itemValue}</span>
        <span className="unit">{this.props.itemUnit}</span>
      </div>
    );
  }
}

EntryInfoItem.propTypes = {
  itemValue: PropTypes.any,
  itemUnit: PropTypes.string,
  itemLabel: PropTypes.string.isRequired,
  itemImg: PropTypes.string.isRequired
};

export class EntryImage extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (!this.props.src) {
      return (
        <div>At this time, there is no image for this entry</div>
      );
    }
    return (
        <div className="six columns">
          <img className="topoImg" src={this.props.src} alt="topo"/>
        </div>
    );
  }
}

EntryImage.propTypes = {
  src: PropTypes.string.isRequired
};

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
    if (this.state.ramdomEntry.length !== 0) {
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
