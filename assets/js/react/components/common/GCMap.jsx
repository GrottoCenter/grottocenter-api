import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Map, Marker, TileLayer } from 'react-leaflet';
import DivIcon from 'react-leaflet-div-icon';
import _ from 'underscore.string';
import styled from 'styled-components';
import MapEntryPopup from './MapEntryPopup';
// import {smallMarkerIcon, mainMarkerIcon} from '../../conf/Config';
import { focusZoom } from '../../conf/Config';
import Spinner from './Spinner';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

export const smallMarkerIcon = L.icon({
  iconUrl: '/images/gc-map-entry.svg',
  iconSize: [
    24, 24,
  ],
  iconAnchor: [
    12, 24,
  ],
  popupAnchor: [
    0, -24,
  ],
  // shadowUrl: '/images/gc-entry.svg',
  // shadowSize: [68, 95],
  // shadowAnchor: [22, 94]
});


const mainMarkerIcon = L.icon({
  iconUrl: '/images/gc-entry.svg',
  iconSize: [
    48, 48,
  ],
  iconAnchor: [
    16, 32,
  ],
  popupAnchor: [0, -32],
});

const GroupDivIcon = styled(DivIcon)`
  background-color: rgba(36, 96, 255, 0.6);
  height: 40px !important;
  width: 40px !important;
  border-radius: 50%;
  z-index: 1000 !important;

  & > div {
    border-radius: 50%;
    height: 50px;
    width: 50px;
    margin-left: -5px;
    margin-top: -5px;
    text-align: center;
    background-color: rgba(83, 177, 251, 0.5);;

    & > span {
      line-height: 50px;
      font-weight: 600;
    }
  }
`;

//
//
// M A I N - C O M P O N E N T
//
//

class GCMap extends Component {
  static propTypes = {
    className: PropTypes.string,
    selectedEntry: PropTypes.object,
    visibleEntries: PropTypes.object,
    searchBounds: PropTypes.func,
    mapCenter: PropTypes.object.isRequired,
    mapZoom: PropTypes.number.isRequired,
    setLocation: PropTypes.func.isRequired,
    setZoom: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    match: PropTypes.object,
  };

  static defaultProps = {
    className: '',
    selectedEntry: null,
    visibleEntries: null,
    searchBounds: (() => {}),
    match: {},
  };

  constructor(props) {
    super(props);
    this.state = {
      mapRef: React.createRef(),
      localize: true,
      initCenter: props.mapCenter,
      initZoom: props.mapZoom,
      showSpinner: false,
    };
  }

