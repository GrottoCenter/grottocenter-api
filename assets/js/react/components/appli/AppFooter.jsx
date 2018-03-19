import React from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import InternationalizedLink from '../common/InternationalizedLink';
import GCLink from '../common/GCLink';
import {licenceLinks, fseLinks, contactLinks, githubLink, facebookLink} from '../../conf/Config';
import {twitterLink, rssLinks, bloggerLinks, bloggerIcons} from '../../conf/Config';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import styled from 'styled-components';

const FooterBar = muiThemeable()(styled(Toolbar)`
  color: ${props => props.muiTheme.palette.fullBlack} !important;
  background-color: ${props => props.muiTheme.palette.primary3Color} !important;
  padding: 0px !important;
  height: 45px !important;
  position: fixed;
  bottom: 0;
  width: 100%;

  img {
    padding-left: 5px;
    padding-right: 5px;
  }

  svg {
    width: 30px !important;
    height: 30px !important;
  }
`);

const RightToolbarGroup= muiThemeable()(styled(ToolbarGroup)`
  width: 40% !important;
  justify-content: flex-start !important;
  background-color: ${props => props.muiTheme.palette.primary3Color} !important;
`);

const LeftToolbarGroup= muiThemeable()(styled(ToolbarGroup)`
  width: 40% !important;
  justify-content: flex-end !important;
  background-color: ${props => props.muiTheme.palette.primary3Color} !important;
`);

const SocialImage = styled.img`
  height: 25px;
  padding-top: 5px;
`;

const LogoImage = styled.img`
  height: 20px;
  padding-top: 4px;
`;

const Version = styled.div`
  font-size: x-small;
`;

const bloggerIcon = (bloggerIcons[locale] !== undefined) ? bloggerIcons[locale] : bloggerIcons['*']; // eslint-disable-line

const AppFooter = () => (
  <FooterBar>
    <RightToolbarGroup>
      <InternationalizedLink links={fseLinks}>
        <SocialImage src="/images/FSE.svg" alt="Logo FSE" />
      </InternationalizedLink>

      <InternationalizedLink links={licenceLinks}>
        <SocialImage src="/images/CC-BY-SA.png" alt="CC-BY-SA licence" />
      </InternationalizedLink>

      <Version>
        GC v3
      </Version>
    </RightToolbarGroup>

    <ToolbarGroup>
      <GCLink blank={false} href='/' className="logo">
        <LogoImage src="/images/logo.svg" alt="logo-wikicaves" />
      </GCLink>
    </ToolbarGroup>

    <LeftToolbarGroup>
      <InternationalizedLink links={githubLink}>
        <SocialImage src="/images/icons8/brown/icons8-github-filled-100.png" alt="Grottocenter3 on GitHub" />
      </InternationalizedLink>
      <InternationalizedLink links={facebookLink}>
        <SocialImage src="/images/icons8/brown/icons8-facebook-filled-100.png" alt="Follow us on Facebook" />
      </InternationalizedLink>
      <InternationalizedLink links={twitterLink}>
        <SocialImage src="/images/icons8/brown/icons8-twitter-filled-100.png" alt="Follow us on Twitter" />
      </InternationalizedLink>
      <InternationalizedLink links={rssLinks}>
        <SocialImage src="/images/icons8/brown/icons8-rss-filled-100.png" alt="RSS feed" />
      </InternationalizedLink>
      <InternationalizedLink links={bloggerLinks}>
        <SocialImage src='/images/icons8/brown/icons8-blogger-filled-100.png' alt="Grottocenter blog" />
      </InternationalizedLink>
      <InternationalizedLink links={contactLinks}>
        <SocialImage src='/images/icons8/brown/icons8-secured-letter-filled-100.png' alt="Contact Grottocenter team" />
      </InternationalizedLink>
      <GCLink internal={true} href='/ui/faq'>
        <SocialImage src='/images/icons8/brown/icons8-faq-filled-100.png' alt="Need help?" />
      </GCLink>
    </LeftToolbarGroup>
  </FooterBar>
);

export default AppFooter;
