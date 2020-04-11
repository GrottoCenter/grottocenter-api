import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, CircularProgress, withStyles, Typography } from '@material-ui/core';

import ImportContactsIcon from '@material-ui/icons/ImportContacts';
import PersonIcon from '@material-ui/icons/Person';
import ClassIcon from '@material-ui/icons/Class';
import PublicIcon from '@material-ui/icons/Public';
import CategoryIcon from '@material-ui/icons/Category';
import YearIcon from '@material-ui/icons/Today';
import LibraryIcon from '@material-ui/icons/LocalLibrary';

import Translate from '../common/Translate';

// =====================

const styledIcon = {
  root: {
    verticalAlign: 'bottom',
    fontSize: '2.7rem',
  },
};

const StyledHeaderInfo = withStyles({
  root: {
    fontSize: '1.7rem',
  },
})(Typography);

const StyledPublicationIcon = withStyles(styledIcon)(ImportContactsIcon);
const StyledPersonIcon = withStyles(styledIcon)(PersonIcon);
const StyledReferenceIcon = withStyles(styledIcon)(ClassIcon);
const StyledCountryIcon = withStyles(styledIcon)(PublicIcon);
const StyledThemeIcon = withStyles(styledIcon)(CategoryIcon);
const StyledYearIcon = withStyles(styledIcon)(YearIcon);
const StyledLibraryIcon = withStyles(styledIcon)(LibraryIcon);

// =================== End styles ==================

export class Bbs extends React.Component {
  componentDidMount() {
    const { updatePageTitle, updatePageTitleTooltip } = this.props;
    updatePageTitle('BBS');
    updatePageTitleTooltip('Speleological Abstracts');
  }

  render() {
    const { isFetching, bbs } = this.props;

    if (isFetching) {
      return <CircularProgress />;
    }

    if (bbs) {
      return (
        <Card>
          <CardContent>
            <Typography variant="h1">{bbs.title}</Typography>

            <StyledHeaderInfo variant="body1" gutterBottom>
              <StyledPublicationIcon />{' '}
              <b>
                <Translate>Published in</Translate>
              </b>{' '}
              {bbs.publication}
            </StyledHeaderInfo>

            <StyledHeaderInfo variant="body1" gutterBottom>
              <StyledYearIcon />{' '}
              <b>
                <Translate>Year</Translate>
              </b>
              {': '}
              {bbs.year}
            </StyledHeaderInfo>

            <StyledHeaderInfo variant="body1" gutterBottom>
              <StyledPersonIcon />{' '}
              <b>
                <Translate>Author</Translate>
              </b>
              {': '}
              {bbs.authors}
            </StyledHeaderInfo>

            {bbs.subtheme ? (
              <StyledHeaderInfo variant="body1" gutterBottom={!bbs.crosChapRebuilt}>
                <StyledThemeIcon />{' '}
                <strong>
                  <Translate>Theme</Translate>
                </strong>
                {': '}
                {bbs.subtheme.id}
                {' - '}
                <Translate>{bbs.theme}</Translate>
                {' - '}
                <Translate id={bbs.subtheme.id} defaultMessage={bbs.subtheme.name} />
              </StyledHeaderInfo>
            ) : (
              ''
            )}

            {bbs.crosChapRebuilt ? (
              <Typography variant="body1" gutterBottom style={{ textIndent: '31px' }}>
                <strong>
                  <Translate>Secondary themes</Translate>
                </strong>
                {': '}
                {bbs.crosChapRebuilt}
              </Typography>
            ) : (
              ''
            )}

            {bbs.country ? (
              <StyledHeaderInfo variant="body1" gutterBottom={!bbs.crosCountryRebuilt}>
                <StyledCountryIcon />{' '}
                <strong>
                  <Translate>Country or region</Translate>
                </strong>
                {': '}
                {bbs.country.name}
              </StyledHeaderInfo>
            ) : (
              ''
            )}

            {bbs.crosCountryRebuilt ? (
              <Typography variant="body1" gutterBottom style={{ textIndent: '31px' }}>
                <strong>
                  <Translate>Secondary countries or regions</Translate>
                </strong>
                {': '}
                {bbs.crosCountryRebuilt}
              </Typography>
            ) : (
              ''
            )}

            {bbs.lib ? (
              <StyledHeaderInfo variant="body1" gutterBottom>
                <StyledLibraryIcon />{' '}
                <strong>
                  <Translate>Library</Translate>
                </strong>
                {': '}
                {bbs.lib.name}
              </StyledHeaderInfo>
            ) : (
              ''
            )}

            <StyledHeaderInfo variant="body1" gutterBottom>
              <StyledReferenceIcon />{' '}
              <strong>
                <Translate>Reference</Translate>
              </strong>
              {': '}
              {bbs.ref}
            </StyledHeaderInfo>

            {bbs.editor ? (
              <React.Fragment>
                <hr />
                <Typography variant="h2" gutterBottom>
                  <Translate>Editor</Translate>
                </Typography>
                {bbs.editor.address ? (
                  <Typography variant="body1" paragraph>
                    {bbs.editor.address}
                  </Typography>
                ) : (
                  ''
                )}
                {bbs.editor.email ? (
                  <Typography variant="body1" paragraph>
                    {bbs.editor.email}
                  </Typography>
                ) : (
                  ''
                )}
                {bbs.editor.url ? (
                  <Typography variant="body1" paragraph>
                    {bbs.editor.url}
                  </Typography>
                ) : (
                  ''
                )}
              </React.Fragment>
            ) : (
              ''
            )}

            {bbs.abstract ? (
              <React.Fragment>
                <hr />
                <Typography variant="h2" gutterBottom>
                  <Translate>Abstract</Translate>
                </Typography>
                <Typography variant="body1" paragraph>
                  {bbs.abstract}
                </Typography>
              </React.Fragment>
            ) : (
              ''
            )}
          </CardContent>
        </Card>
      );
    }

    return <div />;
  }
}

Bbs.propTypes = {
  isFetching: PropTypes.bool.isRequired,
  bbs: PropTypes.shape({}),
  updatePageTitle: PropTypes.func.isRequired,
  updatePageTitleTooltip: PropTypes.func.isRequired,
};
Bbs.defaultProps = {
  bbs: undefined,
};

export default Bbs;
