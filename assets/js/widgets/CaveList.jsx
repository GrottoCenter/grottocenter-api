/**
 * React component to display a simple cave listing table
 *
 * See specification:
 */
"use strict";

var CActionButtons = React.createClass({
  render: function() {
    return (React.createElement("td", null, React.createElement("a", {
      className: "mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--colored",
      href: "/ui/cave/edit/" + this.props.id
    }, "Edit"), React.createElement("a", {
      className: "mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color--red mdl-color-text--white",
      href: "/ui/cave/delete/" + this.props.id
    }, "Delete")));
  }
});

var CProductRow = React.createClass({
  render: function() {
    var entries = [];
    this.props.cave.entries.forEach(function(entry) {
      entries.push(React.createElement("li", null, entry.name));
    });

    var entryElement = React.createElement("span", null, "No entries defined");
    if (entries.length > 0) {
      entryElement = React.createElement("ul", {
        className: "list-unstyled"
      }, entries);
    }

    return (React.createElement("tr", null, React.createElement("td", null, this.props.cave.id), React.createElement("td", null, this.props.cave.author.nickname), React.createElement("td", null, this.props.cave.name), React.createElement("td", null, entryElement), React.createElement("td", null, this.props.cave.depth), React.createElement("td", null, this.props.cave.length), React.createElement("td", null, this.props.cave.isDiving), React.createElement("td", null, this.props.cave.temperature), React.createElement("td", null, this.props.cave.dateInscription), React.createElement(CActionButtons, {id: this.props.cave.id})));
  }
});

var CProductTable = React.createClass({
  render: function() {
    var rows = [];
    this.props.caves.forEach(function(cave) {
      rows.push(React.createElement(CProductRow, {
        cave: cave,
        key: cave.id
      }));
    });
    return (React.createElement("div", {
      className: "table-responsive"
    }, React.createElement("table", {
      className: "table table-striped"
    }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "ID"), React.createElement("th", null, "Author"), React.createElement("th", null, "Cave name"), React.createElement("th", null, "Entry(ies)"), React.createElement("th", null, "Depth"), React.createElement("th", null, "Length"), React.createElement("th", null, "Diving ?"), React.createElement("th", null, "Temperature"), React.createElement("th", null, "Adding date"), React.createElement("th", null, ""))), React.createElement("tbody", null, rows))));
  }
});

var CSearchBar = React.createClass({
  handleChange: function() {
    this.props.onUserInput(this.refs.caveSearchInput.value);
  },

  render: function() {
    return (React.createElement("form", null, React.createElement("label", {
      htmlFor: "caveSearch"
    }, "Filter cave name: "), React.createElement("input", {
      id: "caveSearch",
      type: "text",
      placeholder: "Search...",
      value: this.props.filterName,
      ref: "caveSearchInput",
      onChange: this.handleChange
    })));
  }
});

var CFilterableProductTable = React.createClass({
  getInitialState: function() {
    return {filterName: '', caves: []};
  },

  componentDidMount: function() {
    this.fetchData({});
  },

  fetchData: function(filters) {
    var _this = this;
    var url = "/cave/findAll";
    if (filters.filterName != undefined) {
      url += "?name=" + filters.filterName;
    }

    $.get(url, function(data) {
      _this.setState({caves: data});
    });

    //$.ajax({
    //    url: this.props.url,
    //    dataType: 'json',
    //    success: function(data) {
    //        this.setProps({data: data});
    //    }.bind(this)
    //});
  },

  handleUserInput: function(filterName) {
    this.setState({filterName: filterName});
    this.fetchData({filterName: filterName});
  },

  render: function() {
    return (React.createElement("div", null, React.createElement(CSearchBar, {
      filterName: this.state.filterName,
      onUserInput: this.handleUserInput
    }), React.createElement(CProductTable, {caves: this.state.caves})));
  }
});
