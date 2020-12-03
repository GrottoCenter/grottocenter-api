import { Typography } from '@material-ui/core';
import { Link } from 'react-router-dom';
import React from 'react';
import styled from 'styled-components';
import DescriptionIcon from '@material-ui/icons/Description';
import PropTypes from 'prop-types';

const StyledDescriptionIcon = styled(DescriptionIcon)`
  vertical-align: middle;
`;

const TitleWrapper = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
`;

const Title = ({ title, link }) => (
  <TitleWrapper>
    <Typography>
      <Link target="_blank" to={link} color="inherit">
        <StyledDescriptionIcon />
        {title}
      </Link>
    </Typography>
  </TitleWrapper>
);

Title.propTypes = {
  title: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
};

export default Title;
