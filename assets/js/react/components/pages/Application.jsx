import React, {PropTypes} from 'react';
import SideMenuConnector from '../../containers/SideMenuConnector';
import AppToolbar from '../appli/AppToolbar';
import AppFooter from '../appli/AppFooter';
import Breadcrump from '../appli/Breadcrump';
import muiThemeable from 'material-ui/styles/muiThemeable';
import styled from 'styled-components';

const ApplicationHeader = muiThemeable()(styled.header`
  background-color: ${props => props.muiTheme.palette.secondary1Color};
`);

const AppFooterStl = styled(AppFooter)`
  /* position: fixed; */
  bottom: 0;
  width: 100%;
  padding: 0;
`;

const ArticleWrapper = styled.article`
  padding: 0px;
`;

const Application = (props) => (
  <div id='applicationpage'>
    <ApplicationHeader><AppToolbar /></ApplicationHeader>
    <nav></nav>
    <aside><SideMenuConnector /></aside>
    <Breadcrump />
    <ArticleWrapper>{props.children}</ArticleWrapper>
    <footer><AppFooterStl /></footer>
  </div>
);

Application.propTypes = {
  children: PropTypes.node.isRequired
};

export default Application;
