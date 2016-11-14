/**
 * React component to display a simple cave listing table
 *
 * See specification:
 */

var ActionButtons = React.createClass({
  render: function() {
    return (
		React.createElement("td", null,
			React.createElement("a", {className: "mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--colored", href: "/ui/cave/edit/" + this.props.id}, "Edit"),
			React.createElement("a", {className: "mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color--red mdl-color-text--white", href: "/ui/cave/delete/" + this.props.id}, "Delete")
		)
    );
  }
});

 var ProductRow = React.createClass({
  render: function() {
	var entries = [];
	this.props.entry.caves.forEach(function(cave) {
		entries.push(React.createElement("li", null, cave.name));
	});

	var entryElement = React.createElement("span", null, "No cave defined");
	if (entries.length > 0) {
		entryElement = 	React.createElement("ul", {className: "list-unstyled"}, entries);
	}

    return (
		React.createElement("tr", null,
			React.createElement("td", null, this.props.entry.id),
			React.createElement("td", null, this.props.entry.author.nickname),
			React.createElement("td", null, this.props.entry.name),
			React.createElement("td", null, entryElement),
			React.createElement("td", null, this.props.entry.region),
			React.createElement("td", null, this.props.entry.country),
			React.createElement("td", null, this.props.entry.city),
			React.createElement("td", null, this.props.entry.yearDiscovery),
			React.createElement("td", null, this.props.entry.isSensitive),
			React.createElement("td", null, this.props.entry.dateInscription),
			React.createElement(ActionButtons, {id: this.props.entry.id})
		)
    );
  }
});

var ProductTable = React.createClass({
  render: function() {
    var rows = [];
    this.props.entries.forEach(function(entry) {
      rows.push(React.createElement(ProductRow, {entry: entry, key: entry.id}));
    });
    return (
		React.createElement("div", {className: "table-responsive"},
			React.createElement("table", {className: "table table-striped"},
				React.createElement("thead", null,
					React.createElement("tr", null,
						React.createElement("th", null, "ID"),
						React.createElement("th", null, "Author"),
						React.createElement("th", null, "Entry name"),
						React.createElement("th", null, "Cave(s)"),
						React.createElement("th", null, "Region"),
						React.createElement("th", null, "Country"),
						React.createElement("th", null, "City"),
						React.createElement("th", null, "Discovery"),
						React.createElement("th", null, "Sensitive?"),
						React.createElement("th", null, "Adding date"),
						React.createElement("th", null, "")
					)
				),
				React.createElement("tbody", null, rows)
			)
		)
    );
  }
});

var SearchBar = React.createClass({
  handleChange: function() {
    this.props.onUserInput(this.refs.entrySearchInput.value, this.refs.regionSearchInput.value);
  },

  render: function() {
    return (
		React.createElement("form", null,
			React.createElement("div", null,
				React.createElement("label", {htmlFor: "entrySearch"}, "Filter entry name: "),
				React.createElement("input", {id: "entrySearch",
											  type: "text",
											  placeholder: "Search...",
											  value: this.props.filterEntryName,
											  ref: "entrySearchInput",
											  onChange: this.handleChange}
				)
			),
			React.createElement("div", null,
				React.createElement("label", {htmlFor: "regionSearch"}, "Filter region name: "),
				React.createElement("input", {id: "regionSearch",
											  type: "text",
											  placeholder: "Search...",
											  value: this.props.filterRegion,
											  ref: "regionSearchInput",
											  onChange: this.handleChange}
				)
			)
		)
    );
  }
});

var FilterableProductTable = React.createClass({
  getInitialState: function() {
    return {
      filterEntryName: '',
	  filterRegion: '',
	  entries: []
    };
  },

  componentDidMount: function () {
	this.fetchData({});
  },

  fetchData: function (filters) {
	var _this = this;
	var url = "/entry/findAll";
	var params = '';

	if (filters.filterEntryName != undefined && filters.filterEntryName != '') {
		params += "?name=" + filters.filterEntryName;
	}

	if (filters.filterRegion != undefined && filters.filterRegion != '') {
		params += (params == '') ? "?" : "&";
		params += "region=" + filters.filterRegion;
	}

	$.get(url + params, function (data) {
		_this.setState({
		  entries: data
		});
	});
  },

  handleUserInput: function(filterEntryName, filterRegion) {
	this.setState({
		filterEntryName: filterEntryName,
		filterRegion: filterRegion
	});
	this.fetchData({filterEntryName: filterEntryName, filterRegion: filterRegion});
  },

  render: function() {
	return (
		React.createElement("div", null,
			React.createElement(SearchBar, {filterEntryName: this.state.filterEntryName, filterRegion: this.state.filterRegion, onUserInput: this.handleUserInput}),
			React.createElement(ProductTable, {entries: this.state.entries})
		)
	);
  }
});
