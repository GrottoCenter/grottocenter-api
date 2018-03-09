import React, {Component, PropTypes} from 'react';
import {Map, Marker, Popup, TileLayer} from 'react-leaflet'
import MenuItem from 'material-ui/MenuItem';
import ExploreIcon from 'material-ui/svg-icons/action/explore';
import I18n from 'react-ghost-i18n';
import muiThemeable from 'material-ui/styles/muiThemeable';
import {OpenStreetMapProvider} from 'leaflet-geosearch';

const provider = new OpenStreetMapProvider();

const smallMarkerIcon = L.icon({
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
});

const mainMarkerIcon = L.icon({
  iconUrl: '/images/gc-entry.svg',
  iconSize: [
    32, 32
  ],
  iconAnchor: [
    16, 32
  ],
  popupAnchor: [0, -32]
});

class GrottoMapClass extends Component {
  constructor(props) {
    super(props);
    console.log("map constructor");
    this.state = {
      hasLocation: false,
      latlng: {
        lat: 51.505,
        lng: -0.09
      },
      zoom: 13,
      searchResultList: [],
      entries: []
    };
  }

  componentWillMount() {
    console.log("componentWillMount", this.props.location.hash);
    let encodedParam = this.props.location.hash;
    if (encodedParam !== undefined & encodedParam.length > 1) {
      let decoded = atob(encodedParam.slice(1, encodedParam.length));
      let params = decoded.split("&").reduce(function(prev, curr) {
        var p = curr.split("=");
        prev[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
        return prev;
      }, {});

      this.setState({
        hasLocation: true,
        latlng: L.latLng({lat: params.lat, lng: params.lng}),
        zoom: Number(params.zoom)
      });
    }
  }

  componentDidMount() {
    console.log("componentDidMount", this.props.location.hash);
    //  else {
    //   this.refs.map.leafletElement.locate();
    // }
  }

  onNewRequest(chosenRequest) {
    console.log('onNewRequest', chosenRequest);
    if (chosenRequest.isMappable) {
      if (chosenRequest.category != "geo-place") {
        this.props.showMarker(chosenRequest); // useless for fullscreen Map only component
      }
      this.setState({
        latlng: L.latLng({lat: chosenRequest.latitude, lng: chosenRequest.longitude})
      })
    }
  }

  isMappable(obj) { // TODO : move to models ?
    return obj.latitude && obj.longitude
      ? true
      : false;
  }

  isEntry(obj) {
    // TODO : better when it will be possible
    return obj.isSensitive !== undefined;
  }

  grottoSearchToMenuItemMapping(item) {
    let primaryText = item.name;
    if (this.isEntry(item)) {
      primaryText = [
        <span>{item.name}</span>,
        " - ",
        <i>{item.region}</i>
      ]
    }

    let category = 'entry';
    let icon = <span className="icon icon-gc-entry" style={{
        'color' : this.props.muiTheme.palette.primary1Color,
        'fontSize' : '2em'
      }}></span>;

    // only search for entries at this time
    /*if (this.isCave(item)) {
      category = 'cave';
      icon = <MapIcon />;
    } else if (this.isGrotto(item)) {
      category = 'grotto';
    }*/

    return {
      id: item.id,
      text: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      altitude: item.altitude,
      author: item.author,
      category: category,
      isMappable: this.isMappable(item),
      value: (<MenuItem primaryText={primaryText} leftIcon={icon}/>)
    };
  }

  geoSearchToMenuItemMapping(item) {
    let primaryText = item.label.substring(0, 80);
    let icon = <ExploreIcon color={this.props.muiTheme.palette.primary1Color}/>;
    return {
      id: item.raw.osm_id,
      text: item.label,
      latitude: parseFloat(item.y),
      longitude: parseFloat(item.x),
      altitude: parseFloat(item.altitude),
      author: 'osm',
      category: 'geo-place',
      isMappable: true,
      value: (<MenuItem primaryText={primaryText} leftIcon={icon}/>)
    };
  }

  treatGrottoSearchResults(data) {
    this.printSearchResults(data.map(this.grottoSearchToMenuItemMapping.bind(this)));
  }

  treatGeoSearchResults(data) {
    this.printSearchResults(data.map(this.geoSearchToMenuItemMapping.bind(this)));
  }

  printSearchResults(mappedData) {
    var searchResultList = this.state.searchResultList.concat(mappedData).sort((a, b) => {
      var textA = a.text.toLowerCase();
      var textB = b.text.toLowerCase();
      return (textA < textB)
        ? -1
        : (textA > textB)
          ? 1
          : 0;
    })
    this.setState({searchResultList});
  }

  /*
      we perform 2 requests from the SearchBar :
      - geosearch for Nominatim OpenStreetMap using module leaflet-geosearch -> places
      - grotto api search/findAll -> cave entries
  */

  onUpdateMapBounds() {
    console.log("onUpdateMapBounds", this.refs.map.leafletElement.getBounds());
    this.setState({entries: []});
    var leaftletMap = this.refs.map.leafletElement;
    var mapBounds = leaftletMap.getBounds();
    var queryString = '' + 'ne_lat=' + mapBounds._northEast.lat + '&ne_lng='
    + mapBounds._northEast.lng + '&sw_lat=' + mapBounds._southWest.lat
    + '&sw_lng=' + mapBounds._southWest.lng;

    fetch('/api/search/findByBounds?' + queryString)
    .then((response) => {
      if (response.status >= 400) {
        // let errorMessage = 'Fetching ' + '/api/search/findByBounds?' + queryString
        //   + ' status: ' + response.status;
        return ""; // TODO Add IHM error managment
      }
      return response.text();
    })
    .then(text => this.treatFindByBoundsResults(JSON.parse(text)));
  }

  treatFindByBoundsResults(data) {
    if (this.props.marker != null) {
      data = data.filter(item => item.id !== this.props.marker.id); // TODO remove props.marker from list
    }
    this.setState({entries: data});
  }

  updateLocation(coords, zoom) {
    let encoded = btoa("lng=" + coords.lng + "&lat=" + coords.lat + "&zoom=" + zoom);
    window.location = window.location.origin + window.location.pathname
      + window.location.search + "#" + encoded;
  }

  /* map events */
  handleEvent() {
    console.log("map handleEvent", this.refs.map.leafletElement.getBounds());
    let leaftletMap = this.refs.map.leafletElement;
    let mapBounds = leaftletMap.getBounds().getCenter();
    let zoom = leaftletMap.getZoom();

    this.setState({
      latlng: L.latLng({lat: mapBounds.lat, lng: mapBounds.lng}),
      zoom: Number(zoom)
    });

    this.updateLocation(mapBounds, zoom);
  }

  handleLocationFound(e) { //Fired when geolocation (using the locate method) went successfully.
    this.setState({hasLocation: true, latlng: e.latlng});
  }

  handleLocationError() {
    // console.log("leaftletMap event",e.type,e);
  }

  handleMapViewReset() {
    // console.log("leaftletMap event",e.type,e);
    this.onUpdateMapBounds();
  }

  render() {
    console.log("MAP RENDER", this.props.marker);
    const marker = (this.props.marker != null && this.props.marker.latlng != null)
      ? (<Marker icon={mainMarkerIcon} position={this.props.marker.latlng}>
        <Popup>
          <span>
            {this.props.marker.text}
            <br/>{this.props.marker.altitude}
            <br/>{this.props.marker.author}
          </span>
        </Popup>
      </Marker>)
      : null;

    let center = this.state.latlng;
    if (this.props.marker) {
      center = {
        lat: this.props.marker.latitude,
        lng: this.props.marker.longitude
      };
    }

    return (
      <Map style={{
          width: "100%",
          height: "calc(100% - 128px)",
          position: 'fixed'
        }}
        ref='map'
        center={center}
        zoom={this.state.zoom}
        length={4}
        onClick={this.handleEvent.bind(this)}
        onLoad={this.handleEvent.bind(this)}
        onFocus={this.handleEvent.bind(this)}
        onLocationFound={this.handleLocationFound.bind(this)}
        onLocationError={this.handleLocationError.bind(this)}
        onAutoPanStart={this.handleEvent.bind(this)}
        onZoomStart={this.handleEvent.bind(this)}
        onDrag={this.handleEvent.bind(this)}
        onZoomEnd={this.handleEvent.bind(this)}
        onViewReset={this.handleEvent.bind(this)}
        onMoveEnd={this.handleMapViewReset.bind(this)}>

        <TileLayer url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'/> {marker}
        {
          this.state.entries.map(entry => <Marker icon={smallMarkerIcon} key={entry.id} position={{
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
      </Map>
    );
  }
}

GrottoMapClass.propTypes = {
  marker: PropTypes.object,
  muiTheme: PropTypes.object.isRequired
};

const BackgroundMap = (props) => (<GrottoMapClass {...props}/>);

export default muiThemeable()(BackgroundMap);
