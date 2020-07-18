import React from 'react';
import styled from 'styled-components';
import { action } from '@storybook/addon-actions';
// import { storiesOf } from '@storybook/react';
import { Card, Switch } from '@material-ui/core';
import DocumentForm from '../index';
// import DocumentFormProvider, { defaultContext } from '../Provider';

import {
  allAuthors,
  allEditors,
  allIdentifierTypes,
  allLanguages,
  allLibraries,
  allMassifs,
  allPartOf,
  allRegions,
  allSubjects,
} from './documentFormFakeData';

// ==========================

const PaddedCard = styled(Card)`
  padding: 2rem;
`;

const StoryControlsCard = styled(PaddedCard)`
  background-color: ${({ theme }) => theme.palette.primary.light};
  font-size: 1.5rem;
`;

// ==========================

const DefaultDocumentForm = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    action('on form submitted')(e);
  };

  return (
    <div style={{ padding: '3rem' }}>
      <StoryControlsCard>
        <div>
          <b>Form State StoryControls</b>
        </div>
        <Switch
          color="secondary"
          checked={isLoading}
          onChange={(event) => setIsLoading(event.target.checked)}
          inputProps={{ 'aria-label': 'primary checkbox' }}
        />
        <span>Is loading</span>
      </StoryControlsCard>
      <br />
      <PaddedCard>
        <DocumentForm
          allAuthors={allAuthors}
          allEditors={allEditors}
          allIdentifierTypes={allIdentifierTypes}
          allLanguages={allLanguages}
          allLibraries={allLibraries}
          allMassifs={allMassifs}
          allPartOf={allPartOf}
          allRegions={allRegions}
          allSubjects={allSubjects}
          isLoading={isLoading}
          onSubmit={onSubmit}
        />
      </PaddedCard>
    </div>
  );
};

DefaultDocumentForm.propTypes = {};

// TODO : commented because some components use Redux store
// and, therefore, can not be used in Storybook

// const ProviderDecorator = (
//   storyFn,
//   docAttributes = defaultContext.docAttributes,
// ) => (
//   <DocumentFormProvider docAttributes={docAttributes}>
//     {storyFn()}
//   </DocumentFormProvider>
// );

//
// storiesOf('DocumentForm', module)
//   .add('Default', () => <DefaultDocumentForm />, {
//     decorators: [(storyFn) => ProviderDecorator(storyFn)],
//   })
//   .add('Collection', () => <DefaultDocumentForm />, {
//     decorators: [
//       (storyFn) =>
//         ProviderDecorator(storyFn, {
//           ...defaultContext.docAttributes,
//           description: 'This is the description of the collection Spelunca.',
//           descriptionLanguage: allLanguages[0],
//           documentType: allDocumentTypes[0],
//           editor: allEditors[5],
//           identifier: '0242-1771',
//           identifierType: {
//             id: '3',
//             name: 'ISSN',
//           },
//           title: 'Spelunca',
//           titleLanguage: allLanguages[0],
//         }),
//     ],
//   })
//   .add('CollectionElement', () => <DefaultDocumentForm />, {
//     decorators: [
//       (storyFn) =>
//         ProviderDecorator(storyFn, {
//           ...defaultContext.docAttributes,
//           description: 'Description of the Spelunca n°42',
//           descriptionLanguage: allLanguages[0],
//           documentType: allDocumentTypes[1],
//           editor: allEditors[5],
//           partOf: allPartOf[0],
//           publicationDate: new Date(),
//           title: 'Spelunca',
//           titleLanguage: allLanguages[0],
//         }),
//     ],
//   })
//   .add('Text / Article', () => <DefaultDocumentForm />, {
//     decorators: [
//       (storyFn) =>
//         ProviderDecorator(storyFn, {
//           ...defaultContext.docAttributes,
//           authors: [allAuthors[0], allAuthors[2]],
//           description:
//             'Découvert en 2017, le Gouffre de Giétroz Devant, dans le vallon de Susanfe ( 2178 m alt commune d’Evionnaz ), a livré des ossements animaux remarquablement conservés, issus surtout d’ongulés, et plus particulièrement de bouquetins des Alpes.',
//           descriptionLanguage: allLanguages[1],
//           documentType: allDocumentTypes[3],
//           editors: allEditors[5],
//           partOf: allPartOf[1],
//           publicationDate: new Date('2018-01-01'),
//           subjects: [allSubjects[1]],
//           title:
//             'Découvertes paléontologiques au gouffre de Giétroz devant dans le vallon de Susanfe',
//           titleLanguage: allLanguages[1],
//         }),
//     ],
//   })
//   .add('Image', () => <DefaultDocumentForm />, {
//     decorators: [
//       (storyFn) =>
//         ProviderDecorator(storyFn, {
//           ...defaultContext.docAttributes,
//           authors: [allAuthors[1]],
//           description: "Photo de l'entrée prise la nuit",
//           descriptionLanguage: 'FR',
//           documentType: allDocumentTypes[2],
//           editors: allEditors[5],
//           partOf: allPartOf[0],
//           publicationDate: new Date(),
//           title: "Entrée_24991 vue de l'extérieur",
//           titleLanguage: 'FR',
//         }),
//     ],
//   });
