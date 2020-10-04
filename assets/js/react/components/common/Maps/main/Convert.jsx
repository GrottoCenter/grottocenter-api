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
import { unitsTab } from '../../../../conf/ListGPSProj';
import Translate from '../../Translate';

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
  static addZone(definition, zone) {
    const tmp = definition.split('+zone=');
    const tmp2 = tmp[1].substring(2);
    const res = `${tmp[0]}+zone=${zone} ${tmp2}`;
    return res;
  }

  static removeSouth(definition) {
    const tmp = definition.split('+south');
    let res = '';
    if (tmp.length > 1) {
      res = tmp[0] + tmp[1];
    } else {
      [res] = tmp;
    }
    return res;
  }

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
      projectionsList: props.list,
    };
  }

  componentDidMount() {
    const { keyGPSInput, keyGPSOutput } = this.state;
    const unitInput = this.getUnits(keyGPSInput);
    const unitOutput = this.getUnits(keyGPSOutput);

    this.setState({ xNameInput: unitsTab[unitInput].xName });
    this.setState({ xUnitInput: unitsTab[unitInput].xUnit });
    this.setState({ yNameInput: unitsTab[unitInput].yName });
    this.setState({ yUnitInput: unitsTab[unitInput].yUnit });
    this.setState({ xNameOutput: unitsTab[unitOutput].xName });
    this.setState({ xUnitOutput: unitsTab[unitOutput].xUnit });
    this.setState({ yNameOutput: unitsTab[unitOutput].yName });
    this.setState({ yUnitOutput: unitsTab[unitOutput].yUnit });
  }

  getDef(keyGps) {
    const { projectionsList } = this.state;
    for (let i = 0; i < projectionsList.length; i += 1) {
      if (projectionsList[i].code === keyGps) {
        return projectionsList[i].definition;
      }
    }
    return null;
  }

  getUnits(keyGps) {
    let units;
    const { projectionsList } = this.state;
    for (let i = 0; i < projectionsList.length; i += 1) {
      if (projectionsList[i].code === keyGps) {
        units = projectionsList[i].units;
        break;
      }
    }
    return units;
  }

  handleStateChange = (stateKey, newValue) => {
    this.setState({ [stateKey]: newValue });
  };

  handleChangeGPSInput = (event) => {
    this.setState({ keyGPSInput: event.target.value });
    this.setState({
      xNameInput: unitsTab[this.getUnits(event.target.value)].xName,
    });
    this.setState({
      xUnitInput: unitsTab[this.getUnits(event.target.value)].xUnit,
    });
    this.setState({
      yNameInput: unitsTab[this.getUnits(event.target.value)].yName,
    });
    this.setState({
      yUnitInput: unitsTab[this.getUnits(event.target.value)].yUnit,
    });
    this.setState({ utmInput: this.isUtm(event.target.value) });
  };

  handleChangeGPSOutput = (event) => {
    this.setState({ keyGPSOutput: event.target.value });
    this.setState({
      xNameOutput: unitsTab[this.getUnits(event.target.value)].xName,
    });
    this.setState({
      xUnitOutput: unitsTab[this.getUnits(event.target.value)].xUnit,
    });
    this.setState({
      yNameOutput: unitsTab[this.getUnits(event.target.value)].yName,
    });
    this.setState({
      yUnitOutput: unitsTab[this.getUnits(event.target.value)].yUnit,
    });
    this.setState({ utmOutput: this.isUtm(event.target.value) });
  };

  handleConvert = (event) => {
    const {
      keyGPSInput,
      keyGPSOutput,
      valueXInput,
      valueYInput,
      utmInput,
      zoneInput,
      zoneOutput,
      hemiInput,
      hemiOutput,
      utmOutput,
    } = this.state;
    let firstProjection = this.getDef(keyGPSInput);
    let secondProjection = this.getDef(keyGPSOutput);
    let xValue = valueXInput;
    let yValue = valueYInput;
    if (this.getUnits(keyGPSInput) === 'degrees') {
      xValue = valueYInput;
      yValue = valueXInput;
    }

    if (utmInput) {
      firstProjection = this.addZone(firstProjection, zoneInput);
      firstProjection = this.removeSouth(firstProjection);
      if (hemiInput === 'South') {
        firstProjection += ' +south';
      }
    }

    if (utmOutput) {
      secondProjection = this.addZone(secondProjection, zoneOutput);
      secondProjection = this.removeSouth(secondProjection);
      if (hemiOutput === 'South') {
        secondProjection += ' +south';
      }
    }

    const tmp = proj4(firstProjection, secondProjection, [
      parseInt(xValue, 10),
      parseInt(yValue, 10),
    ]);

    if (this.getUnits(keyGPSOutput) === 'degrees') {
      this.setState({ valueXOutput: tmp[1], valueYOutput: tmp[0] });
    } else {
      this.setState({ valueXOutput: tmp[0], valueYOutput: tmp[1] });
    }

    event.preventDefault();
  };

  isUtm(keyGps) {
    const { projectionsList } = this.state;
    for (let i = 0; i < projectionsList.length; i += 1) {
      if (projectionsList[i].code === keyGps) {
        return projectionsList[i].proj === 'utm';
      }
    }
    return null;
  }

  render() {
    const { classes } = this.props;
    const {
      hemiInput,
      hemiOutput,
      keyGPSInput,
      keyGPSOutput,
      projectionsList,
      utmInput,
      utmOutput,
      valueXOutput,
      valueYOutput,
      xNameInput,
      xNameOutput,
      yNameInput,
      yNameOutput,
      xUnitInput,
      xUnitOutput,
      yUnitInput,
      yUnitOutput,
    } = this.state;
    // Recover all the coodinates system for options select
    const options = [];
    let actualCountry = 'World';
    options.push(<MenuItemGroup disabled>World</MenuItemGroup>);

    projectionsList.forEach((projection) => {
      if (projection.fr_name && actualCountry !== projection.fr_name) {
        actualCountry = projection.fr_name;
        options.push(
          <MenuItemGroup key={projection.code} disabled>
            {actualCountry}
          </MenuItemGroup>,
        );
      } else {
        options.push(
          <StyledMenuItem key={projection.code} value={projection.code}>
            {projection.title}
          </StyledMenuItem>,
        );
      }
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
                value={keyGPSInput}
                onChange={this.handleChangeGPSInput}
              >
                {options}
              </StyledSelect>
            </FormControl>
          </div>

          {/* UTM SECTION HEMISPHERE AND ZONE INPUT */}
          {utmInput && [
            <div id="hemisphereInput" className={classes.element}>
              <div className={classes.subElement}>{' Hemisphere : '}</div>
              <FormControl>
                <StyledSelect
                  value={hemiInput}
                  onChange={(event) =>
                    this.handleStateChange('hemiInput', event.target.value)
                  }
                >
                  <StyledMenuItem value="North">North</StyledMenuItem>
                  <StyledMenuItem value="South">South</StyledMenuItem>
                </StyledSelect>
              </FormControl>
            </div>,
            <div id="zoneInput">
              {' Zone : '}
              <StyledInput
                type="number"
                placeholder="0"
                onChange={(event) =>
                  this.handleStateChange('zoneInput', event.target.value)
                }
              />
            </div>,
          ]}

          {/* COORDINATES INPUT SECTION */}
          <div id="xInput">
            {xNameInput}
            {' : '}
            <StyledInput
              type="number"
              placeholder="0"
              onChange={(event) =>
                this.handleStateChange('valueXInput', event.target.value)
              }
            />
            {xUnitInput}
          </div>

          <div id="yInput">
            {yNameInput}
            {' : '}
            <StyledInput
              type="number"
              placeholder="0"
              style={{ marginLeft: '5px' }}
              onChange={(event) =>
                this.handleStateChange('valueYInput', event.target.value)
              }
            />
            {yUnitInput}
          </div>

          {/* BUTTON SECTION */}
          <ConvertButton onClick={this.handleConvert}>
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
                value={keyGPSOutput}
                onChange={this.handleChangeGPSOutput}
              >
                {options}
              </StyledSelect>
            </FormControl>
          </div>

          {/* UTM SECTION HEMISPHERE AND ZONE OUTPUT */}
          {utmOutput && [
            <div id="hemisphereOutput" className={classes.element}>
              <div className={classes.subElement}>{' Hemisphere : '}</div>
              <FormControl>
                <StyledSelect
                  value={hemiOutput}
                  onChange={(event) =>
                    this.handleStateChange('hemiOutput', event.target.value)
                  }
                >
                  <StyledMenuItem value="North">North</StyledMenuItem>
                  <StyledMenuItem value="South">South</StyledMenuItem>
                </StyledSelect>
              </FormControl>
            </div>,
            <div id="zoneOutput">
              {' Zone : '}
              <StyledInput
                type="number"
                placeholder="0"
                onChange={(event) =>
                  this.handleStateChange('zoneOutput', event.target.value)
                }
              />
            </div>,
          ]}

          {/* COORDINATES OUTPUT SECTION */}
          <div id="xOutput">
            {xNameOutput}
            {' : '}
            <StyledInput type="number" value={valueXOutput} disabled />
            {xUnitOutput}
          </div>

          <div id="yOutput">
            {yNameOutput}
            {' : '}
            <StyledInput
              type="number"
              value={valueYOutput}
              style={{ marginLeft: '2px' }}
              disabled
            />
            {yUnitOutput}
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div id="bottom" className={classes.bottomContainer}>
          <span>
            Basé sur la librairie <a href="http://proj4js.org">Proj4js</a> et
            sur le projet <a href="http://trac.osgeo.org/proj">Proj.4</a>,{' '}
            <br />
            ce convertisseur utilise les constantes de conversion de{' '}
            <a href="http://spatialreference.org">Spatial Reference</a>.
          </span>
        </div>
      </div>
    );
  }
}

Convert.propTypes = {
  classes: PropTypes.shape({
    bottomContainer: PropTypes.any,
    element: PropTypes.any,
    mainContainer: PropTypes.any,
    subContainer: PropTypes.any,
    subElement: PropTypes.any,
  }).isRequired,
  list: PropTypes.arrayOf(PropTypes.any).isRequired,
};

export default withStyles(styles)(Convert);
