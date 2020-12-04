// eslint-disable-next-line import/prefer-default-export
import { blue, brown } from '@material-ui/core/colors';

const HEX_MAX_RADIUS = 12;
const HEX_MIN_RADIUS = 7;
export const MARKERS_LIMIT = 14;
export const HEX_FLY_TO_DURATION = 1;
export const HEX_RADIUS_RANGE = [HEX_MIN_RADIUS, HEX_MAX_RADIUS];
export const ENTRANCE_HEAT_COLORS = [brown[50], brown[900]];
export const NETWORK_HEAT_COLORS = [blue[50], blue[900]];
export const HEX_LAYER_OPTIONS = {
  radius: HEX_MAX_RADIUS,
  opacity: 0.75,
  duration: 400,
};
