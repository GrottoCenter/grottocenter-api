import React from 'react';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import RandomEntryCardContainer from '../../containers/RandomEntryCardContainer';
import { GridRow } from '../../helpers/GridSystem';
import Translate from '../common/Translate';
import LandingSection from './LandingSection';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const RandomEntrySection = styled(LandingSection)`
  text-align: center;
`;

const BgRandomEntrySection = styled(RandomEntrySection)`
  background-image: url('../images/caves/DSC_0420.JPG');
  background-size: cover;
  background-attachment: fixed;
  background-position: center;
  background-repeat: no-repeat;
  margin-top: 0;
`;

const SectionTitle = withTheme(styled.h3`
  color: ${(props) => props.theme.palette.secondaryBlocTitle};
  text-align: center;
  padding-bottom: 50px;
  font-size: 35px;
`);

//
//
// M A I N - C O M P O N E N T
//
//

const RandomEntry = () => (
  <BgRandomEntrySection>
    <GridRow>
      <SectionTitle>
        <Translate>A cave on Grottocenter</Translate>
      </SectionTitle>
    </GridRow>
    <GridRow>
      <RandomEntryCardContainer />
    </GridRow>
  </BgRandomEntrySection>
);

export default RandomEntry;
