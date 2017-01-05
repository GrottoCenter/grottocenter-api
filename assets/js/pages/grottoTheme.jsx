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
  orange500, /* #B3E5FC */

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
  fontFamily: 'Roboto, sans-serif',
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
    fullBlack: fullBlack
  },
  grottoAppBar: {
    textColor: white,
    backgroundColor: brown500
  },
  welcome: {
    backgroundColor: brown500
  },
  footer: {
    backgroundColor: brown700,
    color: brown100
  },
  searchBar: {
    backgroundColor: brown100
  }
};
