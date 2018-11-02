import React from 'react';
import GCLink from '../common/GCLink';
import InternationalizedLink from '../common/InternationalizedLink';
import {contactLinks, legalLinks, contributorsLink} from '../../conf/Config';
import Translate from '../common/Translate';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';

const FooterLinksList = styled.ul`
  display: inline-block;
  margin: 20px 0;
  list-style: none;
  font-size: large;
`;

const SocialLink = styled.div`
  text-decoration: none;
  font-size: large;
  color: ${props => props.theme.palette.textIconColor};

  :hover {
    color: ${props => props.theme.palette.accent1Color};
  }
`;

const SocialGCLink = withTheme()(SocialLink.withComponent(GCLink));

const SocialIntlLink = withTheme()(SocialLink.withComponent(InternationalizedLink));

const FooterLinks = () => (
  <FooterLinksList>
    <li>
      <SocialGCLink internal={true} href='/ui/faq'>
        <Translate>FAQ</Translate>
      </SocialGCLink>
    </li>
    <li>
      <SocialIntlLink links={contributorsLink}>
        <Translate>Contributors</Translate>
      </SocialIntlLink>
    </li>
    <li>
      <SocialIntlLink links={contactLinks}>
        <Translate>Contact</Translate>
      </SocialIntlLink>
    </li>
    <li>
      <SocialIntlLink links={legalLinks}>
        <Translate>Legal notice</Translate>
      </SocialIntlLink>
    </li>
  </FooterLinksList>
);

export default FooterLinks;
