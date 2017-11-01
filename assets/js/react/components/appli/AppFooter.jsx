import React from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import InternationalizedLink from '../common/InternationalizedLink';
import GCLink from '../common/GCLink';
import {licenceLinks, fseLinks, contactLinks, githubLink, facebookLink} from '../../conf/Config';
import {twitterLink, rssLinks, bloggerLinks, bloggerIcons} from '../../conf/Config';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import MailIcon from 'material-ui/svg-icons/content/mail';
import HelpIcon from 'material-ui/svg-icons/action/help-outline';
import styled from 'styled-components';

const FooterBar = muiThemeable()(styled(Toolbar)`
  color: ${props => props.muiTheme.palette.fullBlack} !important;
  background-color: ${props => props.muiTheme.palette.primary3Color} !important;
  padding: 0px !important;

  img {
    height: 30px;
    padding: 5px;
  }

  svg {
    width: 30px !important;
    height: 30px !important;
    padding: 5px;
  }
`);

const RightToolbarGroup= muiThemeable()(styled(Toolbar)`
  width: 40% !important;
  justify-content: flex-start !important;
  background-color: ${props => props.muiTheme.palette.primary3Color} !important;
`);

const LeftToolbarGroup= muiThemeable()(styled(Toolbar)`
  width: 40% !important;
  justify-content: flex-end !important;
  background-color: ${props => props.muiTheme.palette.primary3Color} !important;
`);

const bloggerIcon = (bloggerIcons[locale] !== undefined) ? bloggerIcons[locale] : bloggerIcons['*']; // eslint-disable-line

const AppFooter = () => (
  <FooterBar>
    <RightToolbarGroup>
      <InternationalizedLink links={fseLinks}>
        <img src="/images/FSE.svg" alt="Logo FSE" />
      </InternationalizedLink>

      <InternationalizedLink links={licenceLinks}>
        <img src="/images/CC-BY-SA.png" alt="CC-BY-SA licence" />
      </InternationalizedLink>

      <div>
        texte
      </div>
    </RightToolbarGroup>

    <ToolbarGroup>
      <GCLink blank={false} href='/' className="logo">
        <img src="/images/logo.svg" alt="logo-wikicaves"/>
      </GCLink>
    </ToolbarGroup>

    <LeftToolbarGroup>
      <InternationalizedLink links={githubLink}>
        <img src="/images/github.png" alt="Grottocenter3 on GitHub" />
      </InternationalizedLink>
      <InternationalizedLink links={facebookLink}>
        <img src="/images/facebook.svg" alt="Follow us on Facebook" />
      </InternationalizedLink>
      <InternationalizedLink links={twitterLink}>
        <img src="/images/twitter.svg" alt="Follow us on Twitter" />
      </InternationalizedLink>
      <InternationalizedLink links={rssLinks}>
        <img src="/images/rss.png" alt="RSS feed" />
      </InternationalizedLink>
      <InternationalizedLink links={bloggerLinks}>
        <img src={'/images/' + bloggerIcon} alt="Grottocenter blog" />
      </InternationalizedLink>
      <InternationalizedLink links={contactLinks}>
        <MailIcon />
      </InternationalizedLink>
      <GCLink internal={true} href='/ui/faq'>
        <HelpIcon />
      </GCLink>
    </LeftToolbarGroup>
  </FooterBar>
);

export default AppFooter;
