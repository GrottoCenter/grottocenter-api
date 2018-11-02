import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Map, Marker, TileLayer} from 'react-leaflet'
import DivIcon from 'react-leaflet-div-icon';
import MapEntryPopup from './MapEntryPopup';
import _ from 'underscore.string';
//import {smallMarkerIcon, mainMarkerIcon} from '../../conf/Config';
import {focusZoom} from '../../conf/Config';
import Spinner from '../common/Spinner';
import styled from 'styled-components';

export const smallMarkerIcon = L.icon({
    iconUrl: '/images/gc-map-entry.svg',
    iconSize: [
      24, 24
    ],
    iconAnchor: [
      12, 24
    ],
    popupAnchor: [
      0, -24
    ]
    // shadowUrl: '/images/gc-entry.svg',
    // shadowSize: [68, 95],
    // shadowAnchor: [22, 94]
  }),
  mainMarkerIcon = L.icon({
    iconUrl: '/images/gc-entry.svg',
    iconSize: [
      48, 48
    ],
    iconAnchor: [
      16, 32
    ],
    popupAnchor: [0, -32]
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

class GCMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showSelectedEntry: true,
      showVisibleEntries: true,
      localize: true,
      initCenter: props.mapCenter,
      initZoom: props.mapZoom,
      showSpinner: false
    }
    this.getTarget = this.getTarget.bind(this);
  }

  getTarget() {
    return this.props.match.params ? this.props.match.params.target : undefined;
  }

  componentWillMount() {
    let encodedParam = this.getTarget();
    if (encodedParam && encodedParam.length > 0) {
      let decoded = atob(encodedParam);
      let params = decoded.split("&").reduce(function(prev, curr) {
        let p = curr.split("=");
        prev[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
        return prev;
      }, {});
      this.setState({
        initCenter: {
          lat: Number(params.lat),
          lng: Number(params.lng)
        },
        initZoom: Number(params.zoom),
      });
      this.updateReduxMapData({
        lat: Number(params.lat),
        lng: Number(params.lng)
        },
        Number(params.zoom)
      );
    }
  }

  componentDidMount() {
    if (this.state.localize
      && !this.props.selectedEntry
      && !this.getTarget()) {
      this.setState({
        localize: false
      });
      this.showSpinner();
      this.refs.map.leafletElement.locate({
        setView: true,
        maxZoom: focusZoom
      });
    } else {
      this.searchEntriesInBounds();
    }
  }

  updateReduxMapData(center, zoom) {
    if (center.lat !== this.props.mapCenter.lat
      || center.lng !== this.props.mapCenter.lng) {
      this.props.setLocation({
        lat: center.lat,
        lng: center.lng
      });
    }
    if (zoom && zoom !== this.props.mapZoom) {
      this.props.setZoom(zoom);
    }
  }

  showSpinner() {
    this.setState({
      showSpinner: true
    });
  }

  hideSpinner() {
    this.setState({
      showSpinner: false
    });
  }

  getLeafletCurrentBounds() {
    if (this.refs.map && this.refs.map.leafletElement) {
      let bounds = this.refs.map.leafletElement.getBounds()
      return {
        nw_lat: bounds._southWest.lat,
        nw_lng: bounds._southWest.lng,
        se_lat: bounds._northEast.lat,
        se_lng: bounds._northEast.lng
      };
    }
    return undefined;
  }

  searchEntriesInBounds() {
    let bounds = this.getLeafletCurrentBounds();
    if (bounds) {
      this.props.searchBounds(bounds);
    }
  }

  updateLocationUrl(coords, zoom) {
    let newUrl = window.location.pathname;
    let encodedLocation = btoa('lng=' + coords.lng + '&lat=' + coords.lat + '&zoom=' + zoom);
    if (this.getTarget()) {
      let pathname = _.strRightBack(window.location.pathname, '/');
      newUrl = _.replaceAll(window.location.pathname, pathname, encodedLocation);
    } else {
      newUrl += '/' + encodedLocation;
    }
    this.props.history.push(newUrl);
  }

  /* map events */
  handleMove() {
    let leafletMap = this.refs.map.leafletElement;
    let mapBounds = leafletMap.getBounds().getCenter();
    let zoom = leafletMap.getZoom();

    this.updateReduxMapData(mapBounds, zoom);
    this.updateLocationUrl(mapBounds, zoom);
    this.searchEntriesInBounds();
  }

  handleLocationFound() {
    let leafletMap = this.refs.map.leafletElement;
    let mapBounds = leafletMap.getBounds().getCenter();
    let zoom = leafletMap.getZoom();

    this.updateReduxMapData(mapBounds, zoom);
    this.hideSpinner();
  }

  handleLocationError() {
    this.hideSpinner();
  }

  render() {
    let zoom = this.state.initZoom;
    let center = this.state.initCenter;
    if (this.props.selectedEntry) {
      center = {
        lat: this.props.selectedEntry.latitude,
        lng: this.props.selectedEntry.longitude
      };
      zoom = focusZoom;
    }

    const marker = (this.props.selectedEntry)
      ? (<Marker icon={mainMarkerIcon} position={center} zIndexOffset={1000}>
        <MapEntryPopup entry={this.props.selectedEntry} />
      </Marker>)
      : null;

    let markersLayer = [];
    if (this.props.visibleEntries && this.props.visibleEntries.entries && this.props.visibleEntries.entries.length > 0) {
      let keyInc = 1;
      this.props.visibleEntries.entries.forEach((entry) => {
        let keyId = 'marker' + keyInc;
        if (!this.props.selectedEntry || entry.id !== this.props.selectedEntry.id) {
          if (entry.name === "group") {
            markersLayer.push(<GroupDivIcon key={keyId} position={{
                lat: entry.latitude,
                lng: entry.longitude
              }}>
              <div>
                <span>{entry.id}</span>
              </div>
            </GroupDivIcon>);
          } else {
            markersLayer.push(<Marker icon={smallMarkerIcon} key={keyId} position={{
                lat: entry.latitude,
                lng: entry.longitude
              }}>
              <MapEntryPopup entry={entry} />
            </Marker>);
          }
        }
        keyInc++;
      });
    }

    return (
      <Map
        className={this.props.className}
        ref='map'
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
        {this.state.showSpinner && <Spinner size={100} text='Localization'/>}
        <TileLayer url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'/>
        {marker}
        {markersLayer}
      </Map>
    );
  }
}

GCMap.propTypes = {
  className: PropTypes.string,
  selectedEntry: PropTypes.object,
  visibleEntries: PropTypes.object,
  searchBounds: PropTypes.func,
  mapCenter: PropTypes.object.isRequired,
  mapZoom: PropTypes.number.isRequired,
  setLocation: PropTypes.func.isRequired,
  setZoom: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
	match: PropTypes.object
};

export default GCMap;
