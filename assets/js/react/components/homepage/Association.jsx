import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import LandingSection from './LandingSection';
import {
  GridRow, GridOneThirdColumn, GridTwoThirdColumn, GridFullColumn,
} from '../../helpers/GridSystem';
import AssociationCheckList from './AssociationCheckList';
import AssociationFlyingGoals from './AssociationFlyingGoals';
import Translate from '../common/Translate';
import GCLogo from '../common/GCLogo';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const AssociationTitle = styled.h3`
  color: ${props => props.color};
  text-align: center;
  padding-bottom: 50px;
  font-size: 35px;

  @media (min-width: 550px) {
    text-align: left; 
  }
`;

const AssociationDetails = styled.h5`
  font-size: large;
  text-align: justify;
`;

const AssociationLogo = styled.div`
  padding: 20px 10px;
  min-width: 100px;
  background-color: #e8dcd8;
  
  @media (min-width: 750px) {
    margin: 20px 0 20px 40px;
  }
`;

const AssociationLogoImage = styled(GCLogo)`
  & > img {
    max-width: 200px;
    width: 100%;
  
    :visible {
      scale: 50%;
    }
  }
`;

const AssociationSection = styled(LandingSection)`
  text-align: center;
`;

const AssociationGridRow = styled(GridRow)`
  padding-top: 20px; /* ===> TODO ne fonctionne pas car GridRow a déjà une classe */
`;

const listEntries = {
  title: <Translate>The international voluntary association WikiCaves operates the GrottoCenter web application WikiCaves has as goals:</Translate>,
  entries: [
    {
      word: <Translate>Promote!</Translate>,
      description: <Translate>Promote the development of the speleology in the world especially through  web-based collaboration</Translate>,
    },
    {
      word: <Translate>Share!</Translate>,
      description: <Translate>Share and spread the data related to the speleology</Translate>,
    },
    {
      word: <Translate>Open!</Translate>,
      description: <Translate>Make access to the natural caves data easier especially by using Internet</Translate>,
    },
    {
      word: <Translate>Highlight!</Translate>,
      description: <Translate>Highlight and help the protection of the natural caves and their surroundings</Translate>,
    },
    {
      word: <Translate>Help!</Translate>,
      description: <Translate>Help the exploration and the scientific study of natural caves</Translate>,
    },
  ],
};

//
//
// M A I N - C O M P O N E N T
//
//

const Association = props => (
  <AssociationSection
    bgColor={props.theme.palette.primary1Color}
    fgColor={props.theme.palette.textIconColor}
  >

    <AssociationGridRow>
      <GridTwoThirdColumn>
        <AssociationTitle color={props.theme.palette.accent1Color}>
          <Translate>Wikicaves association</Translate>
        </AssociationTitle>
        <AssociationDetails>
          <Translate>GrottoCenter is a comunity database for cavers based on a wiki-like system Cavers fill the databes for cavers</Translate>
          <br />
          <Translate>Any interesting natural cave can be added in the database!</Translate>
        </AssociationDetails>
      </GridTwoThirdColumn>

      <GridOneThirdColumn>
        <AssociationLogo>
          <AssociationLogoImage showLink={false} />
        </AssociationLogo>
      </GridOneThirdColumn>
    </AssociationGridRow>

    <AssociationGridRow>
      <GridFullColumn>
        <AssociationCheckList title={listEntries.title} entries={listEntries.entries} />

        <AssociationFlyingGoals
          title={listEntries.title}
          entries={listEntries.entries}
          textColor={props.theme.palette.textIconColor}
          iconColor={props.theme.palette.primary3Color}
          iconHoverColor={props.theme.palette.accent1Color}
        />
      </GridFullColumn>
    </AssociationGridRow>

  </AssociationSection>
);

Association.propTypes = {
  theme: PropTypes.object.isRequired,
};

export default withTheme()(Association);
