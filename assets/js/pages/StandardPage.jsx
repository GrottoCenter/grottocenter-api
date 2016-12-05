import React from 'react';
var StandardHeader = React.createClass({
  displayName: 'StandardHeader',

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


var StandardFooter = React.createClass({
  displayName: 'StandardFooter',

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

var StandardPage = React.createClass({
  displayName: 'Standard page',

  render: function() {
    return (
      <div>
        <StandardHeader/>
        {this.props.children}
        <StandardFooter/>
      </div>
    );
  }
});
