/**
 * TODO Add comment
 */

var LanguagePickerEntry = React.createClass({
  render: function() {
    var lang = "?lang=" + this.props.data.lang;
    return (
      <li>
        <a href={lang}>{this.props.data.name}</a>
      </li>
    );
  }
});

var LanguagePicker = React.createClass({
  render: function() {

    // TODO To be dynamised with controler + db table
    var data = [
      {
        lang: "fr",
        name: "Français"
      }, {
        lang: "en",
        name: "English"
      }, {
        lang: "de",
        name: "Deutsch"
      }, {
        lang: "es",
        name: "Español"
      }, {
        lang: "bg",
        name: "Български"
      }, {
        lang: "nl",
        name: "Nederlands"
      }, {
        lang: "ca",
        name: "Català"
      }, {
        lang: "it",
        name: "Italiano"
      }
    ];

    var liRows = [];
    data.forEach(function(country) {
      var key = "lanpe-" + country.lang;
      liRows.push(<LanguagePickerEntry data={country} key={key}/>);
    });

    return (
      <div className="btn-group">
        <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Français
          <span className="caret"></span>
        </button>
        <ul className="dropdown-menu">
          {liRows}
        </ul>
      </div>
    );
  }
});
