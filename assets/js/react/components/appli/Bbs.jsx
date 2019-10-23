import React from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Translate from '../common/Translate';

// A BBS object has its chapter and matiere in french or english. That's why we need to know the current language chosen by the user.
const Bbs = (props) => {
  const { isFetching, bbs } = props;

  if (isFetching) {
    return (<CircularProgress />);
  }

  if (bbs) {
    return (
      <Card>
        <CardContent>
          <h1>{bbs.title}</h1>
          <p>
            <b><Translate>Published in</Translate></b> {bbs.publicationExport} <b><Translate>by</Translate></b> {bbs.authors}
          </p>

          {bbs.subtheme ? (
            <React.Fragment>
              <strong><Translate>Theme</Translate></strong>
              <p>
                {bbs.subtheme.id}
                {" - "}
                <Translate>{bbs.theme}</Translate>
                {" - "}
                <Translate>{bbs.subtheme.name}</Translate>
              </p>
            </React.Fragment>
          ) : ''}

          {bbs.country ? (
            <React.Fragment>
              <strong><Translate>Country or region</Translate></strong>
              <p>
                {bbs.country.name}
              </p>
            </React.Fragment>
          ) : ''}

          {bbs.abstract ? (
            <React.Fragment>
              <strong><Translate>Abstract</Translate></strong>
              <p>
                {bbs.abstract}
              </p>
            </React.Fragment>
          ) : ''}

          <strong><Translate>Reference</Translate></strong>
          <p>
            {bbs.id}
          </p>
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
