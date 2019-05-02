import React from 'react';
import fetch from 'isomorphic-fetch';
import { withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';
import { projections } from '../../../conf/ListGPSProj';
import Translate from '../Translate';


//
//
// S T Y L I N G
//
//

const styles = theme => ({
  mainContainer: {
    backgroundColor: theme.palette.primary1Color,
    padding: '10px',
  },
  subContainer: {
    backgroundColor: theme.palette.primary3Color,
    padding: '10px',
    margin: '20px',
  },
  element: {
    margin: '10px',
  },
  button: {
    backgroundColor: 'white',
  },
});

//
//
// M A I N - C O M P O N E N T
//
//

class Convert extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      valueXInput: '',
      valueYInput: '',
      keyGPSInput: 'WGS84',
      keyGPSOutput: 'EPSG2154',
      valueXOutput: '',
      valueYOutput: '',
    };
  }

  handleChangeXValue(event) {
    this.setState({ valueXInput: event.target.value });
  }

  handleChangeYValue(event) {
    this.setState({ valueYInput: event.target.value });
  }

  handleChangeGPSInput(event) {
    this.setState({ keyGPSInput: event.target.value });
  }

  handleChangeGPSOutput(event) {
    this.setState({ keyGPSOutput: event.target.value });
  }

  handleConvert(event) {
    /*
    fetch(`http://twcc.fr/en/ws/?fmt=json&x=${this.state.valueXInput}&y=${this.state.valueYInput}&in=${projections[this.state.keyGPSInput].code}&out=${projections[this.state.keyGPSOutput].code}`, { mode: 'cors' })
      .then(response => response.json())
      .then((responseJson) => {
        this.setState({ valueXOutput: responseJson.point.x, valueYOutput: responseJson.point.y });
        console.log(responseJson);
      })
      .catch((error) => {
        console.error(error);
      });
*/
    fetch(`/api/convert?x=${this.state.valueXInput}&y=${this.state.valueYInput}&in=${projections[this.state.keyGPSInput].code}&out=${projections[this.state.keyGPSOutput].code}`)
      .then(response => response.json())
      .then((responseJson) => {
        console.log(responseJson);
        this.setState({ valueXOutput: responseJson.point.x, valueYOutput: responseJson.point.y });
        console.log(responseJson);
      })
      .catch((error) => {
        console.error(error);
      });
    event.preventDefault();
  }

  render() {
    const {
      classes,
    } = this.props;

    const options = [];
    for (var key in projections) {
      var proj = projections[key];
      var option = <option value={key}> {proj.name} </option>;
      options.push(option);
    }


    return (

      <div id="convert" className={classes.mainContainer}>

        <div id="input" className={classes.subContainer}>
          <h5><b><Translate>Input</Translate></b></h5>
          <div id="selectInput">
            <hr />
            <Translate>Coordinate system</Translate> :
            <select
              value={this.state.keyGPSInput}
              className={classes.element}
              onChange={this.handleChangeGPSInput.bind(this)}
            >
              { options }
            </select>
          </div>

          <div id="xInput">
            {projections[this.state.keyGPSInput].xName} :
            <input type="number" className={classes.element} onChange={this.handleChangeXValue.bind(this)} />
          </div>

          <div id="yInput">
            {projections[this.state.keyGPSInput].yName} :
            <input type="number" className={classes.element} onChange={this.handleChangeYValue.bind(this)} />
          </div>
          <button type="button" className={classes.button} onClick={this.handleConvert.bind(this)}><Translate>Convert</Translate></button>
        </div>
        <div id="output" className={classes.subContainer}>
          <h5><b><Translate>Output</Translate></b></h5>
          <div id="selectOutput">
            <hr />
            <Translate>Coordinate system</Translate> :
            <select
              value={this.state.keyGPSOutput}
              className={classes.element}
              onChange={this.handleChangeGPSOutput.bind(this)}
            >
              { options }
            </select>
          </div>

          <div id="xOutput">
            {projections[this.state.keyGPSOutput].xName} :
            <p>{this.state.valueXOutput}</p>
          </div>

          <div id="yOutput">
            {projections[this.state.keyGPSOutput].yName} :
            <p>{this.state.valueYOutput}</p>
          </div>
        </div>

      </div>

    );
  }
}

Convert.propTypes = {
  classes: PropTypes.shape({}).isRequired,
};

export default withStyles(styles)(Convert);
