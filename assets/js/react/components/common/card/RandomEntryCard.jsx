import React, {PropTypes, Component} from 'react';
import FullStarIcon from 'material-ui/svg-icons/toggle/star';
import EmptyStarIcon from 'material-ui/svg-icons/toggle/star-border';
import HalfStarIcon from 'material-ui/svg-icons/toggle/star-half';
import CircularProgress from 'material-ui/CircularProgress';
import GCLink from '../GCLink';
import {detailPageV2Links} from '../../../conf/Config';
import {GridRow, GridOneHalfColumn} from '../Grid';
import Translate from '../Translate';
import styled from 'styled-components';

export class EntryData extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (!this.props.entry) {
      return <div />;
    }
    let stat = this.props.entry.stat;
    let entryInfo = this.props.entry.entryInfo;
    let timeInfo = this.props.entry.timeInfo;
    let lang = locale.substring(0,1).toUpperCase() + locale.substring(1, locale.length); //eslint-disable-line

    let imageElement = <div/>;
    if (entryInfo && entryInfo.path) {
      imageElement = <EntryImage src={entryInfo.path}/>;
    }

    return (
      <GridRow>
        <GridOneHalfColumn>
          <EntryTitle entry={this.props.entry}/>
          <EntryStat stat={stat}/>
          <EntryInfos timeInfo={timeInfo} entryInfo={entryInfo}/>
        </GridOneHalfColumn>
        {imageElement}
      </GridRow>
    );
  }
}

EntryData.propTypes = {
  entry: PropTypes.object.isRequired
};

const EntryName = styled.h4`
  font-weight: 400;
  margin-bottom: 0;
`;

const EntryRegion = styled.h5`
  font-size: 1.5em;
`;

const EntryTitle = ({entry}) => (
  <div className="entryLocation" dir="ltr">
    <EntryName>{entry.name}</EntryName>
    <EntryRegion>{entry.region} - {entry.country}</EntryRegion>
  </div>
);

EntryTitle.propTypes = {
  entry: PropTypes.object.isRequired
};

const RatingList = styled.ul`
  list-style-type: none;
`;

const EntryStat = ({stat}) => (
  <div>
    {!stat &&
      <Translate>At this time, there is no comment for this entry</Translate>}
    {stat &&
      <RatingList>
        <EntryStatItem itemScore={stat.aestheticism} itemLabel="Interest"/>
        <EntryStatItem itemScore={stat.caving} itemLabel="Ease to move"/>
        <EntryStatItem itemScore={stat.approach} itemLabel="Access"/>
      </RatingList>}
  </div>
);

EntryStat.propTypes = {
  stat: PropTypes.object.isRequired
};

const StatEntry = styled.li`
  display: inline-flex;
  width: 100%;

  span {
    margin-right: 10px;
    white-space: nowrap;
    width: 50%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const Stars = styled.div`
  display: inline;
  white-space: nowrap;
`;

export class EntryStatItem extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (!this.props.itemScore) {
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
      <StatEntry>
        <Translate>{this.props.itemLabel}</Translate>
        <Stars>{starsToDisplay}</Stars>
      </StatEntry>
    );
  }
}

EntryStatItem.propTypes = {
  itemScore: PropTypes.number,
  itemLabel: PropTypes.string.isRequired
};

const EntryInfos = ({timeInfo, entryInfo}) => (
  <div className="infos">
    {timeInfo &&
      <EntryInfoItem key="eiik1" itemImg="time-to-go.svg" itemLabel="time to go" itemType="time" itemValue={timeInfo.eTTrail}/>
    }
    {timeInfo &&
      <EntryInfoItem key="eiik2" itemImg="underground_time.svg" itemLabel="underground time" itemType="time" itemValue={timeInfo.eTUnderground}/>
    }
    {entryInfo &&
      <EntryInfoItem key="eiik3" itemImg="length.svg" itemLabel="length" itemValue={entryInfo.length} itemUnit="m"/>
    }
    {entryInfo &&
      <EntryInfoItem key="eiik4" itemImg="depth.svg" itemLabel="depth" itemValue={entryInfo.depth} itemUnit="m"/>
    }
  </div>
);

EntryInfos.propTypes = {
  timeInfo: PropTypes.object.isRequired,
  entryInfo: PropTypes.object.isRequired
};

const EntryInfoWrapper = styled.div`
  width: 50%;
  display: inline-flex;
  line-height: 50px;
  font-weight: 300;
  font-size: 1.4em;
