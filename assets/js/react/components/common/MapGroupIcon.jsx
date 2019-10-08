import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Marker } from 'react-leaflet';
import { divIcon } from 'leaflet';

//
//
// M A I N - C O M P O N E N T
//
//

class MapGroupIcon extends Component {
  static propTypes = {
    className: PropTypes.string.isRequired,
    position: PropTypes.shape({
      lng: PropTypes.number,
      lat: PropTypes.number,
    }).isRequired,
    text: PropTypes.string.isRequired,
    handleOnClick: PropTypes.func.isRequired,
  };

  render() {
    const icon = divIcon({
      className: `${this.props.className}`,
      html: `<div><span>${this.props.text}</span></div>`,
    });

    return (
      <Marker
        position={this.props.position}
        icon={icon}
        onClick={this.props.handleOnClick}
      />
    );
  }
}

export default MapGroupIcon;
