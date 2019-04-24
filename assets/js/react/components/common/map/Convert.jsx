import React from 'react';
import fetch from 'isomorphic-fetch';
import { projections } from '../../../conf/ListGPSProj';


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

    fetch(`http://twcc.fr/en/ws/?fmt=json&x=${this.state.valueXInput}&y=${this.state.valueYInput}&in=${projections[this.state.keyGPSInput].code}&out=${projections[this.state.keyGPSOutput].code}`, { mode: 'cors' })
      .then(response => response.json())
      .then((responseJson) => {
        this.setState({ valueXOutput: responseJson.point.x, valueYOutput: responseJson.point.y });
        console.log(responseJson);
      })
      .catch((error) => {
        console.error(error);
      });

    event.preventDefault();
  }

  render() {
    const options = [];
    for (var key in projections) {
      var proj = projections[key];
      var option = <option value={key}> {proj.name} </option>;
      options.push(option);
    }


    return (

      <div id="convert">

        <div id="input">

          <div id="selectInput">
            <select
              value={this.state.keyGPSInput}
              onChange={this.handleChangeGPSInput.bind(this)}
            >
              { options }
            </select>
          </div>

          <div id="xInput">
            {projections[this.state.keyGPSInput].xName} :
            <input type="number" onChange={this.handleChangeXValue.bind(this)} />
          </div>

          <div id="yInput">
            {projections[this.state.keyGPSInput].yName} :
            <input type="number" onChange={this.handleChangeYValue.bind(this)} />
          </div>

        </div>

        <button type="button" onClick={this.handleConvert.bind(this)}>Convertir</button>

        <div id="output">

          <div id="selectOutput">
            <select
              value={this.state.keyGPSOutput}
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

export default Convert;
