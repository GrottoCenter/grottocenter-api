import React from 'react'
class PartnersItem extends React.Component {
    constructor(props) {
        super(props);
    }
    openWindow() {
      window.open(this.props.partner.customMessage, 'grotto_partner');
    }
    render() {
        var url = "/images/partners/" + this.props.partner.pictureFileName;
        return (
        <div style={{'text-align': 'center', 'padding-top': '20px'}} className="col-xs-6 col-sm-3 col-md-2" onClick={this.openWindow.bind(this)} style={{cursor:'pointer'}}>
            <div>
              <img src={url} alt={this.props.partner.name}/>
            </div>
          </div>
        );
    }
}

export default class Partners extends React.Component {

    constructor(props) {
        super(props);
        this.state = { // TODO: go get default at Metadata ?
            partners: [],
            page: 0
        };
        this.fetchData();
    }

    fetchData(filters) {
        var url = "/partner/findForCarousel";
        $.get(url, this.updateState.bind(this)); // TODO: remove jquery
    }
    updateState(data) {
        this.setState({
            partners: data
        });
    }

    render() {
        var rows = [];

        var pageId = "partners" + this.state.page;
        var i = 0;
        this.state.partners.forEach(function (partner) {
            var key = "partcs-" + partner.id;
            rows.push(
                <PartnersItem key={key} partner={partner}/>
            );
            i++;
        });

        return (
            <div>
            <div role="section" style={{'minHeight': '500px', 'background': 'linear-gradient(to top, rgb(251, 251, 222) 0%, rgb(255, 223, 174) 100%)'}}>
              <h2 style={{'text-align': 'center', 'padding-bottom': '50px'}}>OFFICIAL PARTNERS</h2>
              <div>
                <div className="container-fluid">
                  <div className="row vignettes">
                    {rows}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
}
