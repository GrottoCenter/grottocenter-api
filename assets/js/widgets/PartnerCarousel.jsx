/**
 * TODO Add comment
 */
 import React from 'react'

var PartnerCarouselLinks = React.createClass({
  render: function() {
    var pageCount = Math.abs(this.props.total / 6);
    if ((pageCount * 6) < this.props.total) {
      pageCount++;
    }
    var pages = [];

    var first = true;
    for (var i = 0; i < pageCount; i++) {
      var key = "partcl-" + i;
      if (first === true) {
        pages.push(
          <li className="active" data-target="#myCarousel" key={key} data-slide-to={i}></li>
        );
        first = false;
      } else {
        pages.push(
          <li data-target="#myCarousel" key={key} data-slide-to={i}></li>
        );
      }
    }

    return (
      <ol className="carousel-indicators">
        {pages}
      </ol>
    );
  }
});

var PartnerCarouselScreen = React.createClass({
  render: function() {
    var rows = [];

    var i = 0;
    this.props.items.forEach(function(partner) {
      var url = "/images/partners/" + partner.pictureFileName;
      var key = "partcs-" + i++;
      rows.push(
        <div key={key}><img src={url} alt={partner.name}/></div>
      );
    });

    var styles = "item";
    if (this.props.active === true) {
      styles += " active";
    }
    return (
      <div className={styles}>
        {rows}
      </div>
    );
  }
});

var PartnerCarouselScreens = React.createClass({
  render: function() {
    var block = [];
    var rows = [];

    var y = 0;
    for (var i = 0; i < this.props.partners.length; i++) {
      if (i > 0 && (i % 6) === 0) {
        y++;
      }
      if (block[y] == undefined) {
        block[y] = new Array();
      }
      block[y].push(this.props.partners[i]);
    }
    var start = true;
    var i = 0;
    block.forEach(function(blockItem) {
      var key = "partcss-" + i++;
      rows.push(<PartnerCarouselScreen key={key} items={blockItem} active={start}/>);
      start = false;
    });

    return (
      <div className="carousel-inner" role="listbox">
        {rows}
      </div>
    );
  }
});

var PartnerCarousel = React.createClass({
  displayName: 'PartnerCarousel',

  getInitialState: function() {
    return {partners: []};
  },

  componentWillMount: function() {
    this.fetchData({});
  },

  fetchData: function(filters) {
    var _this = this;
    var url = "/partner/findForCarousel";

    $.get(url, function(data) {
      _this.setState({partners: data});
    });
  },

  render: function() {
    return (
      <div id="myCarousel" className="carousel slide" data-ride="carousel">
        <PartnerCarouselLinks total={this.state.partners.length}/>

        <PartnerCarouselScreens partners={this.state.partners}/>

        <a className="left carousel-control" href="#myCarousel" role="button" data-slide="prev">
          <span className="slideleft" aria-hidden="true">
            &lt;
          </span>
          <span className="sr-only">Previous</span>
        </a>

        <a className="right carousel-control" href="#myCarousel" role="button" data-slide="next">
          <span className="slideright" aria-hidden="true">
            &gt;
          </span>
          <span className="sr-only">Next</span>
        </a>
      </div>
    );
  }
});
