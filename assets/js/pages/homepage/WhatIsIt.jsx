import React from 'react'
import I18n from 'react-ghost-i18n'

const WhatIsIt = () => (
    <div role="section" style={{'font-family': 'Open Sans'}}>
      <h3 style={{'text-align': 'center', 'padding-bottom': '50px'}}>
        <I18n>Grottocenter numbers</I18n>
          <span className="icon icon-gc-bat" style={{'color':'black','vertical-align': 'super'}}></span><br/>

            <i className="material-icons">flare</i>
              <i className="material-icons">grid off</i>
                <i className="material-icons">radio</i>
                  <i className="material-icons">hdr_strong</i>
                  <i className="material-icons">battery_std</i>
        <i className="material-icons">shuffle</i>
      </h3>
      <div className="container">
        <div className="row">
          <div className="six columns">
            <span className="icon icon-gc-entry" style={{'color':'#885B39','font-size': '5em','vertical-align': 'text-bottom'}}></span>
            <span style={{'color':'#885B39','font-size': '3em'}}>39175 </span><br/>
            39175 <I18n>caves are freely accessible from the following page (</I18n>50 902 <I18n>by logging on</I18n> <a href='http://www.grottocenter.org'>Grotto v2</a>)
            <br/>
            <br/>
            <span className="icon icon-gc-speleo" style={{'color':'#885B39','font-size': '4em'}}></span>
            <span style={{'color':'#885B39','font-size': '3em'}}>2724 </span><br/>
            2724 <I18n>cavers take part, day after day, in improving and expanding the database</I18n>
          </div>
          <div className="six columns">
            <span className="icon icon-gc-expe" style={{'color':'#885B39','font-size': '4em'}}></span>
            <span style={{'color':'#885B39','font-size': '3em'}}>16 </span><br/>
            16 <I18n>organizations who take part in the project by  funding, providing data,communicating on the interest and benefits of  cavers to share data.</I18n>
            <br/>
            <br/>
            <span className="icon icon-gc-club" style={{'color':'#885B39','font-size': '4em'}}></span>
            <span style={{'color':'#885B39','font-size': '3em'}}>654 </span><br/>
            654 <I18n>organizations are registered on the site</I18n>
          </div>
        </div>
      </div>
    </div>
)
export default WhatIsIt
