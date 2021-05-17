import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import InternationalizedLink from '../InternationalizedLink';
import { licenceLinks } from '../../../conf/Config';
import GCLogo from '../GCLogo';

const LogoFooter = styled(GCLogo)`
  & > img {
    height: 30px;
    padding-left: 10px;
    padding-right: 10px;
  }
`;

const LicenceImage = styled.img`
  width: 75px;
`;

const Container = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
`;

const Footer = () => {
  return (
    <Container>
      <div>
        <LogoFooter />
        <Typography variant="caption"> v 21.0.3 </Typography>
      </div>
      <InternationalizedLink links={licenceLinks}>
        <LicenceImage src="/images/CC-BY-SA.png" alt="CC-BY-SA licence" />
      </InternationalizedLink>
    </Container>
  );
};

export default Footer;
