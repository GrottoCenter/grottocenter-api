import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  Map as LeafletMap,
  TileLayer,
  ScaleControl,
  Rectangle,
  Tooltip,
} from 'react-leaflet';
import _ from 'underscore.string';
import { CoordinatesControl } from 'react-leaflet-coordinates';
import Control from 'react-leaflet-control';
import MenuIcon from '@material-ui/icons/Menu';
import ConvertIcon from '@material-ui/icons/Transform';
import LayersIcon from '@material-ui/icons/Layers';
import {
  Checkbox,
  FormGroup,
  Button,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from '@material-ui/core';
import { withTheme } from '@material-ui/core/styles';
import PopPop from 'react-poppop';
import fetch from 'isomorphic-fetch';
import { isMobileOnly, isMobile } from 'react-device-detect';
import MapEntryMarker from './map/MapEntryMarker';
import MapSelectedEntryMarker from './map/MapSelectedEntryMarker';
import MapGrottoMarker from './map/MapGrottoMarker';
import MapSelectedGrottoMarker from './map/MapSelectedGrottoMarker';
import { focusZoom } from '../../conf/Config';
import { layers } from '../../conf/MapLayersConfig';
import { markers } from '../../conf/MapMarkersConfig';
import Spinner from './Spinner';
import MapGroupIcon from './MapGroupIcon';
import Convert from './map/Convert';
import Translate from './Translate';
import MapCaveMarker from './map/MapCaveMarker';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//
//
// width: calc(100% - ${({ isSideMenuOpen, theme }) =>
// isSideMenuOpen ? theme.sideMenuWidth : 0}px);

const Map = styled(LeafletMap)`
 width: calc(100% - ${({ isSideMenuOpen, theme }) =>
   isSideMenuOpen ? theme.sideMenuWidth : 0}px);
   //height: 1000px;
  height: calc(100vh - ${({ theme }) => theme.appBarHeight}px);
  // height: ${isMobileOnly ? 'calc(100% - 60px)' : 'calc(100% - 110px)'};
  position: fixed;
  //margin-left: -20px;
  //margin-top: -20px;
`;

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
    background-color: rgba(83, 177, 251, 0.5);

    & > span {
      line-height: 40px;
      font-weight: 600;
    }
  }
`;

const MarkersButton = withTheme(styled(IconButton)`
  && {
    background: ${(props) => props.theme.palette.backgroundButton};
    border: 1px solid;
    border-color: ${(props) => props.theme.palette.divider};
    border-radius: 4px;
    padding: 0px;
    width: 45px;
    height: 45px;
  }
`);

const MarkersForm = withTheme(styled(FormControl)`
  && {
    background: ${(props) => props.theme.palette.backgroundButton};
    border: 1px solid;
    border-color: ${(props) => props.theme.palette.divider};
    border-radius: 4px;
    padding: 0 10px;
  }
`);

const LayerButton = withTheme(styled(IconButton)`
  && {
    background: ${(props) => props.theme.palette.backgroundButton};
    border: 1px solid;
    border-color: ${(props) => props.theme.palette.divider};
    border-radius: 4px;
    padding: 0px;
    width: 45px;
    height: 45px;
  }
`);

const LayersForm = withTheme(styled(FormControl)`
  && {
    background: ${(props) => props.theme.palette.backgroundButton};
    border: 1px solid;
    border-color: ${(props) => props.theme.palette.divider};
    border-radius: 4px;
    padding: 0 10px;
  }
`);

const ConverterButton = withTheme(styled(Button)`
  && {
    background: ${(props) => props.theme.palette.backgroundButton};
    border: 1px solid;
    border-color: ${(props) => props.theme.palette.divider};
    padding: 0 10px;
  }
  ,
  &&:hover {
    background: ${(props) => props.theme.palette.backgroundButton};
  }
  ,
  &&:active {
    background: ${(props) => props.theme.palette.divider};
  }
`);

const StyledLegendText = styled.span`
  font-size: small;
