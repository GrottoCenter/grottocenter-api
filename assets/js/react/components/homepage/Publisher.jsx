import React from 'react';
import styled from 'styled-components';
import InternationalizedLink from '../common/InternationalizedLink';
import { wikicavesLink } from '../../conf/Config';
import Translate from '../common/Translate';
import GCLogo from '../common/GCLogo';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const PublisherInfo = styled.div`
  margin-right: 4px;
  display: inline-block;
`;

const PublisherLogo = styled(GCLogo)`
  & > img {
    width: 50px;
    margin-left:15px;
  }
`;

const PublisherWrapper = styled.div`
  display: inline-block;
  font-size: small;
  margin-top:10px;
`;

//
//
// M A I N - C O M P O N E N T
//
//

const Publisher = () => (
  <PublisherWrapper>
    <PublisherInfo> 
      <Translate>Published by</Translate>
    </PublisherInfo>

    <InternationalizedLink links={wikicavesLink}>
      <Translate>Wikicaves association</Translate>
      <PublisherLogo showLink={false} />
    </InternationalizedLink>

  </PublisherWrapper>
);

export default Publisher;
