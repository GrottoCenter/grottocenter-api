import React from 'react';
import { storiesOf } from '@storybook/react';
import { Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';

import Layout from './index';
import FixedContent from './FixedContent';
import ScrollableContent from './ScrollableContent';
import { Default } from '../Main/_stories';
import Index from '../../CustomIcon';

const Content = () => (
  <Typography>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec mattis
    pretium massa. Aliquam erat volutpat. Nulla facilisi. Donec vulputate
    interdum sollicitudin. Nunc lacinia auctor quam sed pellentesque. Aliquam
    dui mauris, mattis quis lacus id, pellentesque lobortis odio.
  </Typography>
);

const WithState = () => {
  const { formatMessage } = useIntl();

  return (
    <Layout
      fixedContent={
        <FixedContent
          title="title"
          content="content"
          footer="footer"
          icon={<Index type="entry" />}
        />
      }
    >
      <>
        <ScrollableContent
          title={formatMessage({ id: 'Description' })}
          content={<Content />}
          footer={formatMessage({ id: 'Created by' })}
        />
        <ScrollableContent
          title={formatMessage({ id: 'Topography' })}
          content={<Content />}
          footer={formatMessage({ id: 'Created by' })}
          icon={<Index type="entry" />}
        />
        <ScrollableContent
          title={formatMessage({ id: 'Equipments' })}
          content={<Content />}
          footer={formatMessage({ id: 'Created by' })}
        />
        <ScrollableContent
          title={formatMessage({ id: 'History' })}
          content={<Content />}
          footer={formatMessage({ id: 'Created by' })}
        />
        <ScrollableContent
          title={formatMessage({ id: 'Comments' })}
          content={<Content />}
          footer={formatMessage({ id: 'Created by' })}
        />
        <ScrollableContent
          title={formatMessage({ id: 'Bibliography' })}
          content={<Content />}
          footer={formatMessage({ id: 'Created by' })}
        />
      </>
    </Layout>
  );
};

storiesOf('Layouts', module)
  .add('Fixed content - Default', () => <WithState />)
  .add('Main - With Fixed Content', () => (
    <Default>
      <WithState />
    </Default>
  ));
