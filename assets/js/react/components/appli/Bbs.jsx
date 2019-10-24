import React from 'react';
import PropTypes from 'prop-types';
import {
  Card, CardContent, CircularProgress, withStyles, Typography,
} from '@material-ui/core';
import styled from 'styled-components';

import ImportContactsIcon from '@material-ui/icons/ImportContacts';
import PersonIcon from '@material-ui/icons/Person';
import ClassIcon from '@material-ui/icons/Class';
import PublicIcon from '@material-ui/icons/Public';
import CategoryIcon from '@material-ui/icons/Category';

import Translate from '../common/Translate';


const BottomBlock = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const CrossIndexBlock = styled.div`
  flex: 1;
  flex-basis: 300px;
`;

const StyledPublicationIcon = withStyles({
  root: {
    verticalAlign: 'bottom',
  },
})(ImportContactsIcon);

const StyledPersonIcon = withStyles({
  root: {
    verticalAlign: 'bottom',
  },
})(PersonIcon);

const StyledReferenceIcon = withStyles({
  root: {
    verticalAlign: 'bottom',
  },
})(ClassIcon);

const StyledCountryIcon = withStyles({
  root: {
    verticalAlign: 'bottom',
  },
})(PublicIcon);

const StyledThemeIcon = withStyles({
  root: {
    verticalAlign: 'bottom',
  },
})(CategoryIcon);

// =================== End styles ==================

const Bbs = (props) => {
  const { isFetching, bbs } = props;

  if (isFetching) {
    return (<CircularProgress />);
  }

  if (bbs) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h1">{bbs.title}</Typography>
          <Typography variant="body1" gutterBottom>
            <StyledPublicationIcon />
            {' '}
            <b><Translate>Published in</Translate></b>
            {' '}
            {bbs.publicationExport}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <StyledPersonIcon />
            {' '}
            <b><Translate>Author</Translate></b>
            {': '}
            {bbs.authors}
          </Typography>

          {bbs.subtheme ? (
            <React.Fragment>
              <Typography variant="body1" gutterBottom>
                <StyledThemeIcon />
                {' '}
                <strong><Translate>Theme</Translate></strong>
                {': '}
                {bbs.subtheme.id}
                {' - '}
                <Translate>{bbs.theme}</Translate>
                {' - '}
                <Translate>{bbs.subtheme.name}</Translate>
              </Typography>
            </React.Fragment>
          ) : ''}

          {bbs.country ? (
            <React.Fragment>
              <Typography variant="body1" gutterBottom>
                <StyledCountryIcon />
                {' '}
                <strong><Translate>Country or region</Translate></strong>
                {': '}
                {bbs.country.name}
              </Typography>
            </React.Fragment>
          ) : ''}

          <Typography variant="body1" gutterBottom>
            <StyledReferenceIcon />
            {' '}
            <strong><Translate>Reference</Translate></strong>
            {': '}
            {bbs.id}
          </Typography>

          <hr />

          {bbs.abstract ? (
            <React.Fragment>
              <Typography variant="h2" gutterBottom><Translate>Abstract</Translate></Typography>
              <Typography variant="body1" paragraph>
                {bbs.abstract}
              </Typography>
            </React.Fragment>
          ) : ''}

          <BottomBlock>
            {bbs.crosChapRebuilt ? (
              <CrossIndexBlock>
                <Typography variant="h2" gutterBottom><Translate>Secondary subthemes</Translate></Typography>
                <ul>
                  {bbs.crosChapRebuilt.trim().split(' ').map((chapter) => <li key={chapter}>{chapter}</li>)}
                </ul>
              </CrossIndexBlock>
            ) : ''}

            {bbs.crosCountryRebuilt ? (
              <CrossIndexBlock>
                <Typography variant="h2" gutterBottom><Translate>Secondary countries or regions</Translate></Typography>
                <ul>
                  {bbs.crosCountryRebuilt.trim().split(' ').map((country) => <li key={country}>{country}</li>)}
                </ul>
              </CrossIndexBlock>
            ) : ''}
          </BottomBlock>
        </CardContent>
      </Card>
    );
  }

  return <div />;
};

Bbs.propTypes = {
  isFetching: PropTypes.bool.isRequired,
  bbs: PropTypes.shape({}),
};
Bbs.defaultProps = {
  bbs: undefined,
};

export default Bbs;
