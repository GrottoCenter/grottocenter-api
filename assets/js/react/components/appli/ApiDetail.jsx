import React, {Component} from 'react';
import PropTypes from 'prop-types';
//import SwaggerUi, {presets} from 'swagger-ui';
import {Card} from '@material-ui/core/Card';
import { withTheme } from '@material-ui/core/styles';

class ApiDetail extends Component {
  componentDidMount() {
    /*SwaggerUi({
      dom_id: '#swaggerContainer',
      url: `/swagger/apiV1.yaml`,
      presets: [presets.apis],
    });*/
  }

  render() {
    let styleWrap = {
      width: '80%',
      margin: 'auto',
      paddingRight: '40px',
      paddingBottom: '20px'
    };
    return (
      <div style={{color: this.props.theme.palette.textIconColor}}>
        <Card style={styleWrap}>
          <div id="swaggerContainer" />
        </Card>
      </div>
    );
  }
}

ApiDetail.propTypes = {
  theme: PropTypes.object.isRequired
};

export default withTheme()(ApiDetail);
