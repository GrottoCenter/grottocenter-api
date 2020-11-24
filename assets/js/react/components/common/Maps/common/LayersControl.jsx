import React from 'react';
import { head, pluck } from 'ramda';
import {
  LayersControl as LeafletLayersControl,
  TileLayer,
} from 'react-leaflet';
import PropTypes from 'prop-types';

import layers from './mapLayers';

const possibleLayers = pluck('name', layers);

const LayersControl = ({
  position = 'topleft',
  initialLayerChecked = head(possibleLayers),
}) => (
  <LeafletLayersControl position={position}>
    {layers.map((layer) => (
      <LeafletLayersControl.BaseLayer
        key={layer.name}
        checked={layer.name === initialLayerChecked}
        name={layer.name}
      >
        <TileLayer attribution={layer.attribution} url={layer.url} />
      </LeafletLayersControl.BaseLayer>
    ))}
  </LeafletLayersControl>
);

LayersControl.propTypes = {
  position: PropTypes.oneOf([
    'topright',
    'topleft',
    'bottomright',
    'bottomleft',
  ]),
  initialLayerChecked: PropTypes.oneOf(possibleLayers),
};

export default LayersControl;
