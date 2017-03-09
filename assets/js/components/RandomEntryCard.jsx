import React, {PropTypes} from 'react';
import FullStarIcon from 'material-ui/svg-icons/toggle/star';
import EmptyStarIcon from 'material-ui/svg-icons/toggle/star-border';
import HalfStarIcon from 'material-ui/svg-icons/toggle/star-half';
import I18n from 'react-ghost-i18n';
import GCLink from '../components/GCLink';

export class EntryData extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let stat = this.props.entry.stat;
    let entryInfo = this.props.entry.entryInfo[0];
    let timeInfo = this.props.entry.timeInfo;
    let lang = locale.substring(0,1).toUpperCase() + locale.substring(1, locale.length); //eslint-disable-line

    let imageElement = <div/>;
    if (entryInfo.path !== undefined) {
      imageElement = <EntryImage src={entryInfo.path}/>;
    }
    return (
      <GCLink className="randomEntryLink" href={'http://www.grottocenter.org/html/file_' + lang + '.php?lang=' + lang + '&check_lang_auto=false&category=entry&id=' + this.props.entry.id} target="blank">
        <div className="row">
          <div className="six columns">
            <EntryTitle entry={this.props.entry}/>
            <EntryStat stat={stat}/>
            <EntryInfo timeInfo={timeInfo} entryInfo={entryInfo}/>
          </div>
          {imageElement}
        </div>
      </GCLink>
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
    return (
      <div className="entryLocation">
        <h5>
          {this.props.entry.region} - {this.props.entry.country}
        </h5>
        <h4>
          {this.props.entry.name}
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
        <EntryStatItem itemScore={this.props.stat.caving} itemLabel="Ease to move"/>
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
    let starsToDisplay = [];
    let displayed = 0;

    for (let i = 0; i < Math.floor(score); i++) {
      starsToDisplay.push(<FullStarIcon key={'star' + i} color={'#ffd700'}/>);
      displayed++;
    }
    if (Math.floor(score) < score) {
      starsToDisplay.push(<HalfStarIcon key={'starh'}  color={'#ffd700'}/>);
      displayed++;
    }
    if (displayed < 5) {
      for (let i = displayed; i < 5; i++) {
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
      rows.push(<EntryInfoItem key="eiik1" itemImg="time-to-go.svg" itemLabel="time to go" itemType="time" itemValue={this.props.timeInfo.eTTrail}/>);
      rows.push(<EntryInfoItem key="eiik2" itemImg="underground_time.svg" itemLabel="underground time" itemType="time" itemValue={this.props.timeInfo.eTUnderground}/>);
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
    let displayValue = this.props.itemValue;
    if (displayValue === undefined || displayValue === null) {
      return (
        <span/>
      );
    }

    if (this.props.itemType === 'time') {
      displayValue = displayValue.replace('.0000','');
    }

    let imgName = 'images/' + this.props.itemImg;
    return (
      <div className="entryInfo">
        <img src={imgName} height="50" width="50" title={this.props.itemLabel} alt={this.props.itemLabel}/>
        <span className="value">{displayValue}</span>
        <span className="unit">{this.props.itemUnit}</span>
      </div>
    );
  }
}

EntryInfoItem.propTypes = {
  itemValue: PropTypes.any,
  itemUnit: PropTypes.string,
  itemLabel: PropTypes.string.isRequired,
  itemImg: PropTypes.string.isRequired,
  itemType: PropTypes.string
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
    this.fetchData();
  }

  fetchData() {
    let _this = this;
    let url = '/api/entry/findRandom';

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
