import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  Map, Marker, TileLayer, LayersControl, Tooltip,
} from 'react-leaflet';
import _ from 'underscore.string';
import { CoordinatesControl } from 'react-leaflet-coordinates';
import Control from 'react-leaflet-control';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import { withTheme } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import FormGroup from '@material-ui/core/FormGroup';
import MapEntryMarker from './map/MapEntryMarker';
import MapGrottoMarker from './map/MapGrottoMarker';
import MapEntryPopup from './map/MapEntryPopup';
import MapGrottosPopup from './map/MapGrottosPopup';
import { focusZoom } from '../../conf/Config';
import { markers } from '../../conf/MapMarkersConfig';
import Spinner from './Spinner';
import MapGroupIcon from './MapGroupIcon';
import Translate from './Translate';


//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const StyledMapGroupIcon = styled(MapGroupIcon)`
  background-color: rgba(36, 96, 255, 0.6);
  height: 30px !important;
  width: 30px !important;
  border-radius: 50%;
  z-index: 1000 !important;

  & > div {
    border-radius: 50%;
    height: 40px;
    width: 40px;
    margin-left: -5px;
    margin-top: -5px;
    text-align: center;
    background-color: rgba(83, 177, 251, 0.5);;

    & > span {
      line-height: 40px;
      font-weight: 600;
    }
  }
`;

const MarkersButton = withTheme()(styled(IconButton)`
  && { 
  background: ${props => props.theme.palette.backgroundButton}; 
  border: 1px solid;
  border-color: ${props => props.theme.palette.divider};
  border-radius: 4px; 
  padding: 0px;
  width: 45px;
  height: 45px;
  }
`);

const MarkersForm = withTheme()(styled(FormControl)`
  && { 
  background: ${props => props.theme.palette.backgroundButton};
  border: 1px solid;
  border-color: ${props => props.theme.palette.divider};
  border-radius: 4px; 
  padding: 0 10px;
  }
