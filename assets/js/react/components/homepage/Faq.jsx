import React, {PropTypes} from 'react';
import I18n from 'react-ghost-i18n';
import muiThemeable from 'material-ui/styles/muiThemeable';
import GCLink from '../GCLink';
import RaisedButton from 'material-ui/RaisedButton';

const Faq = (props) => (
  <div>
    <div role="section" className="faq" style={{backgroundColor: props.muiTheme.palette.secondary1Color, color: props.muiTheme.palette.textIconColor}}>
      <h3>
        <I18n>Frequently asked questions</I18n>
      </h3>
      <div className="container">
        <div className="row">
          <div className="twelve columns">
            <div id="collapsibleFaq">
              <h5>Question 1</h5>
              <div>
                <p>Mauris mauris ante, blandit et, ultrices a, suscipit eget, quam. Integer ut neque. Vivamus nisi metus, molestie vel, gravida in, condimentum sit amet, nunc. Nam a nibh. Donec suscipit eros. Nam mi. Proin viverra leo ut odio. Curabitur malesuada. Vestibulum a velit eu ante scelerisque vulputate.</p>
              </div>
              <h5>Question 2</h5>
              <div>
                <p>Sed non urna. Donec et ante. Phasellus eu ligula. Vestibulum sit amet purus. Vivamus hendrerit, dolor at aliquet laoreet, mauris turpis porttitor velit, faucibus interdum tellus libero ac justo. Vivamus non quam. In suscipit faucibus urna. </p>
              </div>
              <h5>Question 3</h5>
              <div>
                <p>Nam enim risus, molestie et, porta ac, aliquam ac, risus. Quisque lobortis. Phasellus pellentesque purus in massa. Aenean in pede. Phasellus ac libero ac tellus pellentesque semper. Sed ac felis. Sed commodo, magna quis lacinia ornare, quam ante aliquam nisi, eu iaculis leo purus venenatis dui. </p>
                <ul>
                  <li>List item one</li>
                  <li>List item two</li>
                  <li>List item three</li>
                </ul>
              </div>
              <h5>Question 4</h5>
              <div>
                <p>Cras dictum. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aenean lacinia mauris vel est. </p><p>Suspendisse eu nisl. Nullam ut libero. Integer dignissim consequat lectus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. </p>
              </div>
            </div>
          </div>
        </div>
        <div className="row" style={{'textAlign': 'right'}}>
          <div className="twelve columns">
            <RaisedButton secondary={true}>
              <GCLink internal={true} href='/ui/faq'>
                <I18n>More questions?</I18n>
              </GCLink>
            </RaisedButton>
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
