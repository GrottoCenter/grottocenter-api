import React, { useRef } from 'react';
import styled from 'styled-components';
import { isMobile } from 'react-device-detect';
import PropTypes from 'prop-types';

import ActionBar from './ActionBar';

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: ${isMobile ? '100%' : '500px auto'};
  @media print {
    display: block;
    background-color: white;
    height: 100%;
    @page {
      margin: 15mm 15mm 15mm 15mm;
    }
  }
`;

const FixedWrapper = styled.div`
  position: ${!isMobile && 'sticky'};
  top: ${({ theme }) => !isMobile && theme.appBarHeight}px;
  height: calc(
    ${isMobile ? '100%' : '100vh'} -
      ${({ theme }) => theme.appBarHeight + theme.spacing(3)}px
  );
  box-sizing: border-box;
`;

const ScrollableContent = styled.div``;

const ScrollableWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Layout = ({ children, fixedContent }) => {
  const componentRef = useRef();

  return (
    <Wrapper ref={componentRef}>
      {isMobile && <ActionBar printRef={componentRef} />}
      <FixedWrapper>{fixedContent}</FixedWrapper>
      <ScrollableWrapper>
        {!isMobile && <ActionBar printRef={componentRef} />}
        <ScrollableContent>{children}</ScrollableContent>
      </ScrollableWrapper>
    </Wrapper>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  fixedContent: PropTypes.node.isRequired,
};

export default Layout;
