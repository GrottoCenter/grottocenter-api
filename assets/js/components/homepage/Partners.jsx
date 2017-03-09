import React, {PropTypes} from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import I18n from 'react-ghost-i18n';

class PartnersItem extends React.Component {
  constructor(props) {
    super(props);
  }

  openWindow() {
    window.open(this.props.partner.customMessage, 'grotto_partner');
  }

  render() {
    let url = '/images/partners/' + this.props.partner.pictureFileName;
    return (
      <div className="vignette">
        <img src={url} alt={this.props.partner.name} onClick={this.openWindow.bind(this)}/>
      </div>
    );
  }
}

PartnersItem.propTypes = {
  partner: PropTypes.object.isRequired
};

class Partners extends React.Component {
  constructor(props) {
    super(props);
    this.state = { // TODO: go get default at Metadata ?
      partners: [],
      page: 0
    };
    this.fetchData();
  }

  fetchData(filters) {
    let url = '/api/partner/findForCarousel';
    $.get(url, this.updateState.bind(this)); // TODO: remove jquery
  }

  updateState(data) {
    this.setState({
      partners: data
    });
  }

  render() {
    let rows = [];
    this.state.partners.forEach(function (partner) {
      let key = 'partcs-' + partner.id;
      rows.push(
          <PartnersItem key={key} partner={partner}/>
      );
    });

    return (
      <div>
        <div role="section" className="partners" style={{fontFamily: this.props.muiTheme.fontFamily}}>
          <h3>
            <I18n>Partners</I18n>
          </h3>
          <div>
            <div className="container">
              <div className="row vignettes">
                <div className="twelve columns">
                  {rows}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Partners.propTypes = {
  muiTheme: PropTypes.object.isRequired
};

export default muiThemeable()(Partners);
