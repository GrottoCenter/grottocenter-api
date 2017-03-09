import React, {PropTypes} from 'react';
import RandomEntryCard from './../RandomEntryCard';
import I18n from 'react-ghost-i18n';
import muiThemeable from 'material-ui/styles/muiThemeable';

const RandomEntry = (props) => (
  <div>
    <div role="section" className="randomEntry randomEntryBg" style={{fontFamily: props.muiTheme.fontFamily}}>
      <h3 style={{color: props.muiTheme.palette.secondaryBlocTitle}}>
        <I18n>A cave on Grottocenter</I18n>
      </h3>
      <div className="container">
        <RandomEntryCard/>
      </div>
    </div>
  </div>
);

RandomEntry.propTypes = {
  muiTheme: PropTypes.object.isRequired
};

export default muiThemeable()(RandomEntry);
