import React, {PropTypes} from 'react';
import I18n from 'react-ghost-i18n';
import muiThemeable from 'material-ui/styles/muiThemeable';
import Avatar from 'material-ui/Avatar';

const Welcome = (props) => (
  <div>
    <div role="section" className="welcome" style={{backgroundColor: '#91756a', color: props.muiTheme.palette.textIconColor, fontFamily: props.muiTheme.fontFamily}}>
      <div className="container">
        <div className="row">
          <div className="four columns">
            <Avatar src="/images/caves/draperie_small.jpg"/>
          </div>
          <div className="eight columns">
            <h3 style={{color: props.muiTheme.palette.accent1Color}}>
              <I18n>Welcome to Grottocenter!</I18n>
            </h3>
            <p><I18n>This 31 version of the site is  improving gradually to allow  a simpler navigation from all your peripherals</I18n></p>
            <p><I18n>The application is faster, and benefits  from a code of higher quality which is also easier to maintain: data processing specialist may join the development team and easily contribute</I18n></p>
            <p><I18n>As of today, you can access updated information on caving, an effective module for quick search and quality information on caves Regularly  log in to discover new features and keep on using Grottocenter to take part and use information already added by the community</I18n></p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

Welcome.propTypes = {
  muiTheme: PropTypes.object.isRequired
};

export default muiThemeable()(Welcome);
