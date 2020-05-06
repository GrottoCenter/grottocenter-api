import React from 'react';
import { storiesOf } from '@storybook/react';
import { Card } from '@material-ui/core';
import DocumentForm from './index';

const DefaultDocumentForm = () => {
  const [description, setDescription] = React.useState('');
  const [documentLanguage, setDocumentLanguage] = React.useState('');
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
          description={description}
          documentLanguage={documentLanguage}
          identifier={identifier}
          isFromBbs={isFromBbs}
          issue={issue}
          onDescriptionChange={setDescription}
          onDocumentLanguageChange={setDocumentLanguage}
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
