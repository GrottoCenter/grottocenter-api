import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import 'leaflet.fullscreen';
import { useMapEvent } from 'react-leaflet';
import { without, pipe, append, uniq } from 'ramda';
import '@asymmetrik/leaflet-d3';

import DataControl, { heatmapTypes } from './DataControl';
import ConverterControl from '../common/Converter';
import useHeatLayer, {
  ENTRANCE_HEAT_COLORS,
  NETWORK_HEAT_COLORS,
  HexGlobalCss,
} from './useHeatLayer';
import Markers from './Markers';
import CustomMapContainer from '../common/MapContainer';

const MARKERS_LIMIT = 13;
const ZOOM_STATE = {
  MARKERS: 1,
  HEAT: 2,
};

// const usePosition = () => {
//   const map = useMapEvent('locationfound', (e) => {
//     console.log('locationfound!!', e);
//     // setPosition(e.latlng);
//     map.flyTo(e.latlng, map.getZoom());
//   });
//
//   useEffect(() => {
//     map.locate();
//     // const location = new Locate();
//     // location.addTo(map);
//   }, []);
// };

const useMapEventUpdateData = (initialZoom, updateData) => {
  const prevZoom = useRef(initialZoom);

  // TODO handle user location
  const map = useMapEvent('locationFound', () => {
    // console.log('locationFound');
    // handleUpdate();
  });
  useMapEvent('zoomend', () => {
    const isZoomingIn = prevZoom.current < map.getZoom();
    if (!isZoomingIn) {
      updateData();
    }
    prevZoom.current = map.getZoom();
  });
  useMapEvent('dragend', () => {
    updateData();
  });
};

const HydratedMap = ({
  entrances,
  entranceMarkers = [],
  networks,
  networkMarkers = [],
  organizations,
  projectionsList,
  zoom,
  onUpdate,
}) => {
  const { updateHeatData } = useHeatLayer(entrances);
  const [selectedHeat, setSelectedHeat] = useState('entrances');
  const [selectedMarkers, setSelectedMarkers] = useState([]);
  const [visibleHeat, setVisibleHeat] = useState(selectedHeat);
  const [visibleMarkers, setVisibleMarkers] = useState(selectedMarkers);
  const zoomState = useRef(ZOOM_STATE.HEAT);
  const prevZoom = useRef(zoom);

  const handleUpdateMarkers = (newSelection) => {
    setSelectedMarkers(newSelection);
    if (zoomState.current === ZOOM_STATE.MARKERS) {
      setVisibleMarkers(
        pipe(append(selectedHeat), uniq, without('none'))(newSelection),
      );
    } else {
      setVisibleMarkers(newSelection);
    }
  };
  const handleUpdateHeat = (newHeat) => {
    setSelectedHeat(newHeat);
    if (zoomState.current === ZOOM_STATE.HEAT) {
      setVisibleHeat(newHeat);
    } else {
      setVisibleMarkers(
        pipe(append(newHeat), uniq, without('none'))(selectedMarkers),
      );
    }
  };

  // on zoom handle what is visible between heat & markers
  const map = useMapEvent('zoomend', () => {
    const currentZoom = map.getZoom();
    const isZoomingIn = prevZoom.current < currentZoom;
    // When close enough we want to display disable heatmap ans show markers
    if (isZoomingIn && currentZoom >= MARKERS_LIMIT) {
      // do not update visible markers if it's already displayed
      if (zoomState.current !== ZOOM_STATE.MARKERS) {
        setVisibleMarkers(
          pipe(append(selectedHeat), uniq, without('none'))(selectedMarkers),
        );
        setVisibleHeat('none');
        zoomState.current = ZOOM_STATE.MARKERS;
      }
    }
    // When too far we want to switch back to the heatmap
    if (!isZoomingIn && currentZoom < MARKERS_LIMIT) {
      setVisibleHeat(selectedHeat);
      setVisibleMarkers(selectedMarkers);
      zoomState.current = ZOOM_STATE.HEAT;
    }
    prevZoom.current = currentZoom;
  });

  const handleUpdate = () => {
    onUpdate({
      heat: visibleHeat === 'none' ? null : visibleHeat,
      markers: visibleMarkers,
      zoom: map.getZoom(),
      center: map.getBounds().getCenter(),
      bounds: map.getBounds(),
    });
  };

  // Update data on leaflet events or user events
  useMapEventUpdateData(zoom, handleUpdate);
  useEffect(() => {
    handleUpdate();
  }, [visibleMarkers, visibleHeat]);

  // Update visible heat layer
  useEffect(() => {
    switch (visibleHeat) {
      case heatmapTypes.ENTRANCES:
        updateHeatData(entrances, ENTRANCE_HEAT_COLORS);
        break;
      case heatmapTypes.NETWORKS:
        updateHeatData(networks, NETWORK_HEAT_COLORS);
        break;
      default:
        updateHeatData([]);
    }
  }, [visibleHeat, networks, entrances]);

  return (
    <>
      <HexGlobalCss visibleHeat={visibleHeat} />
      <DataControl
        updateHeatmap={handleUpdateHeat}
        updateMarkers={handleUpdateMarkers}
      />
      <ConverterControl projectionsList={projectionsList} />
      <Markers
        visibleMarkers={visibleMarkers}
        organizations={organizations}
        networks={networkMarkers}
        entrances={entranceMarkers}
      />
    </>
  );
};

const Index = ({ center, zoom, isSideMenuOpen, ...props }) => (
  <CustomMapContainer
    center={center}
    zoom={zoom}
    isSideMenuOpen={isSideMenuOpen}
  >
    <HydratedMap {...props} zoom={zoom} />
  </CustomMapContainer>
);

const markerType = PropTypes.shape({
  latitude: PropTypes.number.isRequired,
  longitude: PropTypes.number.isRequired,
  id: PropTypes.number.isRequired,
  name: PropTypes.string,
});

HydratedMap.propTypes = {
  entrances: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  entranceMarkers: PropTypes.arrayOf(markerType),
  networks: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  networkMarkers: PropTypes.arrayOf(markerType),
  organizations: PropTypes.arrayOf(markerType),
  projectionsList: PropTypes.arrayOf(PropTypes.any),
  zoom: PropTypes.number.isRequired,
  onUpdate: PropTypes.func,
};

Index.propTypes = {
  isSideMenuOpen: PropTypes.bool,
  center: PropTypes.arrayOf(PropTypes.number).isRequired,
  ...HydratedMap.propTypes,
};

export default Index;
