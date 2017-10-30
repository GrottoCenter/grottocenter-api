import React, {PropTypes, Component} from 'react';
import CircularProgress from 'material-ui/CircularProgress';
import styled from 'styled-components';
import muiThemeable from 'material-ui/styles/muiThemeable';

const PartnerVignette = muiThemeable()(styled.div`
  margin-right: 2%;
  margin-left: 2%;
  margin-bottom: 4%;
  background-color: white;
  border: 1px solid ${props => props.muiTheme.palette.primary1Color};
  box-shadow: ${props => props.muiTheme.palette.blackShadow} 0 1px 6px, ${props => props.muiTheme.palette.blackShadow} 0 1px 4px;
  border-radius: 2%;
  height: 80px;
  line-height: 80px;
  overflow: hidden;
  position: relative;
  padding: 4px;
  width: 80px;
  transition: transform 400ms ease;
  display: inline-block;

  :hover {
    transform: scale(1.1, 1.1);
    transition: transform 200ms ease;
    cursor: pointer;
  }

  @media (min-width: 550px) {
    margin-right: 1%;
    margin-left: 1%;
    margin-bottom: 2%;
  }
`);

const PartnerImage = styled.img`
  width: 100%;
  vertical-align: middle;
`;

const PartnerItem = ({imagePath, name, onClick}) => (
  <PartnerVignette>
    <PartnerImage src={imagePath} alt={name} onClick={onClick} />
  </PartnerVignette>
);

PartnerItem.propTypes = {
  imagePath: PropTypes.string,
  name:PropTypes.string,
  onClick: PropTypes.func
};

const PartnerVignettes = styled.div`
  text-align: center;
`;

class PartnersCarousel extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.fetch();
  }

  render() {
    let rows = [];
    this.props.partners
      && this.props.partners.forEach(function (partner) {
      rows.push(
        <PartnerItem
          key={'partcs-' + partner.id}
          imagePath={'/images/partners/' + partner.pictureFileName}
          alt={partner.name}
          onClick={() => window.open(partner.customMessage, 'grotto_partner')} />
      );
    });

    if (this.props.isFetching) {
      return (<CircularProgress />);
    }
    if (rows.length > 0) {
      return (
        <PartnerVignettes>{rows}</PartnerVignettes>
      );
    }
    return (<div/>);
  }
}

PartnersCarousel.propTypes = {
  fetch: PropTypes.func.isRequired,
  isFetching: PropTypes.bool,
  partners: PropTypes.any
};

export default PartnersCarousel;
