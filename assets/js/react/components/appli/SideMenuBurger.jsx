import React, {PropTypes} from 'react';
import Avatar from 'material-ui/Avatar';
import BurgerIcon from 'material-ui/svg-icons/navigation/menu';
import muiThemeable from 'material-ui/styles/muiThemeable';
import styled from 'styled-components';

const BurgerAvatar = muiThemeable()(styled(Avatar)`
  position: relative;
  left: 20px;
  background-color: ${props => props.visible ?
    props.muiTheme.palette.textIconColor :
    props.muiTheme.palette.accent1Color} !important;

  > svg {
    fill: ${props => props.visible ?
      props.muiTheme.palette.primaryTextColor :
      props.muiTheme.palette.textIconColor} !important;
  }
`);

const BurgerLink = ({visible, onclick}) => (
  <a onClick={onclick}>
    <BurgerAvatar icon={<BurgerIcon />} visible={visible} />
  </a>
);

BurgerLink.propTypes = {
  onclick: PropTypes.func.isRequired,
  visible: PropTypes.bool.isRequired
}

const SideMenuBurger = styled(BurgerLink)``;

export default SideMenuBurger;
