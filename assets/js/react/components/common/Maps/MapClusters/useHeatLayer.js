import { useMap } from 'react-leaflet';
import { useCallback, useEffect, useState } from 'react';
import { isNil, pipe, pluck, map as rMap, reverse } from 'ramda';
import * as d3 from 'd3';
import 'd3-hexbin';
import * as L from 'leaflet';
// after L import
import '@asymmetrik/leaflet-d3';
import { createGlobalStyle } from 'styled-components';
import { useIntl } from 'react-intl';
import { heatmapTypes } from './DataControl';
import {
  MARKERS_LIMIT,
  ENTRANCE_HEAT_COLORS,
  NETWORK_HEAT_COLORS,
  HEX_FLY_TO_DURATION,
  HEX_RADIUS_RANGE,
  HEX_LAYER_OPTIONS,
} from './constants';

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
  & .hexbin-tooltip {
   padding: 8px;
   background: #616161e6;
   color: white;
   border-radius: 2px;
   font-size: 12px;
   font-weight: 400;
  }
`;

// For more customization see https://github.com/Asymmetrik/leaflet-d3 documentation

const convertD3Position = pipe(pluck('o'), rMap(reverse));

const useHeatLayer = (data = [], type = heatmapTypes.ENTRANCES) => {
  const { formatMessage } = useIntl();
  const map = useMap();
  const [hexLayer, setHexLayer] = useState();

  const updateHeatData = useCallback(
    (newData, newType = heatmapTypes.ENTRANCES) => {
      if (!isNil(hexLayer)) {
        // Remove previous tooltip (avoid some bug)
        d3.selectAll('.hexbin-tooltip').remove();

        hexLayer
          .colorRange(
            newType === heatmapTypes.NETWORKS
              ? NETWORK_HEAT_COLORS
              : ENTRANCE_HEAT_COLORS,
          )
          .hoverHandler(
            L.HexbinHoverHandler.compound({
              handlers: [
                L.HexbinHoverHandler.resizeFill(),
                L.HexbinHoverHandler.tooltip({
                  tooltipContent: (nbr) =>
                    `${nbr.length} ${formatMessage({ id: type })}`,
                }),
              ],
            }),
          )
          .data(newData);
      }
    },
    [hexLayer],
  );

  const flyToHex = (hex) => {
    d3.selectAll('.hexbin-tooltip').attr('opacity', 0);
    const bounds = new L.LatLngBounds(convertD3Position(hex));
    map.flyToBounds(bounds, {
      maxZoom: MARKERS_LIMIT,
      duration: HEX_FLY_TO_DURATION,
    });
  };

  useEffect(() => {
    // Add hex layer to the map
    setHexLayer(L.hexbinLayer(HEX_LAYER_OPTIONS).addTo(map));
    return () => {
      // Remove tooltip
      d3.selectAll('.hexbin-tooltip').remove();
    };
  }, []);

  useEffect(() => {
    if (!isNil(hexLayer)) {
      // Initialize Hex scaling
      hexLayer.colorScale();

      hexLayer
        .radiusRange(HEX_RADIUS_RANGE)
        .lng((d) => d[0])
        .lat((d) => d[1])
        .colorValue((d) => d.length)
        .radiusValue((d) => d.length);

      hexLayer.dispatch().on('click', flyToHex);

      updateHeatData(data);
    }
  }, [hexLayer]);

  return {
    updateHeatData,
  };
};

export default useHeatLayer;