`;

const ImageMarkerLegend = styled.img`
  width: 20px;
  margin-right: 5px;
  vertical-align: middle;
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
    entriesMap: PropTypes.object,
    searchBounds: PropTypes.func,
    mapCenter: PropTypes.object.isRequired,
    mapZoom: PropTypes.number.isRequired,
    setLocation: PropTypes.func.isRequired,
    setZoom: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    match: PropTypes.object,
    isSideMenuOpen: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    className: '',
    selectedEntry: null,
    entriesMap: {
      qualityEntriesMap: [],
      groupEntriesMap: [],
      grottos: [],
      caves: [],
    },
    searchBounds: () => {},
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
      showConvertPopup: false,
      currentLayer: layers[0],
      currentLayersAvailable: layers,
      showListLayers: true,
      projectionsList: [],
      layerBoundsToDisplay: 0,
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
      this.updateReduxMapData(
        {
          lat: Number(params.lat),
          lng: Number(params.lng),
        },
        Number(params.zoom),
      );
    }
  }

  componentDidMount() {
    const { selectedEntry } = this.props;
    const { localize, mapRef } = this.state;

    if (localize && !selectedEntry && !this.getTarget()) {
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

    fetch('/api/convert')
      .then((response) => response.json())
      .then((responseJson) => {
        console.log(responseJson);
        this.setState({ projectionsList: responseJson });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  getTarget = () => {
    const {
      match: { params },
    } = this.props;
    return params ? params.target : undefined;
  };

  updateReduxMapData = (center, zoom) => {
    const { mapCenter, setLocation, mapZoom, setZoom } = this.props;

    if (center.lat !== mapCenter.lat || center.lng !== mapCenter.lng) {
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
      newUrl = _.replaceAll(
        window.location.pathname,
        pathname,
        encodedLocation,
      );
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

    // Set the layers available depending on the map bounds
    const layersAvailableForMap = [];

    layers.forEach((layer) => {
      if (layer === this.state.currentLayer) {
        layersAvailableForMap.push(layer);
      } else if (leafletMap.getBounds().intersects(layer.bounds)) {
        layersAvailableForMap.push(layer);
      }
    });

    this.setState({
      currentLayersAvailable: layersAvailableForMap,
    });
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
    const m = markers.find((marker) => marker.name === e.currentTarget.value);
    const listMarkersChecked = this.state.markersChecked;

    if (this.state.markersChecked.includes(m)) {
      // if the marker is checked
      this.setState({
        markersChecked: listMarkersChecked.filter((marker) => marker !== m),
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

  toggleShowConverter = (showConvertPopup) => {
    this.setState({ showConvertPopup });
  };

  toggleShowLayers = () => {
    this.setState({ showListLayers: !this.state.showListLayers });
  };

  onLayerChanged = (e) => {
    layers.forEach((layer) => {
      if (layer.name === e.currentTarget.value) {
        this.setState({
          currentLayer: layer,
        });
      }
    });
  };

  toggleShowLayerBound = (layer) => {
    this.setState({ layerBoundsToDisplay: layer });
  };

  render() {
    const { selectedEntry, entriesMap, className } = this.props;
    const { initZoom, initCenter, showSpinner, mapRef } = this.state;

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
          marker = <MapSelectedGrottoMarker grotto={selectedEntry} />;
          break;
        default:
          marker = <MapSelectedEntryMarker selectedEntry={selectedEntry} />;
      }
    }

    const entriesMarkersLayer = [];
    if (
      entriesMap &&
      entriesMap.qualityEntriesMap &&
      entriesMap.qualityEntriesMap.length > 0
    ) {
      entriesMap.qualityEntriesMap.forEach((entry) => {
        if (!selectedEntry || entry.id !== selectedEntry.id) {
          entriesMarkersLayer.push(<MapEntryMarker entry={entry} />);
        }
      });
    }

    const cavesMarkersLayer = [];
    if (entriesMap && entriesMap.caves && entriesMap.caves.length > 0) {
      entriesMap.caves.forEach((cave) => {
        cavesMarkersLayer.push(<MapCaveMarker cave={cave} />);
      });
    }

    const grottosMarkersLayer = [];
    if (entriesMap && entriesMap.grottos && entriesMap.grottos.length > 0) {
      entriesMap.grottos.forEach((grotto) => {
        if (!selectedEntry || grotto.id !== selectedEntry.id) {
          grottosMarkersLayer.push(<MapGrottoMarker grotto={grotto} />);
        }
      });
    }

    const groupsMarkersLayer = [];
    if (
      entriesMap &&
      entriesMap.groupEntriesMap &&
      entriesMap.groupEntriesMap.length > 0
    ) {
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

    const markersInput = markers.map((m) => (
      <FormControlLabel
        key={m.name}
        control={
          <Checkbox
            value={m.name}
            checked={this.state.markersChecked.includes(m)}
            onChange={this.onMarkerLayerChanged}
          />
        }
        label={
          <React.Fragment>
            <ImageMarkerLegend src={m.url} alt="" />
            <StyledLegendText>
              <Translate>{m.name}</Translate>
            </StyledLegendText>
          </React.Fragment>
        }
      />
    ));

    const showConvertPopup = this.state.showConvertPopup;

    const layersInput = this.state.currentLayersAvailable.map((layer) => (
      <FormControlLabel
        key={layer.name}
        value={layer.name}
        control={<Radio />}
        label={
          <React.Fragment>
            <StyledLegendText>{layer.name}</StyledLegendText>
          </React.Fragment>
        }
        onMouseOver={this.toggleShowLayerBound.bind(this, layer)}
        onMouseLeave={this.toggleShowLayerBound.bind(this, 0)}
      />
    ));

    return (
      <Map
        isSideMenuOpen={this.props.isSideMenuOpen}
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

        <Control position="topright">
          {this.state.showListMarkers ? (
            <MarkersButton onMouseOver={() => this.toggleShowMarkers()}>
              <MenuIcon />
            </MarkersButton>
          ) : (
            <MarkersForm onMouseLeave={() => this.toggleShowMarkers()}>
              <FormGroup>{markersInput}</FormGroup>
            </MarkersForm>
          )}
        </Control>

        <ScaleControl position="bottomright" />

        <Control position="topleft">
          {this.state.showListLayers ? (
            <LayerButton onMouseOver={() => this.toggleShowLayers()}>
              <LayersIcon />
            </LayerButton>
          ) : (
            <LayersForm onMouseLeave={() => this.toggleShowLayers()}>
              <RadioGroup
                value={this.state.currentLayer.name}
                onChange={this.onLayerChanged}
              >
                {layersInput}
              </RadioGroup>
            </LayersForm>
          )}
        </Control>

        {!isMobile && this.state.layerBoundsToDisplay && (
          <Rectangle
            bounds={this.state.layerBoundsToDisplay.bounds}
            onAdd={(e) => {
              e.target.openTooltip();
            }}
          >
            <Tooltip>{`Zone d'application du fond de carte ${this.state.layerBoundsToDisplay.name}`}</Tooltip>
          </Rectangle>
        )}

        <TileLayer
          attribution={this.state.currentLayer.attribution}
          url={this.state.currentLayer.url}
        />

        {!isMobileOnly && (
          <CoordinatesControl
            position="bottomleft"
            coordinates="decimal"
            style={{ background: 'white', padding: '0 5px' }}
          />
        )}

        <Control position="bottomleft">
          <ConverterButton onClick={() => this.toggleShowConverter(true)}>
            <ConvertIcon />
            <Translate>Converter</Translate>
          </ConverterButton>
          <PopPop
            position="centerCenter"
            open={showConvertPopup}
            closeBtn
            closeOnEsc
            onClose={() => this.toggleShowConverter(false)}
            closeOnOverlay
          >
            <h1>
              <Translate>Converter</Translate>
            </h1>
            <Convert list={this.state.projectionsList} />
          </PopPop>
        </Control>

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
