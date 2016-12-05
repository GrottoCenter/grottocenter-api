import React from 'react';

import {GoogleMapLoader, GoogleMap, Marker} from "react-google-maps";

export default class SimpleMapExample extends React.Component {
    constructor(props) {
      super(props);
      this.state = {lat: -25.363882, lng: 131.044922};

    }
    handleCenterChange(coord) {
        this.setState(coord);
    }
    render() {
        return (
            <section style={{height: "100%"}}>
                  <GoogleMapLoader
                    containerElement={
                      <div
                        style={{
                          height: "300px",
                          width:"100%"
                        }}
                      />
                    }
                    googleMapElement={
                      <GoogleMap
                        defaultZoom={8}
                        defaultCenter={this.state}
                      >

                      </GoogleMap>
                    }
                  />
                </section>
        );
    }
}
