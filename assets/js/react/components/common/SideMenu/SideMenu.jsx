import React from 'react';
import { withStyles, withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';
import GCLogo from '../GCLogo';
import GCLink from '../GCLink';
import Translate from '../Translate';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Divider from '@material-ui/core/Divider';
import SideMenuLinks from './SideMenuLinks';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import ConnectionSection from './ConnectionSection';
import InternationalizedLink from '../InternationalizedLink';
import { licenceLinks } from '../../../conf/Config';

var isConnected = false; //TODO

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const styles = {
  link : {
    textDecoration: 'none',
    color: 'black',
    fontSize: '140%',
    fontWeight: 'bold',
    '&:hover': {
      color: 'black'
    },
    '&:visited': {
        color: 'black'
    },
    '&:active': {
        color: 'black'
    },
    '&:link': {
        color: 'black'
    }
  },
  
  textField : {
    marginTop: '10%',
    marginLeft: '5%',
    width: '90%',
  }
};

const Body = withTheme()(styled.div`
  height: 100%;
  margin: 0;
  padding: 0;
`);

const Container = withTheme()(styled.div`
  min-height: 100%;
  height: auto !important;
  height: 100%;
  margin: 0 auto -50px; /* the bottom margin is the negative value of the footer's height */
`);

const LogoImage = styled(GCLogo)`
  & > img {
    height: 40px;
    padding-top: 10px;
    padding-left: 10px;
    padding-right: 10px;
  }
`;

const HeaderSideBar = withTheme()(styled.div`
  display: inline-block;
  font-size: 100%;
  margin-left: 4%;
  margin-top: 2%;
`);

const UserIcon = withTheme()(styled.img`
  width: 40px;
  float: 'left',
`);

const BoldText = withTheme()(styled.div`
  font-size: 15px;
  font-weight: bold;
`);

const UserText = withTheme()(styled.div`
  margin-left: 10px;
  float: right;
`);

const UserInfo = withTheme()(styled.div`
  display: inline-block !important;
  padding-top: 35px;
  font-size: 12px;
  margin-left: 5%;
`);

const StyledDivider = withStyles({
  root: {
    marginTop: '10%',
    marginLeft: '5%',
    width: '90%',
  },
})(Divider);

const StyledAddIcon = withStyles({
  root: {
    color: '#795548',
  },
})(AddIcon);

const StyledFab = withStyles({
  root: {
    backgroundColor: 'white',
    position: 'absolute',
    zIndex: 2,
  },
})(Fab);

const FabSpan = withTheme()(styled.span`
  display: inline-block;
  font-size: 12px;
  color: #795548;
  background-color: #f0ebeb;
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 25px;
  padding-right: 10px;
  z-index: 0;
  margin-left: 30px;
  margin-top: 6px;
  border-radius: 3px;
  box-shadow: 2px 2px 4px #d4d4d4;
  width: 175px;

  @media screen and (max-width: 1250px) {
    font-size: 10px;
  }

  @media screen and (max-width: 1045px) {
    font-size: 9px;
  }

  :hover {
    cursor: pointer
  }
`);

const FabDiv = withTheme()(styled.div`
  display: inline-block;
  margin-left: 5%;
`);

const LogoFooter = styled(GCLogo)`
  & > img {
    height: 30px;
    padding-left: 10px;
    padding-right: 10px;
  }
`;

const VersionNumber = withTheme()(styled.span`
  font-size: 13px;
`);

const BootstrapButton = withStyles({
  root: {
    backgroundColor: '#795548',
    height: '30px',
    boxShadow: 'none',
    textTransform: 'none',
    fontSize: 9,
    color: 'white',
    padding: '6px 12px',
    lineHeight: 1.5,
    float: 'right',
    marginLeft: '20px'
  },
})(Button);

const LicenceImage = styled.img`
  width: 75px;
  margin-left: 45px;
`;

const Push = withTheme()(styled.div`
  height: 50px;
  clear: both;
`);

const FooterSideBar = withTheme()(styled.div`
  display: inline-block;
  height: 50px;
  clear: both;
  padding-top: 10px;
`);


//
//
// M A I N - C O M P O N E N T
//
//

const SideMenu = () => (
  <Body>
    <Container>
      <HeaderSideBar>
        <LogoImage />
        <GCLink href='/' children='GrottoCenter' style={ styles.link } />
      </HeaderSideBar>

      {isConnected ? 
        <UserInfo>
          <UserIcon src="/images/sidemenu/user.png" alt="user icon" />
          <UserText>
            <Translate>Hello</Translate>
            <BoldText> Christian </BoldText>
          </UserText>
        </UserInfo>
        :
        <UserInfo>
          <BoldText><Translate>You are not logged in.</Translate></BoldText>
          <Translate>Log in to activate the editor mode.</Translate>
        </UserInfo>
      }

      <TextField
        label="Recherche rapide"
        style={ styles.textField }
        placeholder="Entrez votre recherche"
        InputLabelProps={{
          shrink: true,
        }}
        variant="filled"
      />
      
      <StyledDivider />

      <SideMenuLinks />

      {isConnected? 
        <FabDiv>
          <StyledFab color="primary" aria-label="add" size="medium">
            <StyledAddIcon />
          </StyledFab>
          <FabSpan><Translate>Create a new element</Translate></FabSpan>
        </FabDiv>
        :
        <ConnectionSection />
      }

      <Push />

    </Container>

    <FooterSideBar>
      <LogoFooter />
      <VersionNumber> v 3.0.0 </VersionNumber>
      {isConnected ? 
        <BootstrapButton variant="contained" color="primary" disableRipple><Translate>LOG OUT</Translate></BootstrapButton>
        : 
        <InternationalizedLink links={licenceLinks}>
          <LicenceImage src="/images/CC-BY-SA.png" alt="CC-BY-SA licence" />
        </InternationalizedLink>
      }
    </FooterSideBar>
  </Body>
);

export default SideMenu;