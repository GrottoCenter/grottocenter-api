import { brown, blue, orange, grey } from '@material-ui/core/colors';
import {
  createMuiTheme,
  fade,
  responsiveFontSizes,
} from '@material-ui/core/styles';
import { isMobile } from 'react-device-detect';

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
const appBarHeight = 56;
const paddingUnit = 8;

export const overridings = {
  name: 'Main theme',
  spacing: [
    paddingUnit / 4,
    paddingUnit / 2,
    paddingUnit,
    paddingUnit * 2,
    paddingUnit * 3,
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
    action: {},
    backgroundColor: grey['100'],
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
    errorColor: '#ff493b',
  },
  shape: {
    borderRadius: '4px',
  },
  typography: {
    fontFamily,
    htmlFontSize: 10,
    h1: {
      fontSize: '4.2rem',
    },
    h2: {
      fontSize: '3.5rem',
    },
    h3: {
      fontSize: '2.9rem',
    },
    h4: {
      fontSize: '2.4rem',
    },
    h5: {
      fontSize: '2rem',
    },
  },
  // https://material-ui.com/customization/globals/#default-props
  props: {
    MuiTextField: {
      variant: 'filled',
    },
    MuiButton: {
      variant: 'contained',
    },
    MuiSkeleton: {
      animation: 'wave',
    },
    // For default color on a specific variant on Typography
    // Wait until V5 to (maybe) use this for some titles
    // https://github.com/mui-org/material-ui/issues/15573
    // MuiTypography: {
    //   h5: {
    //     color: 'secondary',
    //   },
    // },
  },
  overrides: {
    MuiFormHelperText: {
      root: {
        color: brown['500'],
        fontSize: '1.3rem',
      },
    },
    MuiCardContent: {
      root: {
        padding: isMobile ? paddingUnit : paddingUnit * 2,
      },
    },
    MuiCardHeader: {
      root: {
        padding: isMobile ? paddingUnit : paddingUnit * 2,
      },
    },
    MuiChip: {
      root: {
        backgroundColor: brown['500'],
        color: '#fff',
      },
    },
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
    MuiToolbar: {
      root: {
        height: `${appBarHeight}px`,
      },
    },
    gutterBottom: {
      marginBottom: '1rem',
    },
    MuiLink: {
      root: {
        display: 'flex',
      },
    },
    MuiTableCell: {
      head: {
        backgroundColor: brown['500'],
        color: grey['100'],
      },
    },
    MuiStepIcon: {
      active: {
        color: `${orange['700']} !important`,
        borderRadius: '100%',
      },
    },
    MuiStepConnector: {
      line: {
        borderWidth: '1px',
      },
      lineHorizontal: {
        borderWidth: '1px',
      },
      active: {
        '& $line': {
          borderColor: brown['300'],
          borderStyle: 'dashed',
        },
      },
      completed: {
        '& $line': {
          borderColor: brown['500'],
          borderWidth: '2px',
        },
      },
    },
  },
};

export default responsiveFontSizes(createMuiTheme(overridings));
