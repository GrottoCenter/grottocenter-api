/**
 * I18N helper
 * This component requests I18N API in order to get the
 */
import React from 'react';

export default class I18n extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
          text: ""
      };
      this.fetchData({});
  }

  fetchData(filters) {
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
  }

  render() {
    return (
      <span className="translated">{this.state.text}</span>
    );
  }
}
