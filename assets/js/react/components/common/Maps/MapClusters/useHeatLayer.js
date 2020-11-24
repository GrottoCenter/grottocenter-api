import { useMap } from 'react-leaflet';
import { useCallback, useEffect, useState } from 'react';
import { isNil } from 'ramda';
import * as L from 'leaflet';
// after L import
import '@asymmetrik/leaflet-d3';
import { brown, blue } from '@material-ui/core/colors';
import { createGlobalStyle } from 'styled-components';

export const ENTRANCE_HEAT_COLORS = ['white', brown['900']];
export const NETWORK_HEAT_COLORS = ['white', blue['900']];

export const HexGlobalCss = createGlobalStyle`
   & .hexbin-hexagon {
   stroke: #000;
   stroke-width: .5px;
   }
   & .hexbin-container:hover .hexbin-hexagon {
  transition: 200ms;
  stroke-width: 1.5px;
  stroke-opacity: 1;
  }
`;

const hexbinLayerOptions = {
  radius: 10,
  opacity: 0.7,
  duration: 600,
  colorScaleExtent: [1, undefined],
  radiusScaleExtent: [1, undefined],
  colorDomain: null,
  radiusDomain: null,
  colorRange: ['white', 'blue'],
  radiusRange: [5, 12],
  pointerEvents: 'all',
};

const useHeatLayer = (data = [], options = hexbinLayerOptions) => {
  const map = useMap();
  const [hexLayer, setHexLayer] = useState();

  const updateHeatData = useCallback(
    (newData, colorRange = ENTRANCE_HEAT_COLORS) => {
      if (!isNil(hexLayer)) {
        hexLayer.colorRange(colorRange).data(newData);
      }
    },
    [hexLayer],
  );
  useEffect(() => {
    // Add hex layer to the map
    setHexLayer(L.hexbinLayer(options).addTo(map));
  }, []);

  useEffect(() => {
    if (!isNil(hexLayer)) {
      hexLayer.colorScale();

      hexLayer
        .radiusRange([6, 11])
        .lng((d) => d[0])
        .lat((d) => d[1])
        .colorValue((d) => d.length)
        .radiusValue((d) => d.length)
        .hoverHandler(
          L.HexbinHoverHandler.compound({
            handlers: [
              L.HexbinHoverHandler.resizeFill(),
              // L.HexbinHoverHandler.tooltip(),
            ],
          }),
        );

      updateHeatData(data);
    }
  }, [hexLayer]);

  return {
    updateHeatData,
  };
};

export default useHeatLayer;
