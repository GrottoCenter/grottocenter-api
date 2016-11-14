/**
 * TODO Add comment
 */
 
var I18n = React.createClass({
  displayName: 'I18n helper',

  getInitialState: function() {
    return {text: ""};
  },

  componentWillMount: function() {
    this.fetchData({});
  },

  fetchData: function(filters) {
    var _this = this;

    $.ajax({
      url: "/csrfToken",
      dataType: 'json',
      success: function(data) {
        // TODO Replace by ajax call
        $.post("/i18n/translate", {
          label: this.props.label,
          _csrf: data._csrf
        }, function(data) {
          _this.setState({text: data});
        });
      }.bind(this)
    });

  },

  render: function() {
    return (
      <span className="translated">{this.state.text}</span>
    );
  }
});
