import React from 'react'
import { connect } from 'react-redux'
import { Map, Marker, Popup, TileLayer } from 'react-leaflet'

const position = [51.505, -0.09];
class GrottoMapClass extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        hasLocation: true,
        latlng: {
          lat: 51.505,
          lng: -0.09,
        },
        icon: L.icon({
                    iconUrl: '/images/gc-entry.svg',
                    iconSize: [32,32],
                    iconAnchor: [16,32],
                    popupAnchor: [0,-32],
                    // shadowUrl: '/images/gc-entry.svg',
                    // shadowSize: [68, 95],
                    // shadowAnchor: [22, 94]
                }),
      };
    //   var leaftletMap = this.refs.map.leafletElement;
    //   window.leaftletMap = leaftletMap;
    //   console.log("leaftletMap",leaftletMap);
    }
    handleClick(e) {
        console.log("leaftletMap handleClick",e);
    }
    handleLocationFound(e) {//Fired when geolocation (using the locate method) went successfully.
        console.log("leaftletMap handleLocationFound",e);
    }
    handleLocationError(e) {
        console.log("leaftletMap handleLocationError");
    }
    render() {
        const marker = (this.props.marker != null && this.props.marker.latlng != null)
              ? (
                <Marker icon={this.state.icon} position={this.props.marker.latlng}>
                    <Popup>
                        <span>
                            {this.props.marker.name}
                            <br/>{this.props.marker.altitude}
                            <br/>{this.props.marker.author}
                        </span>
                    </Popup>
                </Marker>
              )
              : null;
        return (
            <Map
                 style={{width:"100%",height: "300px"}}
                 center={(this.props.marker) ? this.props.marker.latlng : undefined}
                 ref='map'
                 zoom={13}
                 length={4}
                 onClick={this.handleClick.bind(this)}
                 onLocationfound={this.handleLocationFound.bind(this)}
                 onLocationerror={this.handleLocationError.bind(this)}
                 >
                     <TileLayer
                       url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
                     />
                     {marker}
            </Map>
        );
    }
}
const mapStateToProps = (state) => {
  return {
    marker: state.marker
  }
}
const GrottoMap = connect(
  mapStateToProps
)(GrottoMapClass)
export default GrottoMap
