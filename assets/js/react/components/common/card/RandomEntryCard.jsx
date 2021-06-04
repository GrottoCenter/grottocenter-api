import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FullStarIcon from '@material-ui/icons/Star';
import EmptyStarIcon from '@material-ui/icons/StarBorder';
import HalfStarIcon from '@material-ui/icons/StarHalf';
import CircularProgress from '@material-ui/core/CircularProgress';
import styled from 'styled-components';
import { withStyles } from '@material-ui/core';
import { isNil } from 'ramda';

import GCLink from '../GCLink';
import { detailPageV2Links } from '../../../conf/Config';
import Translate from '../Translate';

//
//
// S U B - C O M P O N E N T S
//
//

const FlexWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const FlexItemWrapper = styled.div`
  flex: 1;
  flex-basis: 300px;
  margin: ${({ theme }) => theme.spacing(2)}px;
  overflow: hidden;
`;

const EntryData = ({ entry }) => {
  if (!entry) {
    return <div />;
  }
  let imageElement = null;
  const { documents, cave, stats, timeInfo } = entry;

  // TODO: improve get of the topo
  // 13 is the id of the type "TopographicData"
  const topoDoc = documents ? documents.find((d) => d.type === 13) : null;
  if (!isNil(topoDoc)) {
    const topo = topoDoc.files.find((f) => f.pathOld !== null);
    imageElement =
      topo && topo.pathOld ? <EntryImage src={topo.pathOld} /> : null;
  }

  return (
    <FlexWrapper>
      <FlexItemWrapper>
        <EntryTitle entry={entry} />
        <EntryStat stat={stats} />
        <EntryInfos timeInfo={timeInfo} cave={cave} />
      </FlexItemWrapper>
      {imageElement && <FlexItemWrapper>{imageElement}</FlexItemWrapper>}
    </FlexWrapper>
  );
};

EntryData.propTypes = {
  entry: PropTypes.shape({
    documents: PropTypes.arrayOf(PropTypes.shape({})),
    cave: PropTypes.shape({
      depth: PropTypes.number,
      length: PropTypes.number,
    }),
    stats: PropTypes.shape({}),
    timeInfo: PropTypes.shape({}),
  }).isRequired,
};

const EntryName = styled.h4`
  font-weight: 400;
  margin-bottom: 0;
`;

const EntryLocalizationPart = styled.h5`
  font-size: 1.5em;
  margin-bottom: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EntryTitle = ({ entry }) => {
  const { county, country, name, region } = entry;
  return (
    <div className="entryLocation" dir="ltr">
      <EntryName>{name}</EntryName>
      {county && <EntryLocalizationPart>{county}</EntryLocalizationPart>}
      {region && <EntryLocalizationPart>{region}</EntryLocalizationPart>}
      {country && <EntryLocalizationPart>{country}</EntryLocalizationPart>}
    </div>
  );
};

EntryTitle.propTypes = {
  entry: PropTypes.shape({
    county: PropTypes.string,
    country: PropTypes.string,
    name: PropTypes.string,
    region: PropTypes.string,
  }).isRequired,
};

const RatingList = styled.ul`
  list-style-type: none;
