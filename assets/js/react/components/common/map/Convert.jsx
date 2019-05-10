import React from 'react';
import { withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';
import proj4 from 'proj4';
import ReactHtmlParser from 'react-html-parser';
import { unitsTab } from '../../../conf/ListGPSProj';
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
      keyGPSOutput: 'WGS84',
      xNameInput: '',
      xUnitInput: '',
      yNameInput: '',
      yUnitInput: '',
      xNameOutput: '',
      xUnitOutput: '',
      yNameOutput: '',
      yUnitOutput: '',
      valueXOutput: '',
      valueYOutput: '',
      projectionsList: props.list,
    };
  }

  componentDidMount() {
    const unitInput = this.getUnits(this.state.keyGPSInput);
    const unitOutput = this.getUnits(this.state.keyGPSOutput);

    this.setState({ xNameInput: unitsTab[unitInput].xName });
    this.setState({ xUnitInput: unitsTab[unitInput].xUnit });
    this.setState({ yNameInput: unitsTab[unitInput].yName });
    this.setState({ yUnitInput: unitsTab[unitInput].yUnit });
    this.setState({ xNameOutput: unitsTab[unitOutput].xName });
    this.setState({ xUnitOutput: unitsTab[unitOutput].xUnit });
    this.setState({ yNameOutput: unitsTab[unitOutput].yName });
    this.setState({ yUnitOutput: unitsTab[unitOutput].yUnit });
  }

  getProj(keyGps) {
    for (let i = 0; i < this.state.projectionsList.length; i++) {
      if (this.state.projectionsList[i].Code == (keyGps)) {
        return this.state.projectionsList[i].Definition;
      }
    }
    return null;
  }

  getTitle(keyGps) {
    for (let i = 0; i < this.state.projectionsList.length; i++) {
      if (this.state.projectionsList[i].Code == (keyGps)) {
        return this.state.projectionsList[i].title;
      }
    }
  }

  getUnits(keyGps) {
    for (let i = 0; i < this.state.projectionsList.length; i++) {
      if (this.state.projectionsList[i].Code == (keyGps)) {
        return this.state.projectionsList[i].units;
      }
    }
  }

  handleChangeXValue(event) {
    this.setState({ valueXInput: event.target.value });
  }

  handleChangeYValue(event) {
    this.setState({ valueYInput: event.target.value });
  }

  handleChangeGPSInput(event) {
    this.setState({ keyGPSInput: event.target.value });
    this.setState({ xNameInput: unitsTab[this.getUnits(event.target.value)].xName });
    this.setState({ xUnitInput: unitsTab[this.getUnits(event.target.value)].xUnit });
    this.setState({ yNameInput: unitsTab[this.getUnits(event.target.value)].yName });
    this.setState({ yUnitInput: unitsTab[this.getUnits(event.target.value)].yUnit });
  }

  handleChangeGPSOutput(event) {
    this.setState({ keyGPSOutput: event.target.value });
    this.setState({ xNameOutput: unitsTab[this.getUnits(event.target.value)].xName });
    this.setState({ xUnitOutput: unitsTab[this.getUnits(event.target.value)].xUnit });
    this.setState({ yNameOutput: unitsTab[this.getUnits(event.target.value)].yName });
    this.setState({ yUnitOutput: unitsTab[this.getUnits(event.target.value)].yUnit });
  }


  handleConvert(event) {
    const firstProjection = this.getProj(this.state.keyGPSInput);
    const secondProjection = this.getProj(this.state.keyGPSOutput);
    var xValue = this.state.valueXInput;
    var yValue = this.state.valueYInput;
    if (this.getUnits(this.state.keyGPSInput) == "degrees") {
      console.log("ok");
      xValue = this.state.valueYInput;
      yValue = this.state.valueXInput;
    }
    const tmp = proj4(firstProjection, secondProjection, [parseInt(xValue, 10), parseInt(yValue, 10)]);

    if (this.getUnits(this.state.keyGPSOutput) == "degrees") {
      console.log("ok");
      this.setState({ valueXOutput: tmp[1], valueYOutput: tmp[0] });
    } else {
      this.setState({valueXOutput: tmp[0], valueYOutput: tmp[1]});
    }

    event.preventDefault();
  }

  render() {
    const {
      classes,
    } = this.props;

    const options = [];

    var actualCountry = "World";

    options.push(ReactHtmlParser('<optgroup label = "World">'));

    for (let i = 0; i < this.state.projectionsList.length; i++) {

      if (this.state.projectionsList[i].Fr_name && actualCountry != this.state.projectionsList[i].Fr_name) {
        actualCountry = this.state.projectionsList[i].Fr_name;
        options.push(ReactHtmlParser('</optgroup>'));
        options.push(ReactHtmlParser(`<optgroup label = ${actualCountry}>`));
      }

      const option = (
      <option value={this.state.projectionsList[i].Code}>
      {' '}
      {this.state.projectionsList[i].title}
      {' '}
      </option>
      );
      options.push(option);
    }


    options.push(ReactHtmlParser('</optgroup>'));


    return (

      <div id="convert" className={classes.mainContainer}>

        <div id="input" className={classes.subContainer}>
          <h5><b><Translate>Input</Translate></b></h5>
          <div id="selectInput">
            <hr />
            <Translate>Coordinate system</Translate>
            {' '}
:
            <select
              value={this.state.keyGPSInput}
              className={classes.element}
              onChange={this.handleChangeGPSInput.bind(this)}
            >
              {
                options
              }
            </select>


          </div>

          <div id="xInput">
            {this.state.xNameInput}
            {' '}
:
            <input type="number" className={classes.element} onChange={this.handleChangeXValue.bind(this)} />
            {this.state.xUnitInput}
          </div>

          <div id="yInput">
            {this.state.yNameInput}
            {' '}
:
            <input type="number" className={classes.element} onChange={this.handleChangeYValue.bind(this)} />
            {this.state.yUnitInput}
          </div>
          <button type="button" className={classes.button} onClick={this.handleConvert.bind(this)}><Translate>Convert</Translate></button>
        </div>
        <div id="output" className={classes.subContainer}>
          <h5><b><Translate>Output</Translate></b></h5>
          <div id="selectOutput">
            <hr />
            <Translate>Coordinate system</Translate>
            {' '}
:
            <select
              value={this.state.keyGPSOutput}
              className={classes.element}
              onChange={this.handleChangeGPSOutput.bind(this)}
            >
              { options }
            </select>
          </div>


          <div id="xOutput">


              {this.state.xNameOutput} :
              <input type="number" className={classes.element} value={this.state.valueXOutput} disabled />
              {this.state.xUnitOutput}

          </div>

          <div id="yOutput">


              {this.state.yNameOutput} :
              <input type="number" className={classes.element} value={this.state.valueYOutput} disabled />
              {this.state.yUnitOutput}

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
