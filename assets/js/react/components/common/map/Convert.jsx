import React from 'react';
import { withStyles, withTheme } from '@material-ui/core';
import PropTypes from 'prop-types';
import proj4 from 'proj4';
import Button from '@material-ui/core/Button';
import styled from 'styled-components';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Divider from '@material-ui/core/Divider';
import { unitsTab } from '../../../conf/ListGPSProj';
import Translate from '../Translate';

//
//
// S T Y L I N G
//
//

const styles = (theme) => ({
  mainContainer: {
    backgroundColor: theme.palette.primary1Color,
    padding: '10px',
  },
  subContainer: {
    backgroundColor: theme.palette.primary3Color,
    padding: '10px',
    margin: '20px',
    textAlign: 'center',
  },
  bottomContainer: {
    padding: '10px',
    margin: '20px',
    textAlign: 'center',
  },
  element: {
    display: 'table',
  },
  subElement: {
    display: 'table-cell',
    verticalAlign: 'middle',
  },
});

// For input of coordinates
const StyledInput = withTheme(styled(Input)`
  && {
    background: ${(props) => props.theme.palette.backgroundButton};
    border: 1px solid;
    border-color: ${(props) => props.theme.palette.borderColor};
    padding: 7px;
    margin: 10px;
    font-size: small;
  }
`);

// For the select of coodinates system
const StyledSelect = withTheme(styled(Select)`
  && {
    background: ${(props) => props.theme.palette.backgroundButton};
    border: 1px solid;
    border-color: ${(props) => props.theme.palette.borderColor};
    padding: 7px;
    margin: 10px;
  }
`);

const MenuItemGroup = withTheme(styled(MenuItem)`
  && {
    font-size: larger;
    font-weight: bold;
  }
`);

const StyledMenuItem = withTheme(styled(MenuItem)`
  && {
    font-size: small;
    padding: 0 30px;
  }
`);

//
const ConvertButton = withTheme(styled(Button)`
  && {
  background: ${(props) => props.theme.palette.backgroundButton};
  border: 1px solid;
  border-color: ${(props) => props.theme.palette.borderColor};
  border-radius: 4px;
  padding: 0 20px;
  },
  &&:hover {
    background: ${(props) => props.theme.palette.backgroundButton};
  },
`);

const StyledDivider = withTheme(styled(Divider)`
  && {
    background: ${(props) => props.theme.palette.divider};
    margin-bottom: 10px;
  }
`);

