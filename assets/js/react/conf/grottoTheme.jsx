import {
  /* DARK PRIMARY COLOR */
  brown700, /* #5D4037 */
  /* MIDDLE PRIMARY COLOR */
  brown500, /* #795548 */
  /* LIGHT PRIMARY COLOR */
  brown100, /* #D7CCC8 */

  /* DARK SECONDARY COLOR */
  blue700, /* #0288D1 */
  /* MIDDLE SECONDARY COLOR */
  blue500, /* #03A9F4 */
  /* LIGHT SECONDARY COLOR */
  blue100, /* #B3E5FC */

  /* ACCENT COLOR */
  orange500, /*  */

  /* PRIMARY TEXT */
  grey900, /* #212121 */
  /* SECONDARY COLOR */
  grey600, /* #757575 */

  /* DIVIDER */
  grey400, /* #BDBDBD */

  /* TEXT / ICONS */
  white, /* #FFFFFF */

  darkBlack,
  fullBlack
} from 'material-ui/styles/colors';
import {fade} from 'material-ui/utils/colorManipulator';
import spacing from 'material-ui/styles/spacing';

export default {
  spacing: spacing,
  fontFamily: 'Open Sans',
  palette: {
    primary1Color: brown500,
    primary2Color: brown700,
    primary3Color: brown100,
    secondary1Color: blue500,
    secondary2Color: blue700,
    secondary3Color: blue100,
    accent1Color: orange500,
    primaryTextColor: grey900,
    secondaryTextColor: grey600,
    textIconColor: white,
    divider: grey400,
    darkBlack: darkBlack,
    fullBlack: fullBlack,
    secondaryBlocTitle: white,
    blackShadow: fade(fullBlack,  0.117647),
  }
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
