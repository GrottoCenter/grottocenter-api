import { brown, blue, orange, grey } from '@material-ui/core/colors';
import { createMuiTheme, fade } from '@material-ui/core/styles';
import { isMobileOnly } from 'react-device-detect';

const fontFamily = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"',
].join(',');

const sideMenuWidth = 240;
const appBarHeight = isMobileOnly ? 56 : 64;
const paddingUnit = 8;

export const overridings = {
  name: 'Main theme',
  spacing: [
    paddingUnit / 4,
    paddingUnit / 2,
    paddingUnit,
    paddingUnit * 2,
    paddingUnit * 4,
    paddingUnit * 8,
  ],
  sideMenuWidth,
  appBarHeight,
  palette: {
    primary: {
      light: brown['500'],
      main: brown['700'],
      dark: brown['900'],
      contrastText: grey['100'],
    },
    secondary: {
      light: orange['500'],
      main: orange['700'],
      dark: orange['900'],
      contrastText: grey['900'],
    },
    common: {
      white: '#fff',
      black: '#000',
    },
    onPrimary: {
      main: grey['100'],
    },
    action: {
      disabled: brown['300'],
      disabledBackground: brown['200'],
    },
    contrastThreshold: 3,
    primary1Color: brown['500'],
    primary2Color: brown['700'],
    primary3Color: brown['100'],
    secondary1Color: blue['500'],
    secondary2Color: blue['700'],
    secondary3Color: blue['100'],
    secondary4Color: blue['300'],
    accent1Color: orange['500'],
    primaryTextColor: grey['900'],
    secondaryTextColor: grey['600'],
    textIconColor: '#FFFFFF',
    borderColor: grey['300'],
    divider: grey['300'],
    darkBlack: '#000000',
    fullBlack: '#000000',
    secondaryBlocTitle: '#FFFFFF',
    blackShadow: fade('#000000', 0.117647),
    backgroundButton: '#FFFFFF',
  },
  shape: {
    borderRadius: '4px',
  },
  typography: {
    fontFamily,
    htmlFontSize: 10,
  },
  overrides: {
    MuiDrawer: {
      root: {
        width: sideMenuWidth,
        flexShrink: 0,
      },
      paper: {
        top: appBarHeight,
        height: `calc(100% - ${appBarHeight}px)`,
        width: sideMenuWidth,
        padding: '8px',
      },
    },
    MuiSvgIcon: {
      padding: '4px',
    },
    MuiDivider: {
      root: {
        backgroundColor: brown['500'],
      },
    },
    MuiInputBase: {
      root: {
        color: 'inherit',
      },
    },
    MuiFormControl: {
      root: {
        padding: '4px',
      },
    },
    MuiSelect: {
      root: {
        fontFamily,
      },
    },
    MuiFormLabel: {
      root: {
        // fontSize: '1.9rem',
      },
    },
    gutterBottom: {
      marginBottom: '1rem',
    },
  },
};

export default createMuiTheme(overridings);
