import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { Card } from '@material-ui/core';
import DocumentFormProvider, { defaultContext } from '../Provider';

import DescriptionEditor from '../formElements/DescriptionEditor';
import DocumentTypeSelect from '../formElements/DocumentTypeSelect';
import IdentifierEditor from '../formElements/IdentifierEditor';
import PagesEditor from '../formElements/PagesEditor';
import PublicationDatePicker from '../formElements/PublicationDatePicker';
import TitleEditor from '../formElements/TitleEditor';

import { allDocumentTypes } from '../DocumentTypesHelper';

import {
  // allAuthors,
  // allEditors,
  allIdentifierTypes,
  allLanguages,
  // allLibraries,
  // allMassifs,
  // allPartOf,
  // allRegions,
  // allSubjects,
} from './documentFormFakeData';

// ==========================

const PaddedCard = styled(Card)`
  padding: 2rem;
`;

// ==========================
// eslint-disable-next-line react/prop-types
const DefaultDocumentForm = ({ children }) => {
  return (
    <div style={{ padding: '3rem' }}>
      <PaddedCard>{children}</PaddedCard>
    </div>
  );
};

DefaultDocumentForm.propTypes = {};

const DocFormProviderDecorator = (
  storyFn,
  docAttributes = defaultContext.docAttributes,
) => (
  <DefaultDocumentForm>
    <DocumentFormProvider docAttributes={docAttributes}>
      {storyFn()}
    </DocumentFormProvider>
  </DefaultDocumentForm>
);

storiesOf('DocumentForm', module)
  .add(
    'DescriptionEditor',
    () => <DescriptionEditor allLanguages={allLanguages} />,
    {
      decorators: [(storyFn) => DocFormProviderDecorator(storyFn)],
    },
  )
  .add(
    'DocumentTypeSelect',
    () => (
      <DocumentTypeSelect
        allDocumentTypes={allDocumentTypes}
        helperText="For example, a magazine published regularly is an Issue, an article from a magazine is an Article."
      />
    ),
    {
      decorators: [(storyFn) => DocFormProviderDecorator(storyFn)],
    },
  )
  .add(
    'IdentifierEditor',
    () => (
      <IdentifierEditor
        allIdentifierTypes={allIdentifierTypes}
        documentType={allDocumentTypes[0]}
      />
    ),
    {
      decorators: [(storyFn) => DocFormProviderDecorator(storyFn)],
    },
  )
  .add('PagesEditor', () => <PagesEditor />, {
    decorators: [(storyFn) => DocFormProviderDecorator(storyFn)],
  })
  .add('PublicationDatePicker', () => <PublicationDatePicker />, {
    decorators: [(storyFn) => DocFormProviderDecorator(storyFn)],
  })
  .add(
    'TitleEditor',
    () => (
      <TitleEditor
        allLanguages={allLanguages}
        languageHelperText="Language of the title. You will be able to add more translations of the title later."
        languageItemReferringTo="Title and Description"
      />
    ),
    {
      decorators: [(storyFn) => DocFormProviderDecorator(storyFn)],
    },
  );
