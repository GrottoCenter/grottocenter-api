import React, {PropTypes} from 'react';
import I18n from 'react-ghost-i18n';
import muiThemeable from 'material-ui/styles/muiThemeable';
import GCLink from '../GCLink';

const WhatIsIt = (props) => (
    <div role="section" className="numbers" style={{fontFamily: props.muiTheme.fontFamily}}>
      <h3>
        <I18n>Grottocenter numbers</I18n>
        <span className="icon icon-gc-bat" style={{'color':'black','verticalAlign': 'super'}}></span><br/>
      </h3>
      <div className="container">
        <div className="row">
          <div className="six columns">
            <span className="icon icon-gc-entries" style={{'color':'#885B39','fontSize': '4em'}}></span><br/>
            <span style={{'color':'#885B39','fontSize': '3em'}}>39175</span>
            <I18n>caves are freely accessible from the following page (</I18n> 50902 <I18n>by logging on</I18n> <GCLink href='http://www.grottocenter.org'>Grotto v2</GCLink>)
          </div>
          <div className="six columns">
            <span className="icon icon-gc-club" style={{'color':'#885B39','fontSize': '4em'}}></span><br/>
            <span style={{'color':'#885B39','fontSize': '3em'}}>16 </span>
              <I18n>organizations who take part in the project by  funding, providing data,communicating on the interest and benefits of  cavers to share data</I18n>
          </div>
        </div>
        <div className="row">
          <div className="six columns">
            <span className="icon icon-gc-speleo" style={{'color':'#885B39','fontSize': '4em'}}></span><br/>
            <span style={{'color':'#885B39','fontSize': '3em'}}>2724 </span>
            <I18n>cavers take part, day after day, in improving and expanding the database</I18n>
          </div>
          <div className="six columns">
            <span className="icon icon-gc-expe" style={{'color':'#885B39','fontSize': '4em'}}></span><br/>
            <span style={{'color':'#885B39','fontSize': '3em'}}>654 </span>
              <I18n>organizations are registered on the site</I18n>
          </div>
        </div>
      </div>
    </div>
);

WhatIsIt.propTypes = {
  muiTheme: PropTypes.object.isRequired
};

export default muiThemeable()(WhatIsIt);
