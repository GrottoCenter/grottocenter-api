/* eslint-disable camelcase */
import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Card, CardContent, TextField, Typography } from '@material-ui/core';

import SearchBottomActionButtons from './SearchBottomActionButtons';
import Translate from '../../common/Translate';
import styles from './styles';

class MassifsSearch extends React.Component {
  /*
    The state is created with particular key names because, these names are directly linked to
    the names of these properties in Elasticsearch. Here we have a syntax that
    allow us to distinguish search range parameters from others parameters.
   */
  constructor(props) {
    super(props);
    this.state = this.getInitialState();
    this.handleValueChange = this.handleValueChange.bind(this);
  }

  getInitialState = () => ({
    name: '',
  });

  /**
   * keyName: String
   * event: Event
   * This function changes the state of the keyName property
   * with the value of the target event.
   */
  handleValueChange = (keyName, event) => {
    this.setState({
      [keyName]: event.target.value,
    });
  };

  resetToInitialState = () => {
    this.setState(this.getInitialState());
  };

  render() {
    const { resourceType, resetResults, startAdvancedsearch } = this.props;

    const { name } = this.state;

    return (
      <Card>
        <CardContent>
          <form
            noValidate
            autoComplete="off"
            onSubmit={(event) => {
              event.preventDefault();
              startAdvancedsearch(this.state, resourceType);
            }}
          >
            <Typography variant="h6">
              <Translate>Massif properties</Translate>
            </Typography>

            <TextField
              label={
                <span>
                  <Translate>Massif name</Translate>
                </span>
              }
              onChange={(event) => this.handleValueChange('name', event)}
              value={name}
            />

            <SearchBottomActionButtons
              resetResults={resetResults}
              resetParentState={this.resetToInitialState}
            />
          </form>
        </CardContent>
      </Card>
    );
  }
}

MassifsSearch.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  startAdvancedsearch: PropTypes.func.isRequired,
  resetResults: PropTypes.func.isRequired,
  resourceType: PropTypes.string.isRequired,
};

MassifsSearch.defaultProps = {};

export default withStyles(styles)(MassifsSearch);
