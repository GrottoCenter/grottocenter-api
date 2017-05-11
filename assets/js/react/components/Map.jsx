import React, {PropTypes} from 'react';
import { connect } from 'react-redux'
import { Map, Marker, Popup, TileLayer } from 'react-leaflet'

import { showMarker } from './../actions/Search';

import AutoComplete from 'material-ui/AutoComplete';
import MenuItem from 'material-ui/MenuItem';
import ExploreIcon from 'material-ui/svg-icons/action/explore';
import muiThemeable from 'material-ui/styles/muiThemeable';
import I18n from 'react-ghost-i18n';

import { OpenStreetMapProvider } from 'leaflet-geosearch';
const provider = new OpenStreetMapProvider();
const smallMarkerIcon = L.icon({
    iconUrl: '/images/gc-map-entry.svg',
    iconSize: [24,24],
    iconAnchor: [12,24],
    popupAnchor: [0,-24],
    // shadowUrl: '/images/gc-entry.svg',
    // shadowSize: [68, 95],
    // shadowAnchor: [22, 94]
});
const mainMarkerIcon = L.icon({
    iconUrl: '/images/gc-entry.svg',
    iconSize: [32,32],
    iconAnchor: [16,32],
    popupAnchor: [0,-32],
});
class GrottoMapClass extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        hasLocation: true,
        latlng: {
          lat: null,
          lng: null,
        },
        searchResultList: [],
        entries:[]
      };

    }
    componentDidMount() {
      this.onUpdateMapBounds();
      this.refs.map.leafletElement.locate();
    }
    onNewRequest(chosenRequest) {
      console.log('onNewRequest',chosenRequest);
      if (chosenRequest.isMappable ) {
        if (chosenRequest.category!="geo-place") {
          this.props.dispatch(showMarker(chosenRequest));// useless for fullscreen Map only component
        }
        this.setState({
          latlng: L.latLng({
            lat:chosenRequest.latitude,
            lng:chosenRequest.longitude
          })
        })
      }
      // if (chosenRequest.id) {
      //   window.open('http://www.grottocenter.org/html/file_En.php?lang=En&check_lang_auto=false&category='+chosenRequest.category+'&id='+chosenRequest.id,'GrottoV2Window');
      // }
    }

    isMappable(obj) { // TODO : move to models ?
      return obj.latitude && obj.longitude?true:false;
    }
    isEntry(obj) {
      // TODO : better when it will be possible
      return obj.isSensitive !== undefined;
    }
    GrottoSearchToMenuItemMapping(item) {
      let primaryText = item.name;
      if (this.isEntry(item)) {
        primaryText = [<span>{item.name}</span>, " - " , <i>{item.region}</i>]
      }

      let category ='entry';
      let icon = <span className="icon icon-gc-entry" style={{'color':this.props.muiTheme.palette.primary1Color,'fontSize': '2em'}}></span>;

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
        category:category,
        isMappable:this.isMappable(item),
        value: (
          <MenuItem
            primaryText={primaryText}
            leftIcon={icon}
          />
        )
      };
    }
    GeoSearchToMenuItemMapping(item) {
      let primaryText = item.label.substring(0,80);
      let icon = <ExploreIcon color={this.props.muiTheme.palette.primary1Color}/>;
      return {
        id: item.raw.osm_id,
        text: item.label,
        latitude: parseFloat(item.y),
        longitude: parseFloat(item.x),
        altitude: parseFloat(item.altitude),
        author: 'osm',
        category:'geo-place',
        isMappable:true,
        value: (
          <MenuItem
            primaryText={primaryText}
            leftIcon={icon}
          />
        )
      };
    }
    treatGrottoSearchResults(data) {
      this.printSearchResults( data.map(this.GrottoSearchToMenuItemMapping.bind(this)) );
    }
    treatGeoSearchResults(data) {
      this.printSearchResults( data.map(this.GeoSearchToMenuItemMapping.bind(this)) );
    }
    printSearchResults(mappedData) {
      var searchResultList = this.state.searchResultList
      .concat(mappedData)
      .sort((a, b) => {
        var textA = a.text.toLowerCase();
        var textB = b.text.toLowerCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
      })
      this.setState({
        searchResultList: searchResultList
      });
    }
    /*
        we perform 2 requests from the SearchBar :
        - geosearch for Nominatim OpenStreetMap using module leaflet-geosearch -> places
        - grotto api search/findAll -> cave entries
    */
    onUpdateInput(searchText) {
      this.setState({
        searchResultList: []
      });
      if (searchText.length < 3) {
        return;
      }
      provider
        .search({ query: searchText })
        .then(this.treatGeoSearchResults.bind(this));
      $.ajax({
        url: '/api/search/findAll?name=' +searchText,//TODO: optimize this service for autocomplete
        dataType: 'json',
        success: this.treatGrottoSearchResults.bind(this)
      });
    }
    onUpdateMapBounds() {
      this.setState({
        entries: []
      });
      var leaftletMap = this.refs.map.leafletElement;
      var mapBounds = leaftletMap.getBounds();
      var queryString = ''
      +  'ne_lat=' + mapBounds._northEast.lat
      + '&ne_lng=' + mapBounds._northEast.lng
      + '&sw_lat=' + mapBounds._southWest.lat
      + '&sw_lng=' + mapBounds._southWest.lng;
      $.ajax({
        url: '/api/search/findByBounds?' + queryString,
        dataType: 'json',
        success: this.treatFindByBoundsResults.bind(this)
      });
    }
    treatFindByBoundsResults(data) {
      if ( this.props.marker != null ) {
        data = data.filter(item => item.id !== this.props.marker.id);// TODO remove props.marker from list
      }
      this.setState({
        entries: data
      });
    }

