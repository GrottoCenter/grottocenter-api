import React from 'react';
import PropTypes from 'prop-types';
import { storiesOf } from '@storybook/react';
import { Card } from '@material-ui/core';
import DocumentForm from '../index';
import DocumentFormProvider, { defaultContext } from '../Provider';
import { allDocumentTypes } from '../DocumentTypesHelper';

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

const DefaultDocumentForm = ({
  forcedAuthors = [],
  forcedDescription = '',
  forcedDescriptionLanguage = '',
  forcedDocumentType = -1,
  forcedEditor = { id: '', name: '' },
  forcedPartOf = { id: '', name: '' },
  forcedPublicationDate = null,
  forcedRegions = [],
  forcedSubjects = [],
  forcedTitle = '',
  forcedTitleLanguage = '',
}) => {
  const [authors, setAuthors] = React.useState(forcedAuthors);
  const [description, setDescription] = React.useState(forcedDescription);
  const [descriptionLanguage, setDescriptionLanguage] = React.useState(
    forcedDescriptionLanguage,
  );
  const [documentMainLanguage, setDocumentMainLanguage] = React.useState('');
  const [documentType, setDocumentType] = React.useState(forcedDocumentType);
  const [editor, setEditor] = React.useState(forcedEditor);
  const [endPage, setEndPage] = React.useState(0);
  const [identifier, setIdentifier] = React.useState('');
  const [identifierType, setIdentifierType] = React.useState({
    id: '',
    text: '',
  });
  const [issue, setIssue] = React.useState('');
  const [library, setLibrary] = React.useState({ id: '', name: '' });
  const [massif, setMassif] = React.useState({ id: '', name: '' });
  const [pageComment, setPageComment] = React.useState('');
  const [partOf, setPartOf] = React.useState(forcedPartOf);
  const [publicationDate, setPublicationDate] = React.useState(
    forcedPublicationDate,
  );
  const [reference, setReferenceChange] = React.useState('');
  const [regions, setRegions] = React.useState(forcedRegions);
  const [startPage, setStartPage] = React.useState(0);
  const [subjects, setSubjects] = React.useState(forcedSubjects);
  const [title, setTitle] = React.useState(forcedTitle);
  const [titleLanguage, setTitleLanguage] = React.useState(forcedTitleLanguage);

  const onSubmit = (e) => {
    e.preventDefault();
    window.alert('Form submitted'); // eslint-disable-line no-alert
  };

  return (
    <div style={{ padding: '3rem' }}>
      <Card style={{ padding: '2rem' }}>
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
          authors={authors}
          description={description}
          descriptionLanguage={descriptionLanguage}
          documentMainLanguage={documentMainLanguage}
          documentType={documentType}
          editor={editor}
          endPage={endPage}
          identifier={identifier}
          identifierType={identifierType}
          issue={issue}
          library={library}
          massif={massif}
          onAuthorsChange={setAuthors}
          onDescriptionChange={setDescription}
          onEditorChange={setEditor}
          onDescriptionLanguageChange={setDescriptionLanguage}
          onDocumentMainLanguageChange={setDocumentMainLanguage}
          onDocumentTypeChange={setDocumentType}
          onEditorEchange={setEditor}
          onEndPageChange={setEndPage}
          onIdentifierChange={setIdentifier}
          onIdentifierTypeChange={setIdentifierType}
          onIssueChange={setIssue}
          onLibraryChange={setLibrary}
          onMassifChange={setMassif}
          onPageCommentChange={setPageComment}
          onPartOfChange={setPartOf}
          onPublicationDateChange={setPublicationDate}
          onRegionsChange={setRegions}
          onReferenceChange={setReferenceChange}
          onStartPageChange={setStartPage}
          onSubjectsChange={setSubjects}
          onSubmit={onSubmit}
          onTitleChange={setTitle}
          onTitleLanguageChange={setTitleLanguage}
          pageComment={pageComment}
          partOf={partOf}
          publicationDate={publicationDate}
          reference={reference}
          regions={regions}
          startPage={startPage}
          subjects={subjects}
          title={title}
          titleLanguage={titleLanguage}
        />
      </Card>
    </div>
  );
};

DefaultDocumentForm.propTypes = {
  forcedAuthors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      surname: PropTypes.string.isRequired,
    }),
  ),
  forcedDescription: PropTypes.string,
  forcedDescriptionLanguage: PropTypes.string,
  forcedDocumentType: PropTypes.number,
  forcedEditor: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  forcedPartOf: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      issue: PropTypes.string,
      documenType: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      }),
      partOf: PropTypes.shape({}),
    }),
  ),
  forcedPublicationDate: PropTypes.objectOf(Date),
  forcedRegions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  forcedSubjects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      subject: PropTypes.string.isRequired,
    }),
  ),
  forcedTitle: PropTypes.string,
  forcedTitleLanguage: PropTypes.string,
};

storiesOf('DocumentForm', module)
  .add('Default', () => <DefaultDocumentForm />, {
    decorators: [(storyFn) => ProviderDecorator(storyFn)],
  })
  .add('Collection', () => <DefaultDocumentForm />, {
    decorators: [
      (storyFn) =>
        ProviderDecorator(storyFn, {
          ...defaultContext.docAttributes,
          description: 'This is the description of the collection Spelunca.',
          descriptionLanguage: allLanguages[0],
          documentType: allDocumentTypes[0],
          editor: allEditors[5],
          identifier: '0242-1771',
          identifierType: {
            id: '3',
            name: 'ISSN',
          },
          title: 'Spelunca',
          titleLanguage: allLanguages[0],
        }),
    ],
  })
  .add('CollectionElement', () => <DefaultDocumentForm />, {
    decorators: [
      (storyFn) =>
        ProviderDecorator(storyFn, {
          ...defaultContext.docAttributes,
          description: 'Description of the Spelunca n°42',
          descriptionLanguage: allLanguages[0],
          documentType: allDocumentTypes[1],
          editor: allEditors[5],
          partOf: allPartOf[0],
          publicationDate: new Date(),
          title: 'Spelunca',
          titleLanguage: allLanguages[0],
        }),
    ],
  })
  .add('Text / Article', () => <DefaultDocumentForm />, {
    decorators: [
      (storyFn) =>
        ProviderDecorator(storyFn, {
          ...defaultContext.docAttributes,
          authors: [allAuthors[0], allAuthors[2]],
          description:
            'Découvert en 2017, le Gouffre de Giétroz Devant, dans le vallon de Susanfe ( 2178 m alt commune d’Evionnaz ), a livré des ossements animaux remarquablement conservés, issus surtout d’ongulés, et plus particulièrement de bouquetins des Alpes.',
          descriptionLanguage: allLanguages[1],
          documentType: allDocumentTypes[3],
          editors: allEditors[5],
          partOf: allPartOf[1],
          publicationDate: new Date('2018-01-01'),
          subjects: [allSubjects[1]],
          title:
            'Découvertes paléontologiques au gouffre de Giétroz devant dans le vallon de Susanfe',
          titleLanguage: allLanguages[1],
        }),
    ],
  })
  .add('Image', () => <DefaultDocumentForm />, {
    decorators: [
      (storyFn) =>
        ProviderDecorator(storyFn, {
          ...defaultContext.docAttributes,
          authors: [allAuthors[1]],
          description: "Photo de l'entrée prise la nuit",
          descriptionLanguage: 'FR',
          documentType: allDocumentTypes[2],
          editors: allEditors[5],
          partOf: allPartOf[0],
          publicationDate: new Date(),
          title: "Entrée_24991 vue de l'extérieur",
          titleLanguage: 'FR',
        }),
    ],
  });
