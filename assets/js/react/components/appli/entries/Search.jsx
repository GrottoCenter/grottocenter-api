import React from 'react';
import Card from '@material-ui/core/Card';
import CardTitle from '@material-ui/core/CardHeader';
import CardText from '@material-ui/core/CardContent';
import { GridContainer, GridRow, GridFullColumn } from '../../../helpers/GridSystem';

const Search = () => (
  <GridContainer>
    <GridRow>
      <GridFullColumn>
        <Card>
          <CardText>Formulaire de recherche non implémenté</CardText>
        </Card>
      </GridFullColumn>
    </GridRow>
    <GridRow>
      <GridFullColumn>
        <Card>
          <CardTitle title="Résultats" />
          <CardText>Tableau de résultats non implémenté</CardText>
        </Card>
      </GridFullColumn>
    </GridRow>
  </GridContainer>
);

export default Search;
