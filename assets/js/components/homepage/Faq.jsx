import React, {PropTypes} from 'react';
import I18n from 'react-ghost-i18n';
import muiThemeable from 'material-ui/styles/muiThemeable';

const Faq = (props) => (
  <div>
    <div role="section" className="faq" style={{backgroundColor: props.muiTheme.palette.secondary1Color, color: props.muiTheme.palette.textIconColor, fontFamily: props.muiTheme.fontFamily}}>
      <h3>
        <I18n>Frequently asked questions</I18n>
      </h3>
      <div className="container">
        <div className="row">
          <div className="twelve columns">
            FAQ + button
          </div>
        </div>
      </div>
    </div>
  </div>
);

Faq.propTypes = {
  muiTheme: PropTypes.object.isRequired
};

export default muiThemeable()(Faq);
