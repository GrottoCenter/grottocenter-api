import React, { useEffect } from 'react';
import { pathOr, isNil } from 'ramda';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
// eslint-disable-next-line import/no-named-as-default
import Entry from '../components/appli/Entry';
import { fetchEntry } from '../actions/Entry';
import ScrollableContent from '../components/common/Layouts/Fixed/ScrollableContent';
import { detailPageV2Links } from '../conf/Config';

// eslint-disable-next-line react/prop-types
const Content = ({ title, children }) => {
  const { formatMessage } = useIntl();

  return (
    <ScrollableContent
      title={formatMessage({ id: title })}
      content={
        isNil(children) ? (
          <Typography>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
            mattis pretium massa. Aliquam erat volutpat. Nulla facilisi. Donec
            vulputate interdum sollicitudin. Nunc lacinia auctor quam sed
            pellentesque. Aliquam dui mauris, mattis quis lacus id, pellentesque
            lobortis odio.
          </Typography>
        ) : (
          children
        )
      }
    />
  );
};

const EntryPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { loading, data } = useSelector((state) => state.entry);
  const { formatMessage } = useIntl();

  useEffect(() => {
    dispatch(fetchEntry(id));
  }, [id]);

  const details = {
    id: data.id,
    name: data.name,
    localisation: `${data.city}, ${data.region}, ${data.country}`,
    depth: pathOr(0, ['cave', 'depth'], data),
    development: pathOr(0, ['cave', 'length'], data),
    coordinates:
      !isNil(data.longitude) && !isNil(data.latitude)
        ? [data.latitude, data.longitude]
        : null,
    interestRate: 2.5,
    progressionRate: 2.5,
    accessRate: 2.5,
    author: pathOr('Author', ['cave', 'author'], data),
    creationDate: pathOr(null, ['cave', 'dateInscription'], data),
    isDivingCave: pathOr(null, ['cave', 'isDiving'], data),
    mountain: pathOr(null, ['massif', 'name'], data),
  };

  const externalLink = `${
    detailPageV2Links[locale] !== undefined
      ? detailPageV2Links[locale]
      : detailPageV2Links['*']
  }&category=entry&id=${id}`;

  return (
    <Entry loading={loading} details={details} position={details.coordinates}>
      <Content title="Description">
        <Typography>
          {formatMessage({ id: 'For more details please visit ' })}
          <a href={externalLink} target="_blank" rel="noopener noreferrer">
            Grottocenter V2
          </a>
        </Typography>
      </Content>
      <Content title="Localisation" />
      <Content title="Topography" />
      <Content title="Equipments" />
      <Content title="History" />
      <Content title="Comments" />
      <Content title="Bibliography" />
    </Entry>
  );
};
export default EntryPage;