`);

export const smallMarkerIconList = markers.map(m => L.icon({
  iconUrl: m.url,
  iconSize: [
    24, 24,
  ],
  iconAnchor: [
    12, 24,
  ],
  popupAnchor: [
    0, -24,
  ],
}));

//
//
// M A I N - C O M P O N E N T
//
//

class GCMap extends Component {
  static propTypes = {
    className: PropTypes.string,
    selectedEntry: PropTypes.object,
    entriesMap: PropTypes.object,
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
    entriesMap: {
      qualityEntriesMap: [], groupEntriesMap: [], grottos: [], caves: [],
    },
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
      showListMarkers: true,
      markersChecked: [markers[0]],
    };

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
    const { mapZoom } = this.props;

    if (mapRef && mapRef.current.leafletElement) {
      const bounds = mapRef.current.leafletElement.getBounds();
      return {
        sw_lat: bounds.getSouthWest().lat,
        sw_lng: bounds.getSouthWest().lng,
        ne_lat: bounds.getNorthEast().lat,
        ne_lng: bounds.getNorthEast().lng,
        zoom: mapZoom,
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

  toggleShowMarkers = () => {
    this.setState({ showListMarkers: !this.state.showListMarkers });
  };

  onMarkerLayerChanged = (e) => {
    const m = markers.find(marker => marker.name === e.currentTarget.value);
    const listMarkersChecked = this.state.markersChecked;

    if (this.state.markersChecked.includes(m)) {
      // if the marker is checked
      this.setState({
        markersChecked: listMarkersChecked.filter(marker => marker !== m),
      });
    } else {
      listMarkersChecked.push(m);
      this.setState({
        markersChecked: listMarkersChecked,
      });
    }
  };

  handleOnClickGroup = (e) => {
    const { mapRef } = this.state;

    const leafletMap = mapRef.current.leafletElement;
    const mapBounds = e.latlng;
    const currentZoom = leafletMap.getZoom();

    let newZoom = currentZoom;
    if (currentZoom < 5) {
      newZoom = currentZoom + 3;
    } else {
      newZoom = currentZoom + 2;
    }

    this.setState({
      initCenter: mapBounds,
      initZoom: newZoom,
    });

    this.updateReduxMapData(mapBounds, newZoom);
    this.updateLocationUrl(mapBounds, newZoom);
  };

  render() {
    const {
      selectedEntry,
      entriesMap,
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

    let marker = null;

    if (selectedEntry) {
      switch (selectedEntry.type) {
        case 'grotto':
          marker = <MapGrottoMarker grotto={selectedEntry} position={center} />;
          break;
        default:
          marker = <MapEntryMarker entry={selectedEntry} position={center} />;
      }
    }

    const entriesMarkersLayer = [];
    if (entriesMap
      && entriesMap.qualityEntriesMap
      && entriesMap.qualityEntriesMap.length > 0) {
      entriesMap.qualityEntriesMap.forEach((entry) => {
        if (!selectedEntry || entry.id !== selectedEntry.id) {
          entriesMarkersLayer.push(
            <CircleMarker
              key={`entry_${entry.id}`}
              center={{
                lat: entry.latitude,
                lng: entry.longitude,
              }}
              color="white"
              fillColor="red"
              fillOpacity="1"
              weight="1"
              onClick={(e) => {
                e.target.closeTooltip();
              }}
            >
              <MapEntryPopup
                entry={entry}
              />
              <Tooltip direction="top">{entry.name}</Tooltip>
            </CircleMarker>,
          );
        }
      });
    }

    const cavesMarkersLayer = [];
    if (entriesMap
      && entriesMap.caves
      && entriesMap.caves.length > 0) {
      entriesMap.caves.forEach((cave) => {
        cavesMarkersLayer.push(
          <Marker
            icon={smallMarkerIconList[1]}
            key={`cave${cave.id}`}
            position={{
              lat: cave.latitude,
              lng: cave.longitude,
            }}
          />,
        );
      });
    }

    const grottosMarkersLayer = [];
    if (entriesMap
      && entriesMap.grottos
      && entriesMap.grottos.length > 0) {
      entriesMap.grottos.forEach((grotto) => {
        grottosMarkersLayer.push(
          <Marker
            icon={smallMarkerIconList[3]}
            key={`grotto_${grotto.id}`}
            position={{
              lat: grotto.latitude,
              lng: grotto.longitude,
            }}
          />,
        );
      });
    }

    const groupsMarkersLayer = [];
    if (entriesMap
      && entriesMap.groupEntriesMap
      && entriesMap.groupEntriesMap.length > 0) {
      entriesMap.groupEntriesMap.forEach((group, index) => {
        groupsMarkersLayer.push(
          <StyledMapGroupIcon
            key={`group_${index}`}
            position={{
              lat: group.latitude,
              lng: group.longitude,
            }}
            text={`${group.number}`}
            handleOnClick={this.handleOnClickGroup}
          />,
        );
      });
    }

    const markersInput = markers.map(m => (
      <FormControlLabel
        control={<Checkbox value={m.name} checked={this.state.markersChecked.includes(m)} onChange={this.onMarkerLayerChanged} />}
        label={(
          <React.Fragment>
            <img src={m.url} width="20px" style={{ marginRight: '5px' }} alt="" />
            <span style={{ fontSize: 'small' }}><Translate>{m.name}</Translate></span>
          </React.Fragment>
        )}
      />
    ));

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

        <Control position="topright">
          { this.state.showListMarkers ? (
            <MarkersButton onMouseOver={() => this.toggleShowMarkers()}>
              <MenuIcon />
            </MarkersButton>
          ) : (
            <MarkersForm onMouseLeave={() => this.toggleShowMarkers()}>
              <FormGroup>
                {markersInput}
              </FormGroup>
            </MarkersForm>
          )
          }
        </Control>


        <LayersControl position="topleft">
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OpenStreetMap Basic" checked>
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <CoordinatesControl
          position="bottomleft"
          coordinates="decimal"
          style={{ width: '380px', height: '35px', background: 'white' }}
        />

        {marker}
        {this.state.markersChecked.includes(markers[0]) && entriesMarkersLayer}
        {this.state.markersChecked.includes(markers[0]) && groupsMarkersLayer}
        {this.state.markersChecked.includes(markers[1]) && cavesMarkersLayer}
        {this.state.markersChecked.includes(markers[3]) && grottosMarkersLayer}

      </Map>
    );
  }
}

export default GCMap;
