import React, {Component, PropTypes} from 'react';
import {Map, Marker, Popup, TileLayer} from 'react-leaflet'
import _ from 'underscore.string';
//import {smallMarkerIcon, mainMarkerIcon} from '../../conf/Config';
import {defaultCoord, defaultZoom} from '../../conf/Config';
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
    ],
    // shadowUrl: '/images/gc-entry.svg',
    // shadowSize: [68, 95],
    // shadowAnchor: [22, 94]
  }),
  mainMarkerIcon = L.icon({
    iconUrl: '/images/gc-entry.svg',
    iconSize: [
      32, 32
    ],
    iconAnchor: [
      16, 32
    ],
    popupAnchor: [0, -32]
  });

const OverAllMarker = styled(Marker)`
  z-index: 999;
`;

class GCMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showSelectedEntry: true,
      showVisibleEntries: true,
      localize: false,
      location: defaultCoord,
      zoom: defaultZoom
    }
  }

  componentWillMount() {
    let encodedParam = this.props.params.target;
    if (encodedParam && encodedParam.length > 0) {
      let decoded = atob(encodedParam);
      let params = decoded.split("&").reduce(function(prev, curr) {
        var p = curr.split("=");
        prev[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
        return prev;
      }, {});
      this.updateMapData(Number(params.lng), Number(params.lat), Number(params.zoom));
    }
  }

  componentDidMount() {
    if (!this.props.selectedEntry && !this.props.params.target) {
      this.refs.map.leafletElement.locate({setView: true});
    }
    let bounds = this.getCurrentBounds();
    if (bounds) {
      this.props.searchBounds(bounds);
    }
  }

  updateMapData(longitude, latitude, zoom) {
    this.props.setLocation({lat: latitude, lng: longitude});
    this.setState({
      location: {
        lat: latitude,
        lng: longitude
      }
    });
    if (zoom) {
      this.props.setZoom(zoom);
      this.setState({zoom: zoom});
    }
  }

  getCurrentBounds() {
    if (this.refs.map && this.refs.map.leafletElement) {
      let bounds = this.refs.map.leafletElement.getBounds()
      let queryString = {
        ne_lat: bounds._northEast.lat,
        ne_lng: bounds._northEast.lng,
        sw_lat: bounds._southWest.lat,
        sw_lng: bounds._southWest.lng
      };
      return queryString;
    }
    return undefined;
  }

  updateLocationUrl(coords, zoom) {
    let newUrl = window.location.pathname;
    let encodedLocation = btoa('lng=' + coords.lng + '&lat=' + coords.lat + '&zoom=' + zoom);
    if (this.props.params.target) {
      let pathname = _.strRightBack(window.location.pathname, '/');
      newUrl = _.replaceAll(window.location.pathname, pathname, encodedLocation);
    } else {
      newUrl += '/' + encodedLocation;
    }
    this.props.history.push(newUrl);
  }

  /* map events */
  handleMove() {
    console.log("handleMove");
    let leaftletMap = this.refs.map.leafletElement;
    let mapBounds = leaftletMap.getBounds().getCenter();
    let zoom = leaftletMap.getZoom();
    this.props.setLocation({lat: mapBounds.lat, lng: mapBounds.lng});
    this.props.setZoom(zoom);
    this.updateLocationUrl(mapBounds, zoom);

    let bounds = this.getCurrentBounds();
    if (bounds) {
      this.props.searchBounds(bounds);
    }
  }

  render() {
    let center = this.state.location;
    if (this.props.selectedEntry) {
      center = {
        lat: this.props.selectedEntry.latitude,
        lng: this.props.selectedEntry.longitude
      };
    }

    const marker = (this.props.selectedEntry)
      ? (<OverAllMarker icon={mainMarkerIcon} position={center}>
        <Popup>
          <span>
            {this.props.selectedEntry.text}
            <br/>{this.props.selectedEntry.altitude}
            <br/>{this.props.selectedEntry.author}
          </span>
        </Popup>
      </OverAllMarker>)
      : null;

    let boundedData = this.props.visibleEntries;
    if (boundedData && boundedData.length > 0 && this.props.selectedEntry) {
      boundedData = boundedData.filter(item => item.id !== this.props.selectedEntry.id);
    }

    return (
      <Map
        className={this.props.className}
        ref='map'
        center={center}
        zoom={this.state.zoom}
        length={4}
        // onClick={this.handleEvent.bind(this)}
        // onFocus={this.handleEvent.bind(this)}
        // onAutoPanStart={this.handleEvent.bind(this)}
        // onZoomStart={this.handleEvent.bind(this)}
        // onDrag={this.handleEvent.bind(this)}
        // onZoomEnd={this.handleEvent.bind(this)}
        // onViewReset={this.handleEvent.bind(this)}
        onMoveEnd={this.handleMove.bind(this)}
        // onLocationFound={this.handleEvent.bind(this)}
        // onLocationError={this.handleEvent.bind(this)}
        >

      <TileLayer url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'/> {marker}
      {

        boundedData && boundedData.map(entry => <Marker icon={smallMarkerIcon} key={entry.id} position={{
            lat: entry.latitude,
            lng: entry.longitude
          }}>
          <Popup>
            <span>
              <b>{entry.name}</b>
              {
                Object.keys(entry).map(key => <div key={key}>
                  <i>{key}</i>
                  {entry[key]}</div>)
              }
            </span>
          </Popup>
        </Marker>)
      }
    </Map>);
  }
}

GCMap.propTypes = {
  className: PropTypes.string,
  selectedEntry: PropTypes.object,
  visibleEntries: PropTypes.array,
  searchBounds: PropTypes.func,
  setLocation: PropTypes.func.isRequired,
  setZoom: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  params: PropTypes.object
};

export default GCMap;
