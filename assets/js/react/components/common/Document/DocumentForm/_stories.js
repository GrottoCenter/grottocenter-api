import React from 'react';
import { storiesOf } from '@storybook/react';
import { Card } from '@material-ui/core';
import DocumentForm from './index';

const allLanguages = [
  {
    id: 'ENG',
    name: 'English',
  },
  {
    id: 'FR',
    name: 'French',
  },
  {
    id: 'ESP',
    name: 'Spanish',
  },
];

const DefaultDocumentForm = () => {
  const [description, setDescription] = React.useState('');
  const [descriptionLanguage, setDescriptionLanguage] = React.useState('');
  const [documentMainLanguage, setDocumentMainLanguage] = React.useState('');
  const [identifier, setIdentifier] = React.useState('');
  const [isFromBbs, setIsFromBbsChange] = React.useState(false);
  const [issue, setIssue] = React.useState('');
  const [publicationDate, setPublicationDate] = React.useState(null);
  const [reference, setReferenceChange] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [titleLanguage, setTitleLanguage] = React.useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    window.alert('Form submitted');
  };

  return (
    <div style={{ padding: '3rem' }}>
      <Card style={{ padding: '2rem' }}>
        <DocumentForm
          allLanguages={allLanguages}
          description={description}
          descriptionLanguage={descriptionLanguage}
          documentMainLanguage={documentMainLanguage}
          identifier={identifier}
          isFromBbs={isFromBbs}
          issue={issue}
          onDescriptionChange={setDescription}
          onDescriptionLanguageChange={setDescriptionLanguage}
          onDocumentMainLanguageChange={setDocumentMainLanguage}
          onIdentifierChange={setIdentifier}
          onIsFromBbsChange={setIsFromBbsChange}
          onIssueChange={setIssue}
          onPublicationDateChange={setPublicationDate}
          onReferenceChange={setReferenceChange}
          onSubmit={onSubmit}
          onTitleChange={setTitle}
          onTitleLanguageChange={setTitleLanguage}
          publicationDate={publicationDate}
          reference={reference}
          title={title}
          titleLanguage={titleLanguage}
        />
      </Card>
    </div>
  );
};

DefaultDocumentForm.propTypes = {};

storiesOf('DocumentForm', module).add('Default', () => <DefaultDocumentForm />);