/*
  map events
*/
    handleEvent() {
        // console.log("leaftletMap handleEvent",e);
    }
    handleLocationFound(e) {//Fired when geolocation (using the locate method) went successfully.
        // console.log("leaftletMap handleLocationFound",e);
        this.setState({
          hasLocation: true,
          latlng: e.latlng,
        })
    }
    handleLocationError() {
        // console.log("leaftletMap event",e.type,e);
    }
    handleMapViewReset() {
        // console.log("leaftletMap event",e.type,e);
        this.onUpdateMapBounds();
    }
    render() {
        const marker = (this.props.marker != null && this.props.marker.latlng != null)
              ? (
                <Marker icon={mainMarkerIcon} position={this.props.marker.latlng}>
                    <Popup>
                        <span>
                            {this.props.marker.text}
                            <br/>{this.props.marker.altitude}
                            <br/>{this.props.marker.author}
                        </span>
                    </Popup>
                </Marker>
              )
              : null;
        return (
          <div>
            <div>
              <AutoComplete
                className='searchAutoComplete'
                id='mapSearchField'
                style={{backgroundColor: this.props.muiTheme.palette.primary3Color, fontFamily: this.props.muiTheme.fontFamily, width: '100%'}}
                textFieldStyle={{whiteSpace: 'nowrap'}}
                floatingLabelText={<I18n></I18n>}
                dataSource={this.state.searchResultList}
                onUpdateInput={this.onUpdateInput.bind(this)}
                onNewRequest={this.onNewRequest.bind(this)}
                fullWidth={true}
                maxSearchResults={100}
                filter={AutoComplete.noFilter}
                popoverProps={{style: {height: '60%'}}}
                menuCloseDelay={2000}
                searchText={''}
              />
            </div>
            <Map
                 style={{width:"100%",height: "100%",position: 'absolute'}}
                 center={(this.props.marker) ? this.props.marker.latlng : undefined}
                 ref='map'
                 zoom={13}
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
                 onMoveEnd={this.handleMapViewReset.bind(this)}
                 >
                     <TileLayer
                       url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
                     />
                     {marker}
                     {this.state.entries.map(entry =>
                       <Marker icon={smallMarkerIcon} key={entry.id} position={{
                         lat: entry.latitude,
                         lng: entry.longitude
                       }}>
                         <Popup>
                             <span>
                                <b>{entry.name}</b>
                                {Object.keys(entry).map(key =>
                                <div key={key}><i>{key}</i>   {entry[key]}</div>
                                )}
                             </span>
                         </Popup>
                     </Marker>)}
            </Map>
          </div>
        );
    }
}
const mapStateToProps = (state) => {
  return {
    marker: state.marker
  }
}
GrottoMapClass.propTypes = {
  marker: PropTypes.object.isRequired,
  muiTheme: PropTypes.object.isRequired
};
const GrottoMap = connect(
  mapStateToProps
)(GrottoMapClass)
export default muiThemeable()(GrottoMap);
