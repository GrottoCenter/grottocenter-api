import React, { useContext } from 'react';
import { is, pipe, length, equals, all, allPass } from 'ramda';
import { renderToString } from 'react-dom/server';
import { Map as LeafletMap, Marker, TileLayer } from 'react-leaflet';
import styled from 'styled-components';
import { isMobileOnly } from 'react-device-detect';
import { Icon } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import { divIcon, Point } from 'leaflet';
import { EntryContext } from './Provider';

const EntryIconMap = () => (
  <Icon
    color="inherit"
    style={{ textAlign: 'center', height: '100%', width: '100%' }}
  >
    <img
      alt="entryIcon"
      style={{ height: '100%' }}
      src="../../../../../images/iconsV3/map/entry.svg"
    />
  </Icon>
);

const leafletEntryIcon = divIcon({
  html: renderToString(<EntryIconMap />),
  iconSize: new Point(25, 50),
  iconAnchor: [12.5, 50],
  className: '',
});

const Map = styled(LeafletMap)`
  width: auto;
  height: ${isMobileOnly ? '220' : '300'}px;
  position: relative;
  margin-bottom: ${({ theme }) => theme.spacing(2)}px;
`;

const MapSkeleton = styled(Skeleton)`
  width: auto;
  height: ${isMobileOnly ? '220' : '300'}px;
  position: relative;
  margin-bottom: ${({ theme }) => theme.spacing(2)}px;
`;

const isPair = pipe(length, equals(2));
export const isValidCoordinates = allPass([is(Array), all(is(Number)), isPair]);

const EntryMap = () => {
  const {
    state: { position, loading },
  } = useContext(EntryContext);

  return (
    <>
      {!isValidCoordinates(position) || loading ? (
        <MapSkeleton variant="rect" />
      ) : (
        <Map
          center={position}
          zoom={15}
          maxZoom={20}
          dragging={false}
          viewport={null}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={position} icon={leafletEntryIcon} />
        </Map>
      )}
    </>
  );
};

export default EntryMap;