  componentWillMount() {
    const encodedParam = this.getTarget();
    if (encodedParam && encodedParam.length > 0) {
      const decoded = Buffer.from(encodedParam, 'base64').toString();
      const params = decoded.split('&').reduce((prev, curr) => {
        const p = curr.split('=');
        prev[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
        return prev;
      }, {});
      this.setState({
        initCenter: {
          lat: Number(params.lat),
          lng: Number(params.lng),
        },
        initZoom: Number(params.zoom),
      });
      this.updateReduxMapData({
        lat: Number(params.lat),
        lng: Number(params.lng),
      },
      Number(params.zoom));
    }
  }

  componentDidMount() {
    const { selectedEntry } = this.props;
    const {
      localize,
      mapRef,
    } = this.state;

    if (localize
      && !selectedEntry
      && !this.getTarget()) {
      this.setState({
        localize: false,
      });
      this.toggleSpinner(true);
      if (mapRef) {
        mapRef.current.leafletElement.locate({
          setView: true,
          maxZoom: focusZoom,
        });
      }
    } else {
      this.searchEntriesInBounds();
    }
  }

  getTarget = () => {
    const { match: { params } } = this.props;
    return params ? params.target : undefined;
  };

  updateReduxMapData = (center, zoom) => {
    const {
      mapCenter,
      setLocation,
      mapZoom,
      setZoom,
    } = this.props;

    if (center.lat !== mapCenter.lat
      || center.lng !== mapCenter.lng) {
      setLocation({
        lat: center.lat,
        lng: center.lng,
      });
    }
    if (zoom && zoom !== mapZoom) {
      setZoom(zoom);
    }
  };

  toggleSpinner = (showSpinner) => {
    this.setState({ showSpinner });
  };

  getLeafletCurrentBounds = () => {
    const { mapRef } = this.state;

    if (mapRef && mapRef.current.leafletElement) {
      const bounds = mapRef.current.leafletElement.getBounds();
      return {
        nw_lat: bounds._southWest.lat,
        nw_lng: bounds._southWest.lng,
        se_lat: bounds._northEast.lat,
        se_lng: bounds._northEast.lng,
      };
    }
    return undefined;
  };

  searchEntriesInBounds = () => {
    const { searchBounds } = this.props;

    const bounds = this.getLeafletCurrentBounds();
    if (bounds) {
      searchBounds(bounds);
    }
  };

  updateLocationUrl = (coords, zoom) => {
    const { history } = this.props;

    let newUrl = window.location.pathname;
    const coordPath = `lng=${coords.lng}&lat=${coords.lat}&zoom=${zoom}`;
    const encodedLocation = Buffer.from(coordPath).toString('base64');

    if (this.getTarget()) {
      const pathname = _.strRightBack(window.location.pathname, '/');
      newUrl = _.replaceAll(window.location.pathname, pathname, encodedLocation);
    } else {
      newUrl += `/${encodedLocation}`;
    }
    history.push(newUrl);
  };

  /* map events */
  handleMove = () => {
    const { mapRef } = this.state;

    const leafletMap = mapRef.current.leafletElement;
    const mapBounds = leafletMap.getBounds().getCenter();
    const zoom = leafletMap.getZoom();

    this.updateReduxMapData(mapBounds, zoom);
    this.updateLocationUrl(mapBounds, zoom);
    this.searchEntriesInBounds();
  };

  handleLocationFound = () => {
    const { mapRef } = this.state;

    const leafletMap = mapRef.current.leafletElement;
    const mapBounds = leafletMap.getBounds().getCenter();
    const zoom = leafletMap.getZoom();

    this.updateReduxMapData(mapBounds, zoom);
    this.toggleSpinner(false);
  };

  handleLocationError = () => {
    this.toggleSpinner(false);
  };

  render() {
    const {
      selectedEntry,
      visibleEntries,
      className,
    } = this.props;
    const {
      initZoom,
      initCenter,
      showSpinner,
      mapRef,
    } = this.state;

    let zoom = initZoom;
    let center = initCenter;
    if (selectedEntry) {
      center = {
        lat: selectedEntry.latitude,
        lng: selectedEntry.longitude,
      };
      zoom = focusZoom;
    }

    const marker = (selectedEntry)
      ? (
        <Marker icon={mainMarkerIcon} position={center} zIndexOffset={1000}>
          <MapEntryPopup entry={selectedEntry} />
        </Marker>
      )
      : null;

    const markersLayer = [];
    if (visibleEntries
      && visibleEntries.entries
      && visibleEntries.entries.length > 0) {
      let keyInc = 1;
      visibleEntries.entries.forEach((entry) => {
        if (!selectedEntry || entry.id !== selectedEntry.id) {
          if (entry.name === 'group') {
            markersLayer.push(
              <GroupDivIcon
                key={`group_${keyInc}`}
                position={{
                  lat: entry.latitude,
                  lng: entry.longitude,
                }}
              >
                <div>
                  <span>{entry.id}</span>
                </div>
              </GroupDivIcon>
            );
          } else {
            markersLayer.push(
              <Marker
                icon={smallMarkerIcon}
                key={`entry_${entry.id}`}
                position={{
                  lat: entry.latitude,
                  lng: entry.longitude,
                }}
              >
                <MapEntryPopup
                  entry={entry}
                />
              </Marker>
            );
          }
        }
        keyInc += 1;
      });
    }

    return (
      <Map
        className={className}
        ref={mapRef}
        center={center}
        zoom={zoom}
        length={4}
        // onClick={() => this.handleMove()}
        // onFocus={() => this.handleMove()}
        // onAutoPanStart={() => this.handleMove()}
        // onZoomStart={() => this.handleMove()}
        // onDrag={() => this.handleMove()}
        // onZoomEnd={() => this.handleMove()}
        // onViewReset={() => this.handleMove()}
        onMoveEnd={() => this.handleMove()}
        onLocationFound={() => this.handleLocationFound()}
        onLocationError={() => this.handleLocationError()}
      >
        {showSpinner && <Spinner size={100} text="Localization" />}
        <TileLayer url="http://{s}.tile.osm.org/{z}/{x}/{y}.png" />
        {marker}
        {markersLayer}
      </Map>
    );
  }
}

export default GCMap;