`;

const EntryStat = ({ stat }) => (
  <div>
    {!stat && (
      <Translate>At this time, there is no comment for this entry</Translate>
    )}
    {stat && (
      <RatingList>
        <EntryStatItem itemScore={stat.aestheticism} itemLabel="Interest" />
        <EntryStatItem itemScore={stat.caving} itemLabel="Ease to move" />
        <EntryStatItem itemScore={stat.approach} itemLabel="Access" />
      </RatingList>
    )}
  </div>
);

EntryStat.propTypes = {
  stat: PropTypes.shape({
    aestheticism: PropTypes.number,
    approach: PropTypes.number,
    caving: PropTypes.number,
  }).isRequired,
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

const StyledFullStarIcon = withStyles({
  root: {
    fill: '#ffd700',
  },
})(FullStarIcon);

const StyledHalfStarIcon = withStyles({
  root: {
    fill: '#ffd700',
  },
})(HalfStarIcon);

const StyledEmptyStarIcon = withStyles({
  root: {
    fill: '#ffd700',
  },
})(EmptyStarIcon);

const EntryStatItem = ({ itemLabel, itemScore }) => {
  if (!itemScore) {
    return <div />;
  }

  const score = itemScore / 2;
  const starsToDisplay = [];
  let displayed = 0;

  for (let i = 0; i < Math.floor(score); i += 1) {
    starsToDisplay.push(<StyledFullStarIcon key={`star${i}`} />);
    displayed += 1;
  }
  if (Math.floor(score) < score) {
    starsToDisplay.push(<StyledHalfStarIcon key="starh" />);
    displayed += 1;
  }
  if (displayed < 5) {
    for (let i = displayed; i < 5; i += 1) {
      starsToDisplay.push(<StyledEmptyStarIcon key={`star${i}`} />);
    }
  }

  return (
    <StatEntry>
      <Translate>{itemLabel}</Translate>
      <Stars>{starsToDisplay}</Stars>
    </StatEntry>
  );
};

EntryStatItem.propTypes = {
  itemScore: PropTypes.number,
  itemLabel: PropTypes.string.isRequired,
};

const EntryInfos = ({ timeInfo, cave }) => (
  <div className="infos">
    {timeInfo && (
      <EntryInfoItem
        key="eiik1"
        itemImg="time-to-go.svg"
        itemLabel="Time to go"
        itemType="time"
        itemValue={timeInfo.eTTrail}
      />
    )}
    {timeInfo && (
      <EntryInfoItem
        key="eiik2"
        itemImg="underground_time.svg"
        itemLabel="Underground time"
        itemType="time"
        itemValue={timeInfo.eTUnderground}
      />
    )}
    {cave && (
      <EntryInfoItem
        key="eiik3"
        itemImg="length.svg"
        itemLabel="Length"
        itemValue={cave.length}
        itemUnit="m"
      />
    )}
    {cave && (
      <EntryInfoItem
        key="eiik4"
        itemImg="depth.svg"
        itemLabel="Depth"
        itemValue={cave.depth}
        itemUnit="m"
      />
    )}
  </div>
);

EntryInfos.propTypes = {
  timeInfo: PropTypes.shape({
    eTTrail: PropTypes.number,
    eTUnderground: PropTypes.number,
  }).isRequired,
  cave: PropTypes.shape({
    depth: PropTypes.number,
    length: PropTypes.number,
  }).isRequired,
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

const EntryInfoItem = ({
  itemImg,
  itemLabel,
  itemType,
  itemUnit,
  itemValue,
}) => {
  if (isNil(itemValue)) {
    return <span />;
  }

  let valueToDisplay = itemValue;
  if (itemType === 'time') {
    const splittedTime = itemValue.split(':');
    valueToDisplay = `${splittedTime[0]}h ${splittedTime[1]}m`;
  }

  return (
    <EntryInfoWrapper>
      <InfoImage src={`images/${itemImg}`} title={itemLabel} alt={itemLabel} />
      <InfoValue>{valueToDisplay}</InfoValue>
      <InfoUnit>{itemUnit}</InfoUnit>
    </EntryInfoWrapper>
  );
};

EntryInfoItem.propTypes = {
  itemValue: PropTypes.any, // eslint-disable-line react/forbid-prop-types
  itemUnit: PropTypes.string,
  itemLabel: PropTypes.string.isRequired,
  itemImg: PropTypes.string.isRequired,
  itemType: PropTypes.string,
};

const TopoImage = styled.img`
  width: 100%;
  background-color: white;
`;

const NoImage = styled.img`
  font-weight: 300;
  font-style: italic;
`;

const EntryImage = ({ src }) => (
  <>
    {!src && (
      <NoImage>
        <Translate>At this time, there is no image for this entry</Translate>
      </NoImage>
    )}
    {src && <TopoImage src={src} alt="topo" />}
  </>
);

EntryImage.propTypes = {
  src: PropTypes.string.isRequired,
};

const RandomEntryLink = styled(GCLink)`
  text-decoration: none;
  color: white;
`;

const EntryWrapper = styled.div`
  background-color: rgba(110, 110, 110, 0.5);
  border-radius: ${({ theme }) => theme.spacing(1)}px;
  color: white;
  margin: auto;
  padding: ${({ theme }) => theme.spacing(3)}px;
`;

//
//
// M A I N - C O M P O N E N T
//
//

class RandomEntryCard extends Component {
  componentDidMount() {
    const { fetch } = this.props;
    fetch();
  }

  render() {
    const { entry, isFetching } = this.props;
    if (isFetching) {
      return <CircularProgress />;
    }
    if (entry && entry.id) {
      const detailPageV2Link =
        detailPageV2Links[locale] !== undefined
          ? detailPageV2Links[locale]
          : detailPageV2Links['*'];
      return (
        <RandomEntryLink
          href={`${detailPageV2Link}&category=entry&id=${entry.id}`}
          target="blank"
        >
          <EntryWrapper>
            <EntryData entry={entry} />
          </EntryWrapper>
        </RandomEntryLink>
      );
    }
    return <div />;
  }
}

RandomEntryCard.propTypes = {
  fetch: PropTypes.func.isRequired,
  isFetching: PropTypes.bool,
  entry: PropTypes.shape({
    id: PropTypes.number,
  }),
};

export default RandomEntryCard;
