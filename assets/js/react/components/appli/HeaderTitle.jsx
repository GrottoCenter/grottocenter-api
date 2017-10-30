import React, {PropTypes} from 'react';
import styled from 'styled-components';
import TextDiv from '../common/TextDiv';

const TitleZone1 = styled(TextDiv)`
  color: yellow;
  font-weight: 2em;
`;

const TitleZone2 = styled(TextDiv)`
  color: red;
`;

const HeaderTitle = ({className, title, subtitle}) => (
  <div className={className}>
    <TitleZone1>{title}</TitleZone1>
    <TitleZone2>{subtitle}</TitleZone2>
  </div>
);

HeaderTitle.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  className: PropTypes.string
};

export default styled(HeaderTitle)`
  width: 200px !important;
  text-align: center;
`;