`;

const InfoImage = styled.img`
  height: 50px;
  width: 50px;
`;

const InfoValue = styled.span`
  margin-left: 6px;
  white-space: nowrap;
`;

const InfoUnit = styled.span`
  margin-left: 6px;
  white-space: nowrap;
`;

export class EntryInfoItem extends Component {
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
      let splitTime = displayValue.split(':');
      let curHours = parseInt(splitTime[0]);
      let curMinutes = parseInt(splitTime[1]);
      if (curHours === 0) {
        const toTranslate = `${curMinutes} min`;
        displayValue = <Translate>{toTranslate}</Translate>;
      } else {
        if (curMinutes === 0) {
          const toTranslate = `${curHours} hour${(curHours > 1) ? 's' : ''}`;
          displayValue = <Translate>{toTranslate}</Translate>;
        } else {
          displayValue = <Translate>{curHours} h {curMinutes}</Translate>
        }
      }
    }

    return (
      <EntryInfoWrapper>
        <InfoImage src={'images/' + this.props.itemImg} title={this.props.itemLabel} alt={this.props.itemLabel} />
        <InfoValue>{displayValue}</InfoValue>
        <InfoUnit>{this.props.itemUnit}</InfoUnit>
      </EntryInfoWrapper>
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

const TopoImage = styled.img`
  width: 100%;
  background-color: white;
`;

const NoImage = styled.img`
  font-weight: 300;
  font-style: italic;
`;

const EntryImage = ({src}) => (
  <GridOneHalfColumn>
    {!src &&
      <NoImage>
        <Translate>At this time, there is no image for this entry</Translate>
      </NoImage>}
    {src &&
      <TopoImage src={src} alt="topo" />}
  </GridOneHalfColumn>
);

EntryImage.propTypes = {
  src: PropTypes.string.isRequired
};

const RandomEntryLink = styled(GCLink)`
  text-decoration: none;
  color: white;
`;

const EntryWrapper = styled.div`
  background-color: rgba(110,110,110,.5);;
  margin: auto;
  padding: 20px;
  border-radius: 5px;
  color: white;
`;

class RandomEntryCard extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.fetch();
  }

  render() {
    if (this.props.isFetching) {
      return (<CircularProgress />);
    }
    if (this.props.entry && this.props.entry.id) {
      let detailPageV2Link = (detailPageV2Links[locale] !== undefined) ? detailPageV2Links[locale] : detailPageV2Links['*']; //eslint-disable-line
      return (
        <RandomEntryLink href={detailPageV2Link + '&category=entry&id=' + this.props.entry.id} target='blank'>
          <EntryWrapper>
            <EntryData entry={this.props.entry}/>
          </EntryWrapper>
        </RandomEntryLink>
      );
    }
    return (<div/>);
  }
}

RandomEntryCard.propTypes = {
  fetch: PropTypes.func.isRequired,
  isFetching: PropTypes.bool,
  entry: PropTypes.object,
};

export default RandomEntryCard;


// [role='section'].randomEntry {
//   @media (min-width: 550px) {
//     .six.columns {
//       width: 100%;
//     }
//
//     .column,
//     .columns {
//       margin-left: 0;
//     }
//   }
//EntryInfoIte
//   @media (min-width: 750px) {
//     text-align: left;
//
//     .six.columns {
//       width: 48%;
//     }
//
//     .column,
//     .columns {
//       margin-left: 2%;
//     }
//   }
// }
