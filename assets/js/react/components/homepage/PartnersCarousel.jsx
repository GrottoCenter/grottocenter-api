import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import AliceCarousel from 'react-alice-carousel';
import 'react-alice-carousel/lib/alice-carousel.css';

const PartnerVignette = withTheme()(styled.div`
  margin-left: 2%;
  margin-right: 2%;
  margin-top: 2%;
  margin-bottom: 2%;
  background-color: white;
  border: 1px solid ${props => props.theme.palette.primary1Color};
  border-radius: 2%;
  overflow: hidden;
  position: relative;
  display: inline-block;
  width: 90px;
  height: 90px;

  :hover {
    transform: scale(1.1);
    cursor: pointer;
  }

  @media (min-width: 354px) and (max-width: 515px) {
    width: 85px;
    height: 85px;
  }

  @media (min-width: 354px) {
    margin-right: 1%;
    margin-left: 1%;
  }

  @media (min-width: 708px) {
    width: 100px;
    height: 100px;
  }
`);

const PartnerImage = styled.img`
  display: block;
  max-width: 100%;
  max-height: 100%;

  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`;

const CarouselDiv = withTheme()(styled.div`
  text-align: center;
   width: 100%;
   li.alice-carousel__dots-item {
   opacity: 50%;
    background-color: ${props => props.theme.palette.accent1Color};
   }
   li.alice-carousel__dots-item.__active {
    opacity: 100%;
    background-color: ${props => props.theme.palette.accent1Color};
   }
`);

const PartnerItem = ({ imagePath, name, onClick }) => (
  <PartnerVignette>
    <PartnerImage src={imagePath} alt={name} onClick={onClick} />
  </PartnerVignette>
);

PartnerItem.propTypes = {
  imagePath: PropTypes.string,
  name: PropTypes.string,
  onClick: PropTypes.func,
};

const PartnersCarousel = ({ fetch, partners, isFetching }) => {
  const isFirstLoad = useRef(true)
  const rows = partners ? partners.map(({ id, pictureFileName, name, customMessage }) => (
    <PartnerItem
      key={`partcs-${id}`}
      imagePath={`/images/partners/${pictureFileName}`}
      alt={name}
      onClick={() => window.open(customMessage, 'grotto_partner')}
    />
  )) : [];

  useEffect(() => {
    if (isFirstLoad.current) {
      fetch();
      isFirstLoad.current = false;
    }
  }, [])

  if (isFetching) {
    return (<CircularProgress />);
  }
  else if (rows.length > 0) {
    return (
      <CarouselDiv>
        <AliceCarousel
          mouseTrackingEnabled
          buttonsDisabled
          autoPlayInterval={5000}
          autoPlay
          responsive={{ 0: { items: 3 }, 520: { items: 4 }, 1024: { items: 5 } }}
          items={rows}
        />
      </CarouselDiv>
    );
  }
  return null;
}

PartnersCarousel.propTypes = {
  fetch: PropTypes.func.isRequired,
  isFetching: PropTypes.bool,
  partners: PropTypes.any,
};

export default PartnersCarousel;
