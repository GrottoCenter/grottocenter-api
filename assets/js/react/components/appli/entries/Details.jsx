import React from 'react';
import PropTypes from 'prop-types';
//import 'typeface-roboto';
import Mark from './Mark';

import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardText from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Collapse from '@material-ui/core/Collapse';
import styled from 'styled-components';
import {
  GridContainer,
  GridRow,
  GridOneThirdColumn,
  GridTwoThirdColumn,
  GridFullColumn,
} from '../../../helpers/GridSystem';
import Translate from '../../common/Translate';
import { withStyles } from '@material-ui/core/styles';
import {
  Share,
  Print,
  GpsFixed,
  Map,
  Create,
  Room,
  LocationCity,
  ShowChart,
  LinearScale,
} from '@material-ui/icons/';
import Typography from '@material-ui/core/Typography/Typography';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import ActionBar from './ActionBar';

/*const useStyles = makeStyles(theme => ({
  button: {
    margin: theme.spacing(1),
  },
}));*/

const EntriesContainer = styled(GridContainer)`
  max-width: initial;

  .row {
    margin-bottom: 5%;
  }

  @media (min-width: 550px) {
    width: 95%;
  }

  @media (min-width: 1000px) {
    .row {
      margin-bottom: 2%;
    }
  }
`;

const WarningCardText = styled(CardText)`
  background-color: red;
  color: white !important;
`;

const OverFlowCardText = styled(CardText)`
  overflow-x: auto;
`;

const StyledCardHeader = withStyles({
  title: {
    color: '#056598 !important',
    fontSize: '18px !important',
    fontWeight: 'bold !important',
  },
})(CardHeader);

const BoldText = withStyles(
  (theme) => ({
    root: {
      fontSize: '14px',
      color: '#795548',
      fontWeight: 'bold',
      display: 'block',
      marginTop: '-5px',
    },
  }),
  { withTheme: true },
)(Typography);

const DetailContainer = withStyles(
  (theme) => ({
    root: {
      marginLeft: '15px',
      display: 'inline-block',
      maxWidth: '80%',
    },
  }),
  { withTheme: true },
)(Typography);

const Content = withStyles(
  (theme) => ({
    root: {
      fontSize: '14px',
      color: '#333',
      display: 'block',
    },
  }),
  { withTheme: true },
)(Typography);

const Contributor = withStyles(
  (theme) => ({
    root: {
      fontSize: '12px',
      color: '#555',
      display: 'block',
      textAlign: 'right',
      marginLeft: 'auto !important',
      marginRight: '10px !important',
    },
  }),
  { withTheme: true },
)(Typography);

const Title = withStyles(
  (theme) => ({
    root: {
      fontSize: '20px',
      color: '#056598',
      paddingLeft: '4px',
      fontWeight: 'bold',
      marginBottom: '10px',
    },
  }),
  { withTheme: true },
)(Typography);

const StyledTableCell = withStyles(
  (theme) => ({
    root: {
      fontSize: '14px !important',
    },
  }),
  { withTheme: true },
)(TableCell);

class Details extends React.Component {
  state = {
    block1: false,
    block2: false,
    block3: false,
    block4: false,
    block5: false,
    block6: false,
    block7: false,
  };

  componentDidMount() {
    const entryId = this.props.match.params.id;
    // TODO Get entry details using REST
  }

