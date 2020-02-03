import React from 'react';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import GCLink from '../common/GCLink';
import InternationalizedLink from '../common/InternationalizedLink';
import { contactLinks, legalLinks, contributorsLink } from '../../conf/Config';
import Translate from '../common/Translate';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const FooterLinksList = styled.ul`
  list-style: none;
  font-size: large;
`;

const FooterLinksLi = styled.li`
  display: inline-block;
  margin-right:15px;
`;

const SocialLink = styled.div`
  text-decoration: none;
  font-size: medium;
  color: ${props => props.theme.palette.textIconColor};

  :hover {
    color: ${props => props.theme.palette.accent1Color};
  }
`;

const SocialGCLink = withTheme()(SocialLink.withComponent(GCLink));

const SocialIntlLink = withTheme()(SocialLink.withComponent(InternationalizedLink));

//
//
// M A I N - C O M P O N E N T
//
//

const FooterLinks = () => (
  <FooterLinksList>
    <FooterLinksLi>
      <SocialGCLink internal href="/ui/faq">
        <Translate>FAQ</Translate>
      </SocialGCLink>
    </FooterLinksLi>
    <FooterLinksLi>
      <SocialIntlLink links={contributorsLink}>
        <Translate>Contributors</Translate>
      </SocialIntlLink>
    </FooterLinksLi>
    <FooterLinksLi>
      <SocialIntlLink links={contactLinks}>
        <Translate>Contact</Translate>
      </SocialIntlLink>
    </FooterLinksLi>
    <FooterLinksLi>
      <SocialIntlLink links={legalLinks}>
        <Translate>Legal notice</Translate>
      </SocialIntlLink>
    </FooterLinksLi>
  </FooterLinksList>
);

export default FooterLinks;
