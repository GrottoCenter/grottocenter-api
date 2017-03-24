import React, {PropTypes} from 'react';
import I18n from 'react-ghost-i18n';
import muiThemeable from 'material-ui/styles/muiThemeable';
import CheckIcon from 'material-ui/svg-icons/navigation/check';
import SyncIcon from 'material-ui/svg-icons/notification/sync';

const Association = (props) => (
  <div>
    <div role="section" className="association" style={{backgroundColor: props.muiTheme.palette.primary1Color, color: props.muiTheme.palette.textIconColor, fontFamily: props.muiTheme.fontFamily}}>
      <div className="container">
        <div className="row">
          <div className="eight columns">
            <h3 style={{color: props.muiTheme.palette.accent1Color}}>
              <I18n>Wikicaves association</I18n>
            </h3>
            <h5>
              <I18n>GrottoCenter is a comunity database for cavers based on a wiki-like system Cavers fill the databes for cavers</I18n>
              <br/>
              <I18n>Any interesting natural cave can be added in the database!</I18n>
            </h5>
          </div>
          <div className="four columns">
            <img src="/images/logo.svg"/>
          </div>
        </div>
        <div className="row">
          <div className="twelve columns">
            <p className="listing">
              <I18n>The international voluntary association WikiCaves operates the GrottoCenter web application WikiCaves has as goals:</I18n>
              <ul>
                <li>
                  <CheckIcon color={props.muiTheme.palette.textIconColor} hoverColor={props.muiTheme.palette.accent1Color}/>
                  <div>
                    <I18n>Promote the development of the speleology in the world especially through  web-based collaboration.</I18n>
                  </div>
                </li>
                <li>
                  <CheckIcon color={props.muiTheme.palette.textIconColor} hoverColor={props.muiTheme.palette.accent1Color}/>
                  <div><I18n>Share and spread the data related to the speleology</I18n></div>
                </li>
                <li>
                  <CheckIcon color={props.muiTheme.palette.textIconColor} hoverColor={props.muiTheme.palette.accent1Color}/>
                  <div><I18n>Make access to the natural caves data easier especially by using Internet</I18n></div>
                </li>
                <li>
                  <CheckIcon color={props.muiTheme.palette.textIconColor} hoverColor={props.muiTheme.palette.accent1Color}/>
                  <div><I18n>Highlight and help the protection of the natural caves and their surroundings</I18n></div>
                </li>
                <li>
                  <CheckIcon color={props.muiTheme.palette.textIconColor} hoverColor={props.muiTheme.palette.accent1Color}/>
                  <div><I18n>Help the exploration and the scientific study of natural caves</I18n></div>
                </li>
              </ul>
            </p>
            <div className="goalTextZone">
              <span>
                <I18n>The international voluntary association WikiCaves operates the GrottoCenter web application WikiCaves has as goals:</I18n>
              </span>
            </div>
            <div className="floatingGoals">
              <div className="goal">
                <span style={{color: props.muiTheme.palette.textIconColor}}>
                  <I18n>Promote!</I18n>
                </span>
                <SyncIcon color={props.muiTheme.palette.primary3Color} hoverColor={props.muiTheme.palette.accent1Color} />
                <span className="goalText">
                  <I18n>Promote the development of the speleology in the world especially through  web-based collaboration</I18n>
                </span>
              </div>
              <div className="goal">
                <span style={{color: props.muiTheme.palette.textIconColor}}>
                  <I18n>Share!</I18n>
                </span>
                <SyncIcon color={props.muiTheme.palette.primary3Color} hoverColor={props.muiTheme.palette.accent1Color} />
                <span className="goalText">
                  <I18n>Share and spread the data related to the speleology</I18n>
                </span>
              </div>
              <div className="goal">
                <span style={{color: props.muiTheme.palette.textIconColor}}>
                  <I18n>Open!</I18n>
                </span>
                <SyncIcon color={props.muiTheme.palette.primary3Color} hoverColor={props.muiTheme.palette.accent1Color} />
                <span className="goalText">
                  <I18n>Make access to the natural caves data easier especially by using Internet</I18n>
                </span>
              </div>
              <div className="goal">
                <span style={{color: props.muiTheme.palette.textIconColor}}>
                  <I18n>Highlight!</I18n>
                </span>
                <SyncIcon color={props.muiTheme.palette.primary3Color} hoverColor={props.muiTheme.palette.accent1Color} />
                <span className="goalText">
                  <I18n>Highlight and help the protection of the natural caves and their surroundings</I18n>
                </span>
              </div>
              <div className="goal">
                <span style={{color: props.muiTheme.palette.textIconColor}}>
                  <I18n>Help!</I18n>
                </span>
                <SyncIcon color={props.muiTheme.palette.primary3Color} hoverColor={props.muiTheme.palette.accent1Color} />
                <span className="goalText">
                  <I18n>Help the exploration and the scientific study of natural caves</I18n>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

Association.propTypes = {
  muiTheme: PropTypes.object.isRequired
};

export default muiThemeable()(Association);
