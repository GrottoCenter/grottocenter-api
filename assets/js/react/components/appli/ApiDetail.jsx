import React, {PropTypes, Component} from 'react';
import SwaggerUi, {presets} from 'swagger-ui';
import {Card} from 'material-ui/Card';
import muiThemeable from 'material-ui/styles/muiThemeable';

class ApiDetail extends Component {
  componentDidMount() {
    SwaggerUi({
      dom_id: '#swaggerContainer',
      url: `/swagger/apiV1.yaml`,
      presets: [presets.apis],
    });
  }

  render() {
    let styleWrap = {
      width: '80%',
      margin: 'auto',
      paddingRight: '40px',
      paddingBottom: '20px'
    };
    return (
      <div style={{color: this.props.muiTheme.palette.textIconColor}}>
        <Card style={styleWrap}>
          <div id="swaggerContainer" />
        </Card>
      </div>
    );
  }
}

ApiDetail.propTypes = {
  muiTheme: PropTypes.object.isRequired
};

export default muiThemeable()(ApiDetail);