  render() {
    const title = this.props.match.params.id;
    // https://wiki.grottocenter.org/wiki/Fr/0006077

    return (
      <EntriesContainer>
        <Title component="span">{title}</Title>
        <ActionBar />
        <GridRow>
          <GridFullColumn>
            <Card>
              <WarningCardText>Texte qui apparaît si la cavité est sensible</WarningCardText>
            </Card>
          </GridFullColumn>
        </GridRow>
        <GridRow>
          <GridTwoThirdColumn>
            <Card>
              <CardText>MAP</CardText>
            </Card>
          </GridTwoThirdColumn>
          <GridOneThirdColumn>
            <Card>
              <StyledCardHeader title={<Translate id="Cave properties" />} />
              <CardText>
                <div style={{ marginBottom: '35px' }}>
                  <LocationCity style={{ color: '#795548' }} />
                  <DetailContainer>
                    <BoldText component="span">Nom:</BoldText>
                    <Content>I'm a name</Content>
                  </DetailContainer>
                </div>
                <div style={{ marginBottom: '35px' }}>
                  <Room style={{ color: '#795548' }} />
                  <DetailContainer>
                    <BoldText component="span">Localisation:</BoldText>
                    <Content>I'm a location</Content>
                  </DetailContainer>
                </div>

                <div style={{ marginBottom: '35px' }}>
                  <ShowChart style={{ color: '#795548' }} />
                  <DetailContainer>
                    <BoldText component="span">Denivellation:</BoldText>
                    <Content>I'm a value</Content>
                  </DetailContainer>
                </div>

                <div style={{ marginBottom: '35px' }}>
                  <LinearScale style={{ color: '#795548' }} />
                  <DetailContainer>
                    <BoldText component="span">Developpement:</BoldText>
                    <Content>I'm a value</Content>
                  </DetailContainer>
                </div>
                <div>
                  <Mark name={'Interet'} mark={3} />
                  <Mark name={'Progression'} mark={3} />
                  <Mark name={'Accès'} mark={3} />
                </div>
              </CardText>
              <CardActions>
                <Contributor>
                  Créé par XXXX le YYYYYYYYYYYY
                  <br />
                  Modifié par XXXXX le YYYYYYYYYYYY
                </Contributor>
              </CardActions>
            </Card>
          </GridOneThirdColumn>
        </GridRow>
        <GridRow>
          <GridFullColumn>
            <Card>
              <StyledCardHeader
                title={<Translate id="Localisation" />}
                className={'title'}
                onClick={() => this.setState((state) => ({ block1: !state.block1 }))}
              />

              <Collapse in={this.state.block1} timeout="auto" unmountOnExit>
                <CardText>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec mattis pretium
                  massa. Aliquam erat volutpat. Nulla facilisi. Donec vulputate interdum
                  sollicitudin. Nunc lacinia auctor quam sed pellentesque. Aliquam dui mauris,
                  mattis quis lacus id, pellentesque lobortis odio.
                </CardText>
                <CardActions>
                  <Contributor>
                    Créé par XXXX <br />
                    Modifié par XXXXX
                  </Contributor>
                </CardActions>
              </Collapse>
            </Card>
          </GridFullColumn>
        </GridRow>
        <GridRow>
          <GridFullColumn>
            <Card>
              <StyledCardHeader
                title={<Translate id="Description" />}
                onClick={() => this.setState((state) => ({ block2: !state.block2 }))}
              />
              <Collapse in={this.state.block2} timeout="auto" unmountOnExit>
                <CardText>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec mattis pretium
                  massa. Aliquam erat volutpat. Nulla facilisi. Donec vulputate interdum
                  sollicitudin. Nunc lacinia auctor quam sed pellentesque. Aliquam dui mauris,
                  mattis quis lacus id, pellentesque lobortis odio.
                </CardText>
                <CardActions>
                  <Contributor>
                    Créé par XXXX <br />
                    Modifié par XXXXX
                  </Contributor>
                </CardActions>
              </Collapse>
            </Card>
          </GridFullColumn>
        </GridRow>
        <GridRow>
          <GridFullColumn>
            <Card>
              <StyledCardHeader
                title={<Translate id="Topographie" />}
                onClick={() => this.setState((state) => ({ block3: !state.block3 }))}
              />

              <Collapse in={this.state.block3} timeout="auto" unmountOnExit>
                <CardText>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec mattis pretium
                  massa. Aliquam erat volutpat. Nulla facilisi. Donec vulputate interdum
                  sollicitudin. Nunc lacinia auctor quam sed pellentesque. Aliquam dui mauris,
                  mattis quis lacus id, pellentesque lobortis odio.
                </CardText>
                <CardActions>
                  <Contributor>
                    Créé par XXXX <br />
                    Modifié par XXXXX
                  </Contributor>
                </CardActions>
              </Collapse>
            </Card>
          </GridFullColumn>
        </GridRow>
        <GridRow>
          <GridFullColumn>
            <Card>
              <StyledCardHeader
                title={<Translate id="Fiche équipement" />}
                onClick={() => this.setState((state) => ({ block4: !state.block4 }))}
              />

              <Collapse in={this.state.block4} timeout="auto" unmountOnExit>
                <OverFlowCardText>
                  <Table aria-label="simple table">
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Obstacles</StyledTableCell>
                        <StyledTableCell align="right">Cordes</StyledTableCell>
                        <StyledTableCell align="right">Amarrages</StyledTableCell>
                        <StyledTableCell>Observations</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <StyledTableCell component="th" scope="row">
                          Bonjour
                        </StyledTableCell>
                        <StyledTableCell align="right">Test</StyledTableCell>
                        <StyledTableCell align="right">test</StyledTableCell>
                        <StyledTableCell>test</StyledTableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </OverFlowCardText>
                <CardActions>
                  <Contributor>
                    Créé par XXXX <br />
                    Modifié par XXXXX
                  </Contributor>
                </CardActions>
              </Collapse>
            </Card>
          </GridFullColumn>
        </GridRow>
        <GridRow>
          <GridFullColumn>
            <Card>
              <StyledCardHeader
                title={<Translate id="Historique" />}
                onClick={() => this.setState((state) => ({ block5: !state.block5 }))}
              />

              <Collapse in={this.state.block5} timeout="auto" unmountOnExit>
                <CardText>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec mattis pretium
                  massa. Aliquam erat volutpat. Nulla facilisi. Donec vulputate interdum
                  sollicitudin. Nunc lacinia auctor quam sed pellentesque. Aliquam dui mauris,
                  mattis quis lacus id, pellentesque lobortis odio.
                </CardText>
                <CardActions>
                  <Contributor>
                    Créé par XXXX <br />
                    Modifié par XXXXX
                  </Contributor>
                </CardActions>
              </Collapse>
            </Card>
          </GridFullColumn>
        </GridRow>
        <GridRow>
          <GridFullColumn>
            <Card>
              <StyledCardHeader
                title={<Translate id="Commentaires" />}
                onClick={() => this.setState((state) => ({ block6: !state.block6 }))}
              />

              <Collapse in={this.state.block6} timeout="auto" unmountOnExit>
                <CardText>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec mattis pretium
                  massa. Aliquam erat volutpat. Nulla facilisi. Donec vulputate interdum
                  sollicitudin. Nunc lacinia auctor quam sed pellentesque. Aliquam dui mauris,
                  mattis quis lacus id, pellentesque lobortis odio.
                </CardText>
                <CardActions>
                  <Contributor>
                    Créé par XXXX <br />
                    Modifié par XXXXX
                  </Contributor>
                </CardActions>
              </Collapse>
            </Card>
          </GridFullColumn>
        </GridRow>
        <GridRow>
          <GridFullColumn>
            <Card>
              <StyledCardHeader
                title={<Translate id="Bibliographie" />}
                onClick={() => this.setState((state) => ({ block7: !state.block7 }))}
              />

              <Collapse in={this.state.block7} timeout="auto" unmountOnExit>
                <CardText>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec mattis pretium
                  massa. Aliquam erat volutpat. Nulla facilisi. Donec vulputate interdum
                  sollicitudin. Nunc lacinia auctor quam sed pellentesque. Aliquam dui mauris,
                  mattis quis lacus id, pellentesque lobortis odio.
                </CardText>
                <CardActions>
                  <Contributor>
                    Créé par XXXX <br />
                    Modifié par XXXXX
                  </Contributor>
                </CardActions>
              </Collapse>
            </Card>
          </GridFullColumn>
        </GridRow>
      </EntriesContainer>
    );
  }
}

Details.propTypes = {
  match: PropTypes.object.isRequired,
};

export default Details;
