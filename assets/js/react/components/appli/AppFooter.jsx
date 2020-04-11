import React from 'react';
import { withTheme } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import styled from 'styled-components';
import { withStyles } from '@material-ui/core';
import InternationalizedLink from '../common/InternationalizedLink';
import GCLink from '../common/GCLink';
import GCLogo from '../common/GCLogo';
import { licenceLinks, fseLinks, contactLinks, githubLink, facebookLink } from '../../conf/Config';
import { twitterLink, rssLinks, bloggerLinks, bloggerIcons } from '../../conf/Config';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const FooterBar = withStyles(
  (theme) => ({
    root: {
      color: theme.palette.fullBlack,
      backgroundColor: theme.palette.primary3Color,
      padding: '0 10px',
      height: '45px',
      minHeight: '45px',
      position: 'fixed',
      bottom: '0',
      width: 'calc(100% - 20px)',
      display: 'inline-flex',
      justifyContent: 'space-between',
    },
  }),
  { withTheme: true },
)(Toolbar);

const SocialImage = styled.img`
  height: 25px;
  padding-top: 5px;
  padding-left: 5px;
  padding-right: 5px;
`;

const LogoImage = styled(GCLogo)`
  & > img {
    height: 25px;
    padding-top: 4px;
    padding-left: 5px;
    padding-right: 5px;
  }
`;

const Version = styled.span`
  line-height: 36px;
  font-size: x-small;
  padding-left: 5px;
`;

const RightDiv = styled.div`
  display: inline-flex;
`;

const bloggerIcon = bloggerIcons[locale] !== undefined ? bloggerIcons[locale] : bloggerIcons['*']; // eslint-disable-line

//
//
// M A I N - C O M P O N E N T
//
//

const AppFooter = () => (
  <FooterBar>
    <RightDiv>
      <InternationalizedLink links={fseLinks}>
        <SocialImage src="/images/FSE.svg" alt="Logo FSE" />
      </InternationalizedLink>

      <InternationalizedLink links={licenceLinks}>
        <SocialImage src="/images/CC-BY-SA.png" alt="CC-BY-SA licence" />
      </InternationalizedLink>

      <Version>GC v3</Version>
    </RightDiv>

    <div>
      <LogoImage />
    </div>

    <div>
      <InternationalizedLink links={githubLink}>
        <SocialImage
          src="/images/icons8/brown/icons8-github-filled-100.png"
          alt="Grottocenter3 on GitHub"
        />
      </InternationalizedLink>
      <InternationalizedLink links={facebookLink}>
        <SocialImage
          src="/images/icons8/brown/icons8-facebook-filled-100.png"
          alt="Follow us on Facebook"
        />
      </InternationalizedLink>
      <InternationalizedLink links={twitterLink}>
        <SocialImage
          src="/images/icons8/brown/icons8-twitter-filled-100.png"
          alt="Follow us on Twitter"
        />
      </InternationalizedLink>
      <InternationalizedLink links={rssLinks}>
        <SocialImage src="/images/icons8/brown/icons8-rss-filled-100.png" alt="RSS feed" />
      </InternationalizedLink>
      <InternationalizedLink links={bloggerLinks}>
        <SocialImage
          src="/images/icons8/brown/icons8-blogger-filled-100.png"
          alt="Grottocenter blog"
        />
      </InternationalizedLink>
      <InternationalizedLink links={contactLinks}>
        <SocialImage
          src="/images/icons8/brown/icons8-secured-letter-filled-100.png"
          alt="Contact Grottocenter team"
        />
      </InternationalizedLink>
      <GCLink internal href="/ui/faq">
        <SocialImage src="/images/icons8/brown/icons8-faq-filled-100.png" alt="Need help?" />
      </GCLink>
    </div>
  </FooterBar>
);

export default AppFooter;
