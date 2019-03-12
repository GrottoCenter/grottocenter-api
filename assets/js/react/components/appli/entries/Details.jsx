import React from 'react';
import PropTypes from 'prop-types';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardText from '@material-ui/core/CardContent';
import Collapse from '@material-ui/core/Collapse/Collapse';
import styled from 'styled-components';
import {
  GridContainer, GridRow, GridOneThirdColumn, GridTwoThirdColumn, GridFullColumn,
} from '../../../helpers/GridSystem';
import Translate from '../../common/Translate';

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
    const title = `Détails de l'entrée : ${this.props.match.params.id}`;

    // https://wiki.grottocenter.org/wiki/Fr/0006077

    return (
      <EntriesContainer>
        <GridRow>
          <GridFullColumn>
            <Card>
              <WarningCardText>
                Texte qui apparaît si la cavité est sensible
              </WarningCardText>
            </Card>
          </GridFullColumn>
        </GridRow>
        <GridRow>
          <GridTwoThirdColumn>
            <Card>
              <CardHeader title={title} />
              <CardText>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Donec mattis pretium massa. Aliquam erat volutpat. Nulla facilisi.
                Donec vulputate interdum sollicitudin. Nunc lacinia auctor quam sed pellentesque.
                Aliquam dui mauris, mattis quis lacus id, pellentesque lobortis odio.
              </CardText>
            </Card>
          </GridTwoThirdColumn>
          <GridOneThirdColumn>
            <Card>
              <CardText>
                MAP
              </CardText>
            </Card>
          </GridOneThirdColumn>
        </GridRow>
        <GridRow>
          <GridFullColumn>
            <Card>
              <CardHeader
                title={(
                  <Translate id="Localisation" />
                )}
                onClick={() => this.setState(state => ({ block1: !state.block1 }))}
              />

              <Collapse in={this.state.block1} timeout="auto" unmountOnExit>
                <CardText>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Donec mattis pretium massa. Aliquam erat volutpat. Nulla facilisi.
                  Donec vulputate interdum sollicitudin. Nunc lacinia auctor quam sed pellentesque.
                  Aliquam dui mauris, mattis quis lacus id, pellentesque lobortis odio.
                </CardText>
              </Collapse>
            </Card>
          </GridFullColumn>
        </GridRow>
        <GridRow>
          <GridFullColumn>
            <Card>
              <CardHeader
                title={(
                  <Translate id="Description" />
                )}
                onClick={() => this.setState(state => ({ block2: !state.block2 }))}
              />

              <Collapse in={this.state.block2} timeout="auto" unmountOnExit>
                <CardText>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Donec mattis pretium massa. Aliquam erat volutpat. Nulla facilisi.
                  Donec vulputate interdum sollicitudin. Nunc lacinia auctor quam sed pellentesque.
                  Aliquam dui mauris, mattis quis lacus id, pellentesque lobortis odio.
                </CardText>
              </Collapse>
            </Card>
          </GridFullColumn>
        </GridRow>
        <GridRow>
          <GridFullColumn>
            <Card>
              <CardHeader
                title={(
                  <Translate id="Topographie" />
                )}
                onClick={() => this.setState(state => ({ block3: !state.block3 }))}
              />

              <Collapse in={this.state.block3} timeout="auto" unmountOnExit>
                <CardText>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Donec mattis pretium massa. Aliquam erat volutpat. Nulla facilisi.
                  Donec vulputate interdum sollicitudin. Nunc lacinia auctor quam sed pellentesque.
                  Aliquam dui mauris, mattis quis lacus id, pellentesque lobortis odio.
                </CardText>
              </Collapse>
            </Card>
          </GridFullColumn>
        </GridRow>
        <GridRow>
          <GridFullColumn>
            <Card>
              <CardHeader
                title={(
                  <Translate id="Fiche équipement" />
                )}
                onClick={() => this.setState(state => ({ block4: !state.block4 }))}
              />

              <Collapse in={this.state.block4} timeout="auto" unmountOnExit>
                <CardText>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Donec mattis pretium massa. Aliquam erat volutpat. Nulla facilisi.
                  Donec vulputate interdum sollicitudin. Nunc lacinia auctor quam sed pellentesque.
                  Aliquam dui mauris, mattis quis lacus id, pellentesque lobortis odio.
                </CardText>
              </Collapse>
            </Card>
          </GridFullColumn>
        </GridRow>
        <GridRow>
          <GridFullColumn>
            <Card>
              <CardHeader
                title={(
                  <Translate id="Historique" />
                )}
                onClick={() => this.setState(state => ({ block5: !state.block5 }))}
              />

              <Collapse in={this.state.block5} timeout="auto" unmountOnExit>
                <CardText>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Donec mattis pretium massa. Aliquam erat volutpat. Nulla facilisi.
                  Donec vulputate interdum sollicitudin. Nunc lacinia auctor quam sed pellentesque.
                  Aliquam dui mauris, mattis quis lacus id, pellentesque lobortis odio.
                </CardText>
              </Collapse>
            </Card>
          </GridFullColumn>
        </GridRow>
        <GridRow>
          <GridFullColumn>
            <Card>
              <CardHeader
                title={(
                  <Translate id="Commentaires" />
                )}
                onClick={() => this.setState(state => ({ block6: !state.block6 }))}
              />

              <Collapse in={this.state.block6} timeout="auto" unmountOnExit>
                <CardText>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Donec mattis pretium massa. Aliquam erat volutpat. Nulla facilisi.
                  Donec vulputate interdum sollicitudin. Nunc lacinia auctor quam sed pellentesque.
                  Aliquam dui mauris, mattis quis lacus id, pellentesque lobortis odio.
                </CardText>
              </Collapse>
            </Card>
          </GridFullColumn>
        </GridRow>
        <GridRow>
          <GridFullColumn>
            <Card>
              <CardHeader
                title={(
                  <Translate id="Bibliographie" />
                )}
                onClick={() => this.setState(state => ({ block7: !state.block7 }))}
              />

              <Collapse in={this.state.block7} timeout="auto" unmountOnExit>
                <CardText>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Donec mattis pretium massa. Aliquam erat volutpat. Nulla facilisi.
                  Donec vulputate interdum sollicitudin. Nunc lacinia auctor quam sed pellentesque.
                  Aliquam dui mauris, mattis quis lacus id, pellentesque lobortis odio.
                </CardText>
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
