"use strict";

var HomepageHeader = React.createClass({
  displayName: 'HomepageHeader',

  render: function() {
    return (
      <header className="header fixed-top clearfix">

        <div className="container-fluid">
          <div className="row toolbar">
            <div className="col-xs-4">
              <LanguagePicker/>
            </div>

            <div className="col-xs-8">
              <SignToolbar/>
            </div>
          </div>

          <div className="row brand bgwhite">
            <div className="col-xs-12">
              <a href="" className="logo">
                <img src="/images/logo.svg" alt="logo-wikicaves"/>
              </a>
              <h1 className="sitename">Grottocenter</h1>
              <span className="slogan">
                <I18n label="The Wiki database made by cavers for cavers."/>
              </span>
            </div>
          </div>

          <div className="row bgwhite">
            <div className="col-xs-12">
              <img className="logofse" src="/images/FSE.svg" alt="logo-fse"/>
              <span className="gc-fse-info">
                <I18n label="Grottocenter is supported by the FSE"/>
              </span>
            </div>
          </div>

          <div className="row searchbar">
            <div className="col-xs-12">
              <SearchBar/>
            </div>
          </div>
        </div>
      </header>
    );
  }
});

var HomepageArticles = React.createClass({
  displayName: 'HomepageArticles',

  render: function() {
    return (
      <div>
        <div role="section">
          <div className="container-fluid">
            <div className="row">
              <div className="col-xs-12 col-md-6">
                <HomepageCards/>
              </div>
              <div className="col-xs-12 col-md-6">
                <RandomCaveCard/>
              </div>
            </div>
          </div>
        </div>
        <div role="section">
          <div className="container-fluid">
            <div className="row">
              <div className="col-xs-12">
                <PartnerCarousel/>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

var HomepageFooter = React.createClass({
  displayName: 'HomepageFooter',

  render: function() {
    return (
      <footer>
        <div className="container-fluid">
          <div className="row">
            <div className="col-xs-3">
              <div>Published by</div>
              <img height="48" src="/images/logoGC.png"/>
              <a href="http://www.wikicaves.org/" target="_blank">association Wikicaves</a>
            </div>
            <div className="col-xs-3 social">
              <a href="https://www.facebook.com/GrottoCenter" target="_blank"><img src="/images/facebook.svg" alt=""/></a>
              <a href="http://www.grottocenter.org/html/rss_Es.xml" target="_blank"><img src="/images/rss.png" alt=""/></a>
              <a href="http://blog-fr.grottocenter.org/" target="_blank"><img src="/images/blog.png" alt=""/></a>
              <a href="https://twitter.com/grottocenter" target="_blank"><img src="/images/twitter.png" alt=""/></a>
            </div>
            <div className="col-xs-3 infos">
              <a href="https://github.com/GrottoCenter" target="_blank"><img src="/images/github.png" alt=""/></a>
              <a href="modal-mail.html" data-target="#mail" data-toggle="modal" tabindex="-1" role="dialog" aria-labelledby="mail" aria-hidden="true"><img src="/images/icon/ic_contact_mail_black_48px.png" alt=""/></a>
              <a href="http://www.grottocenter.org//html/legal_and_privacy_En.php"><img src="/images/ic_info_black_48px.png" alt=""/></a>
              <a href="http://www.grottocenter.org//html/bats_Fr.php"><img src="/images/bats.svg" alt=""/></a>
            </div>
            <div className="col-xs-3">
              <div className="centered bigger">Support Wikicaves</div>
              <img src="/images/btn_donateCC_LG.gif" alt=""/>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12">
              <p>
                <I18n label="Unless stated otherwise, all text and image are available under the terms of the "/>
                <I18n label="Creative Commons Attribution-ShareAlike 3.0 Unported."/>
                <a href="http://creativecommons.org/licenses/by-sa/3.0/fr/" target="_blank"><img height="24" src="/images/CC-BY-SA.png" alt=""/></a>
              </p>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12">
              <p>
                <I18n label="This site, although it may contain detailed information on caves, was not designed to facilitate the visit for none caver people. Dangers are not necessarily reported and information mentioned is not everytime verified."/>
                <I18n label="Caving is a discipline with many facets:  cultural, science and sports. In the latter capacity, it often requires a physical commitment. It is also not free of risks, and even major risks. These risks, if they can not be completely eliminated, are at least greatly reduced by a practice in the rules, practice which is fully understood when under a caving club (grotto)."/>
                <I18n label="In any case GROTTOCENTER and its team can not be held liable for a bad practice of caving."/>
                <I18n label="The novice who would engage in underground exploration is urged to contact a caving club. The names and contact information can be obtained among other to the IUS (International Union of Speleology), to GROTTOCENTER or to his national federation."/>
              </p>
            </div>
          </div>
        </div>
      </footer>
    );
  }
});


var HomepageLatestNews = React.createClass({
  render: function() {
    return (
      <div>
        <div role="section" style={{'minHeight': '500px', 'background': 'linear-gradient(to top, rgb(251, 251, 222) 0%, rgb(255, 223, 174) 100%)'}}>
          <h2  style={{'text-align': 'center', 'padding-bottom': '50px'}}>UPCOMING EVENTS</h2>
          <div className="container-fluid">
            <div className="row" style={{'width': '80%', 'margin': 'auto'}}>
              <div style={{'textAlign': 'center'}} className="col-xs-12 col-md-4">
                <BasicCard title="A new partner has joined!" image="/images/homepage/build.jpg">
                  The association <a htref="#">Speleo Forever</a> has decide to contribute to GC
                </BasicCard>
              </div>
              <div style={{'textAlign': 'center'}} className="col-xs-12 col-md-4">
                <BasicCard title="National caving days" image="/images/homepage/entry.jpg">
                  National caving days will occurs on 4th of October. A great opportunity to discover this "indoor" activity!
                </BasicCard>
              </div>
              <div style={{'textAlign': 'center'}} className="col-xs-12 col-md-4">
                <BasicCard title="Other big event" image="/images/homepage/news.jpg">
                  Hae duae provinciae bello quondam piratico catervis mixtae praedonum a Servilio pro consule missae sub iugum factae sunt vectigales. et hae quidem regiones velut in prominenti terrarum lingua positae ob orbe eoo monte Amano disparantur.
                </BasicCard>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }
});

var HomepageAssociation = React.createClass({
  render: function() {
    return (
      <div>
        <div role="section" style={{'minHeight': '500px', 'background': 'linear-gradient(to top, rgb(251, 251, 222) 0%, rgb(255, 223, 174) 100%)'}}>
          <div className="container-fluid">
            <div className="row" style={{'width': '80%', 'margin': 'auto'}}>
              <div style={{'text-align': 'left', 'padding-top': '20px'}} className="col-xs-6">
                <h3 style={{'font-size': '35px', 'padding-bottom': '30px'}}>L'association Wikicaves</h3>
                <h5 style={{'font-size': '18px', 'padding-bottom': '30px'}}>Le site www.grottocenter.org est une base de donnée mondiale, communautaire dédiée à la spéléologie et alimentée par les spéléologues sur le principe du Wiki. Toute cavité naturelle présentant un intérêt à tes yeux peut y être enregistrée !</h5  >
                <p>Le site est édité par l'association Wikicaves qui s'est fixée comme objectif de :
                  <ul>
                    <li>Favoriser le développement de la spéléologie dans le monde, notamment par l'Internet collaboratif.</li>
                    <li>Diffuser et partager les informations liées à la pratique de la spéléologie.</li>
                    <li>Faciliter l'accès aux informations concernant les cavités naturelles, notamment via Internet.</li>
                    <li>Mettre en valeur et contribuer à la protection des cavités naturelles et de leur environnement.</li>
                    <li>Aider l'exploration et l'étude scientifique des cavités naturelles.</li>
                  </ul>
                </p>
              </div>
              <div style={{'text-align': 'center', 'padding-top': '20px'}} className="col-xs-6">
                <img style={{'width': '100%', 'max-width': '500px'}} src="/images/homepage/montain.png"/>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

var HomepageWhatIsIt = React.createClass({
  render: function() {
    return (
      <div>
        <div role="section" style={{'minHeight': '500px', 'background': 'linear-gradient(to top, rgb(251, 251, 222) 0%, rgb(255, 223, 174) 100%)'}}>
          <h2  style={{'text-align': 'center', 'padding-bottom': '50px'}}>FOCUS ON GROTTOCENTER</h2>
          <div className="container-fluid">
            <div className="row" style={{'width': '80%', 'margin': 'auto'}}>
              <div style={{'text-align': 'center', 'padding-top': '20px'}} className="col-xs-6 col-sm-3">
                <div className="animData">123</div>

                <div style={{'padding-top': '20px'}}>est un nombre à définir</div>
              </div>
              <div style={{'text-align': 'center', 'padding-top': '20px'}} className="col-xs-6 col-sm-3">
                <div className="animData">15000</div>

                <div style={{'padding-top': '20px'}}>est le nombre d'entrée que GC rassemble les données spéléos mondiale</div>
              </div>
              <div style={{'text-align': 'center', 'padding-top': '20px'}} className="col-xs-6 col-sm-3">
                <div className="animData">30</div>

                <div style={{'padding-top': '20px'}}>est le nombre de clubs qui font confiance à GC</div>
              </div>
              <div style={{'text-align': 'center', 'padding-top': '20px'}} className="col-xs-6 col-sm-3">
                <div className="animData">250</div>

                <div style={{'padding-top': '20px'}}>est le nombre de spéléos contributeurs</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

var HomepageRandomEntry = React.createClass({
  render: function() {
    return (
      <div>
        <div role="section" className="randomEntryBg">
          <h2  style={{'text-align': 'center', 'padding-bottom': '50px'}}>RANDOM ENTRY</h2>
          <div className="container-fluid">
            <RandomCave/>
          </div>
        </div>
      </div>
    );
  }
});

var HomepagePartnersItem = React.createClass({
  render: function() {
    var url = "/images/partners/" + this.props.partner.pictureFileName;

    return (
      <div style={{'text-align': 'center', 'padding-top': '20px'}} className="col-xs-6 col-sm-3 col-md-2">
        <div>
          <img src={url} alt={this.props.partner.name}/>
        </div>
      </div>
    );
  }
});

var HomepagePartners = React.createClass({
  getInitialState: function() {
    return {
      partners: [],
      page: 0
    };
  },

  componentWillMount: function() {
    clearInterval(this.timerID);
    this.fetchData();
  },

  componentDidMount: function() {
    this.timerID = setInterval(
      () => this.switchPage(),
      5000
    );
  },

  fetchData: function() {
    console.log("Fetch data");
    var _this = this;
    var url = "/partner/findForCarousel";

    $.get(url, function(data) {
      _this.setState({
        partners: data
      });
    });
  },

  switchPage: function() {
    console.log("Switch page");
  },

  render: function() {
    console.log("render");

    var rows = [];

    var pageId = "partners" + this.state.page;
    var i = 0;
    this.state.partners.forEach(function(partner) {
      var key = "partcs-" + partner.id;
      rows.push(
        <HomepagePartnersItem key={key} partner={partner}/>
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
});

var HomepageRecentContributions = React.createClass({
  render: function() {
    return (
      <div>
        <div role="section" style={{'minHeight': '500px', 'background': 'linear-gradient(to top, rgb(251, 251, 222) 0%, rgb(255, 223, 174) 100%)'}}>
          <h2 style={{'text-align': 'center', 'padding-bottom': '50px'}}>RECENT CONTRIBUTIONS</h2>
          <div className="container-fluid">
            <div className="row">
              <div style={{'textAlign': 'center'}} className="col-xs-12">
                <div className="animEvent">
                  <div style={{'display': 'inline-table', 'width': '10%'}}>
                    <div style={{'fontSize': '1.5em', 'fontWeight': 'bold'}}>09</div>
                    <div style={{'fontSize': '1.5em', 'fontWeight': 'bold'}}>Sep</div>
                    <div style={{'fontSize': '1.5em', 'fontWeight': 'bold'}}>2015</div>
                  </div>
                  <div style={{'text-align': 'left', 'display': 'inline-table', 'width': '80%'}}>
                    <span>
                      <h5>
                        <a href="#">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</a>
                      </h5>
                      <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                    </span>
                  </div>
                  <div style={{'display': 'inline-table', 'width': '10%'}}>
                    <span><a href="/drupal_55960/?q=node/128">view</a></span>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div style={{'textAlign': 'center'}} className="col-xs-12">
                <div className="animEvent">
                  <div style={{'display': 'inline-table', 'width': '10%'}}>
                    <div style={{'fontSize': '1.5em', 'fontWeight': 'bold'}}>09</div>
                    <div style={{'fontSize': '1.5em', 'fontWeight': 'bold'}}>Sep</div>
                    <div style={{'fontSize': '1.5em', 'fontWeight': 'bold'}}>2015</div>
                  </div>
                  <div style={{'text-align': 'left', 'display': 'inline-table', 'width': '80%'}}>
                    <span>
                      <h5>
                        <a href="#">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</a>
                      </h5>
                      <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                    </span>
                  </div>
                  <div style={{'display': 'inline-table', 'width': '10%'}}>
                    <span><a href="/drupal_55960/?q=node/128">view</a></span>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div style={{'textAlign': 'center'}} className="col-xs-12">
                <div className="animEvent">
                  <div style={{'display': 'inline-table', 'width': '10%'}}>
                    <div style={{'fontSize': '1.5em', 'fontWeight': 'bold'}}>09</div>
                    <div style={{'fontSize': '1.5em', 'fontWeight': 'bold'}}>Sep</div>
                    <div style={{'fontSize': '1.5em', 'fontWeight': 'bold'}}>2015</div>
                  </div>
                  <div style={{'text-align': 'left', 'display': 'inline-table', 'width': '80%'}}>
                    <span>
                      <h5>
                        <a href="#">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</a>
                      </h5>
                      <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                    </span>
                  </div>
                  <div style={{'display': 'inline-table', 'width': '10%'}}>
                    <span><a href="/drupal_55960/?q=node/128">view</a></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});


var HomepageFlat = React.createClass({
  displayName: 'Homepage',

  render: function() {
    return (
      <div>
        <HomepageHeader/>
        <HomepageLatestNews/>
        <HomepageAssociation/>
        <HomepageWhatIsIt/>
        <HomepageRandomEntry/>
        <HomepagePartners nbDisplayed="6"/>
        <HomepageRecentContributions/>
        <HomepageFooter/>
      </div>
    );
  }
});

ReactDOM.render(React.createElement(HomepageFlat, null), document.getElementById('homepage_wrapper'));
