import React, {PropTypes} from 'react';
import styled from 'styled-components';
import TextDiv from '../common/TextDiv';
import GCLink from '../common/GCLink';
import muiThemeable from 'material-ui/styles/muiThemeable';

const TitleZone1 = muiThemeable()(styled(TextDiv)`
  color: ${props => props.muiTheme.palette.primary3Color};
  font-weight: 500;
  font-size: 20px;
  line-height: 12px;
`);

const TitleZone2 = muiThemeable()(styled(TextDiv)`
  color: ${props => props.muiTheme.palette.accent1Color};
  font-size: 8px;
`);

const GCLinkStl = styled(GCLink)`
  text-decoration: none;
`;

const HeaderTitle = ({className, title, subtitle}) => (
  <div className={className}>
    <GCLinkStl internal={true} href="/">
      <TitleZone1>{title}</TitleZone1>
      <TitleZone2>{subtitle}</TitleZone2>
    </GCLinkStl>
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