const StyledTitle = styled.h5`
  font-weight: bold;
`;

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
      utmInput: false,
      utmOutput: false,
      hemiInput: 'North',
      hemiOutput: 'North',
      zoneInput: 31,
      zoneOuptut: 31,
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

  isUtm(keyGps) {
    for (let i = 0; i < this.state.projectionsList.length; i++) {
      if (this.state.projectionsList[i].Code == keyGps) {
        return this.state.projectionsList[i].proj == 'utm';
      }
    }
    return null;
  }

  getDef(keyGps) {
    for (let i = 0; i < this.state.projectionsList.length; i++) {
      if (this.state.projectionsList[i].Code == keyGps) {
        return this.state.projectionsList[i].Definition;
      }
    }
    return null;
  }

  getUnits(keyGps) {
    for (let i = 0; i < this.state.projectionsList.length; i++) {
      if (this.state.projectionsList[i].Code == keyGps) {
        return this.state.projectionsList[i].units;
      }
    }
  }

  addZone(definition, zone) {
    var tmp = definition.split('+zone=');
    var tmp2 = tmp[1].substring(2);
    var res = tmp[0] + '+zone=' + zone + ' ' + tmp2;
    return res;
  }

  removeSouth(definition) {
    var tmp = definition.split('+south');
    var res = '';
    if (tmp.length > 1) {
      res = tmp[0] + tmp[1];
    } else {
      res = tmp[0];
    }
    return res;
  }

  handleChangeXValue(event) {
    this.setState({ valueXInput: event.target.value });
  }

  handleChangeYValue(event) {
    this.setState({ valueYInput: event.target.value });
  }

  handleChangeHemiInput(event) {
    this.setState({ hemiInput: event.target.value });
  }

  handleChangeHemiOutput(event) {
    this.setState({ hemiOutput: event.target.value });
  }

  handleChangeZoneInput(event) {
    this.setState({ zoneInput: event.target.value });
  }

  handleChangeZoneOutput(event) {
    this.setState({ zoneOutput: event.target.value });
  }

  handleChangeGPSInput(event) {
    this.setState({ keyGPSInput: event.target.value });
    this.setState({ xNameInput: unitsTab[this.getUnits(event.target.value)].xName });
    this.setState({ xUnitInput: unitsTab[this.getUnits(event.target.value)].xUnit });
    this.setState({ yNameInput: unitsTab[this.getUnits(event.target.value)].yName });
    this.setState({ yUnitInput: unitsTab[this.getUnits(event.target.value)].yUnit });
    this.setState({ utmInput: this.isUtm(event.target.value) });
  }

  handleChangeGPSOutput(event) {
    this.setState({ keyGPSOutput: event.target.value });
    this.setState({ xNameOutput: unitsTab[this.getUnits(event.target.value)].xName });
    this.setState({ xUnitOutput: unitsTab[this.getUnits(event.target.value)].xUnit });
    this.setState({ yNameOutput: unitsTab[this.getUnits(event.target.value)].yName });
    this.setState({ yUnitOutput: unitsTab[this.getUnits(event.target.value)].yUnit });
    this.setState({ utmOutput: this.isUtm(event.target.value) });
  }

  handleConvert(event) {
    var firstProjection = this.getDef(this.state.keyGPSInput);
    var secondProjection = this.getDef(this.state.keyGPSOutput);
    let xValue = this.state.valueXInput;
    let yValue = this.state.valueYInput;
    if (this.getUnits(this.state.keyGPSInput) == 'degrees') {
      xValue = this.state.valueYInput;
      yValue = this.state.valueXInput;
    }

    if (this.state.utmInput) {
      firstProjection = this.addZone(firstProjection, this.state.zoneInput);
      firstProjection = this.removeSouth(firstProjection);
      if (this.state.hemiInput == 'South') {
        firstProjection += ' +south';
      }
    }

    if (this.state.utmOutput) {
      secondProjection = this.addZone(secondProjection, this.state.zoneOutput);
      secondProjection = this.removeSouth(secondProjection);
      if (this.state.hemiOutput == 'South') {
        secondProjection += ' +south';
      }
    }

    console.log('first : ' + firstProjection);
    console.log('second : ' + secondProjection);
    const tmp = proj4(firstProjection, secondProjection, [
      parseInt(xValue, 10),
      parseInt(yValue, 10),
    ]);

    if (this.getUnits(this.state.keyGPSOutput) == 'degrees') {
      this.setState({ valueXOutput: tmp[1], valueYOutput: tmp[0] });
    } else {
      this.setState({ valueXOutput: tmp[0], valueYOutput: tmp[1] });
    }

    event.preventDefault();
  }

  render() {
    const { classes } = this.props;

    // Recover all the coodinates system for options select
    const options = [];
    let actualCountry = 'World';
    options.push(<MenuItemGroup disabled>World</MenuItemGroup>);

    this.state.projectionsList.forEach((projection) => {
      if (projection.Fr_name && actualCountry !== projection.Fr_name) {
        actualCountry = projection.Fr_name;
        options.push(<MenuItemGroup disabled>{actualCountry}</MenuItemGroup>);
      }
      options.push(<StyledMenuItem value={projection.Code}> {projection.title} </StyledMenuItem>);
    });

    return (
      <div id="convert" className={classes.mainContainer}>
        {/* INPUT SECTION */}
        <div id="input" className={classes.subContainer}>
          <StyledTitle>
            <Translate>Input</Translate>
          </StyledTitle>
          <StyledDivider />

          {/* COORDINATES SYSTEMS SECTION */}
          <div id="selectInput" className={classes.element}>
            <div className={classes.subElement}>
              <Translate>Coordinate system</Translate>
              {' : '}
            </div>
            <FormControl>
              <StyledSelect
                value={this.state.keyGPSInput}
                onChange={this.handleChangeGPSInput.bind(this)}
              >
                {options}
              </StyledSelect>
            </FormControl>
          </div>

          {/* UTM SECTION HEMISPHERE AND ZONE INPUT */}
          {this.state.utmInput && [
            <div id="hemisphereInput" className={classes.element}>
              <div className={classes.subElement}>{' Hemisphere : '}</div>
              <FormControl>
                <StyledSelect
                  value={this.state.hemiInput}
                  onChange={this.handleChangeHemiInput.bind(this)}
                >
                  <StyledMenuItem value="North">{'North'}</StyledMenuItem>
                  <StyledMenuItem value="South">{'South'}</StyledMenuItem>
                </StyledSelect>
              </FormControl>
            </div>,
            <div id="zoneInput">
              {' Zone : '}
              <StyledInput
                type="number"
                placeholder="0"
                onChange={this.handleChangeZoneInput.bind(this)}
              />
            </div>,
          ]}

          {/* COORDINATES INPUT SECTION */}
          <div id="xInput">
            {this.state.xNameInput}
            {' : '}
            <StyledInput
              type="number"
              placeholder="0"
              onChange={this.handleChangeXValue.bind(this)}
            />
            {this.state.xUnitInput}
          </div>

          <div id="yInput">
            {this.state.yNameInput}
            {' : '}
            <StyledInput
              type="number"
              placeholder="0"
              style={{ marginLeft: '5px' }}
              onChange={this.handleChangeYValue.bind(this)}
            />
            {this.state.yUnitInput}
          </div>

          {/* BUTTON SECTION */}
          <ConvertButton onClick={this.handleConvert.bind(this)}>
            <Translate>Convert</Translate>
          </ConvertButton>
        </div>

        {/* OUTPUT SECTION */}
        <div id="output" className={classes.subContainer}>
          <StyledTitle>
            <Translate>Output</Translate>
          </StyledTitle>
          <StyledDivider />

          {/* COORDINATES SYSTEMS SECTION */}
          <div id="selectOutput" className={classes.element}>
            <div className={classes.subElement}>
              <Translate>Coordinate system</Translate>
              {' : '}
            </div>
            <FormControl>
              <StyledSelect
                value={this.state.keyGPSOutput}
                onChange={this.handleChangeGPSOutput.bind(this)}
              >
                {options}
              </StyledSelect>
            </FormControl>
          </div>

          {/* UTM SECTION HEMISPHERE AND ZONE OUTPUT */}
          {this.state.utmOutput && [
            <div id="hemisphereOutput" className={classes.element}>
              <div className={classes.subElement}>{' Hemisphere : '}</div>
              <FormControl>
                <StyledSelect
                  value={this.state.hemiOutput}
                  onChange={this.handleChangeHemiOutput.bind(this)}
                >
                  <StyledMenuItem value="North">{'North'}</StyledMenuItem>
                  <StyledMenuItem value="South">{'South'}</StyledMenuItem>
                </StyledSelect>
              </FormControl>
            </div>,
            <div id="zoneOutput">
              {' Zone : '}
              <StyledInput
                type="number"
                placeholder="0"
                onChange={this.handleChangeZoneOutput.bind(this)}
              />
            </div>,
          ]}

          {/* COORDINATES OUTPUT SECTION */}
          <div id="xOutput">
            {this.state.xNameOutput}
            {' : '}
            <StyledInput type="number" value={this.state.valueXOutput} disabled />
            {this.state.xUnitOutput}
          </div>

          <div id="yOutput">
            {this.state.yNameOutput}
            {' : '}
            <StyledInput
              type="number"
              value={this.state.valueYOutput}
              style={{ marginLeft: '2px' }}
              disabled
            />
            {this.state.yUnitOutput}
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div id="bottom" className={classes.bottomContainer}>
          <span>
            Basé sur la librairie <a href="http://proj4js.org">Proj4js</a> et sur le projet{' '}
            <a href="http://trac.osgeo.org/proj">Proj.4</a>, <br />
            ce convertisseur utilise les constantes de conversion de{' '}
            <a href="http://spatialreference.org">Spatial Reference</a>.
          </span>
        </div>
      </div>
    );
  }
}

Convert.propTypes = {
  classes: PropTypes.shape({}).isRequired,
};

export default withStyles(styles)(Convert);
