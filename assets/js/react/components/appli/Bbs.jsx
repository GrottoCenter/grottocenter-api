import React from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Translate from '../common/Translate';

// A BBS object has its chapter and matiere in french or english. That's why we need to know the current language chosen by the user.
const Bbs = (props) => {
  const { isFetching, bbs, currentLanguage } = props;

  if (isFetching) {
    return (<CircularProgress />);
  }

  if (bbs) {
    return (
      <Card>
        <CardContent>
          <h1>{bbs.articleTitle}</h1>
          <p>
            {bbs.publicationExport}<Translate> by </Translate>{bbs.cAuthorsFull}
          </p>

          <strong><Translate>Theme</Translate></strong>
          <p>
            {bbs.chapter.id} 
            {" - "}
            {currentLanguage == 'fr' ? bbs.chapter.texteChapitreFrancais : bbs.chapter.texteChapitreAnglais}
            {" - "}
            {currentLanguage == 'fr' ? bbs.chapter.textMatiereFrancais : bbs.chapter.textMatiereAnglais}
          </p>

          {bbs.country ? 
            <div>
              <strong><Translate>Country</Translate></strong>
              <p>
                {bbs.country.country}
              </p>

              <strong><Translate>Abstract</Translate></strong>
              <p>
                {bbs.abstract}
              </p>
            </div>
           : ''}

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
  currentLanguage: "en"
};
Bbs.defaultProps = {
  bbs: undefined,
  currentLanguage: "en"
};

export default Bbs;
