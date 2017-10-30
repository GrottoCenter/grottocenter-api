import React from 'react';
import InternationalizedLink from '../common/InternationalizedLink';
import {bloggerLinks, bloggerIcons, wikiBatsLinks, rssLinks} from '../../conf/Config';
import {facebookLink, twitterLink, githubLink} from '../../conf/Config';
import styled from 'styled-components';

const SocialLinksList = styled.ul`
  list-style: none;
  display: inline-block;

  @media (min-width: 550px) {
    margin: 0;
    margin-right: 5px;
  }
`;

const SocialLinksListItem = styled.li`
  display: inline-block;
  width: 60px;
  margin: 0 5%;

  @media (min-width: 550px) {
    margin: 0 14px;
  }
`;

const SocialImage = styled.img`
  width: 100%;
  padding: 2px;
  border-radius: 10px;
`;

const bloggerIcon = (bloggerIcons[locale] !== undefined) ? bloggerIcons[locale] : bloggerIcons['*']; // eslint-disable-line

const SocialLinks = () => (
  <SocialLinksList>
    <SocialLinksListItem>
      <InternationalizedLink links={facebookLink}>
        <SocialImage src="/images/icons8/icons8-facebook-filled-100.png" alt="Follow us on Facebook" />
      </InternationalizedLink>
    </SocialLinksListItem>
    <SocialLinksListItem>
      <InternationalizedLink links={rssLinks}>
        <SocialImage src="/images/icons8/icons8-rss-filled-100.png" alt="RSS feed" />
      </InternationalizedLink>
    </SocialLinksListItem>
    <SocialLinksListItem>
      <InternationalizedLink links={bloggerLinks}>
        <SocialImage src='/images/icons8/icons8-blogger-filled-100.png' alt="Grottocenter blog" />
      </InternationalizedLink>
    </SocialLinksListItem>
    <SocialLinksListItem>
      <InternationalizedLink links={twitterLink}>
        <SocialImage src="/images/icons8/icons8-twitter-filled-100.png" alt="Follow us on Twitter" />
      </InternationalizedLink>
    </SocialLinksListItem>
    <SocialLinksListItem>
      <InternationalizedLink links={githubLink}>
        <SocialImage src="/images/icons8/icons8-github-filled-100.png" alt="Grottocenter3 on GitHub" />
      </InternationalizedLink>
    </SocialLinksListItem>
    <SocialLinksListItem>
      <InternationalizedLink internal={true} links={'ui/api'}>
        <SocialImage src="/images/icons8/icons8-rest-api-filled-100.png" alt="Want to use our API?" />
      </InternationalizedLink>
    </SocialLinksListItem>
    <SocialLinksListItem>
      <InternationalizedLink links={wikiBatsLinks}>
        <SocialImage src="/images/bats.svg" alt="Wiki page for bats" />
      </InternationalizedLink>
    </SocialLinksListItem>
  </SocialLinksList>
);

export default SocialLinks;
