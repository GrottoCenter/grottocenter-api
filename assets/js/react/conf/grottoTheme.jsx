import brown from '@material-ui/core/colors/brown';
import blue from '@material-ui/core/colors/blue';
import orange from '@material-ui/core/colors/orange';
import grey from '@material-ui/core/colors/grey';
import { fade } from '@material-ui/core/styles/colorManipulator';
import spacing from '@material-ui/core/styles/spacing';

const fontFamily = 'Open Sans';

export default {
  spacing,
  fontFamily: 'Open Sans',
  palette: {
    primary: {
      light: brown['500'],
      main: brown['700'],
      dark: brown['100'],
      contrastText: grey['900'],
    },
    secondary: {
      light: blue['500'],
      main: blue['700'],
      dark: blue['100'],
      contrastText: grey['600'],
    },
    primary1Color: brown['500'],
    primary2Color: brown['700'],
    primary3Color: brown['100'],
    secondary1Color: blue['500'],
    secondary2Color: blue['700'],
    secondary3Color: blue['100'],
    accent1Color: orange['500'],
    primaryTextColor: grey['900'],
    secondaryTextColor: grey['600'],
    textIconColor: '#FFFFFF',
    divider: grey['400'],
    darkBlack: '#000000',
    fullBlack: '#000000',
    secondaryBlocTitle: '#FFFFFF',
    blackShadow: fade('#000000', 0.117647),
  },
  typography: {
    fontFamily,
  },
  overrides: {
    MuiSelect: {
      root: {
        fontFamily,
      },
    },
  },
};

// // Main Colors
// @brown: rgba(121, 85, 72, 1);
// @brownLight: lighten(@brown, 30%);//rgb(215, 204, 200);
// @blue: rgba(33, 150, 243, 1);
//
// // Wikicaves Colors
// @greenLogo: rgba(5, 152, 101, 1);
// @blueLogo: rgba(5, 101, 152, 1);
// @redLogo: rgba(154, 20, 12, 1);
//
// // Other Colors
// @cream: rgba(245, 245, 245, 1);
// @grey: rgba(110, 110, 110, 1);
// @greyLight: rgba(192, 192, 192, 1);
// @white: white;
