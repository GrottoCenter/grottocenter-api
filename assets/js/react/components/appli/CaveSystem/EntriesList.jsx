import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import {
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  IconButton,
  Tooltip,
  ListItemIcon,
} from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import ListIcon from '@material-ui/icons/FormatListBulleted';
import MapIcon from '@material-ui/icons/Map';
import LinkIcon from '@material-ui/icons/Link';
import { includes } from 'ramda';

import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import { CaveContext } from './Provider';
import CustomIcon from '../../common/CustomIcon';
import DisabledTooltip from '../../common/DisabledTooltip';

const LoadingList = () => (
  <>
    <Skeleton />
    <Skeleton />
    <Skeleton />
  </>
);

const EntriesList = () => {
  const { formatMessage } = useIntl();
  const {
    state: { selectedEntries, entries, loading },
    action: { openEntryMap, openEntryDescription },
  } = useContext(CaveContext);

  return (
    <ScrollableContent
      title={formatMessage({ id: 'Entries' })}
      content={
        <List dense>
          {loading ? (
            <LoadingList />
          ) : (
            entries.map((entry) => (
              <ListItem
                key={entry.id}
                selected={includes(entry.id, selectedEntries)}
              >
                <ListItemIcon>
                  <CustomIcon type="entry" />
                </ListItemIcon>
                <ListItemText primary={entry.name} />
                <ListItemSecondaryAction>
                  <DisabledTooltip disabled>
                    <span>
                      <IconButton
                        disabled
                        onClick={() => openEntryMap(entry.id)}
                        edge="end"
                        aria-label="entry map"
                      >
                        <MapIcon />
                      </IconButton>
                    </span>
                  </DisabledTooltip>
                  <Tooltip title={formatMessage({ id: 'Go to description' })}>
                    <IconButton
                      onClick={() => openEntryDescription(entry.id)}
                      edge="end"
                      aria-label="entry description"
                    >
                      <LinkIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
        </List>
      }
      footer={formatMessage({ id: 'Created by' })}
      icon={<ListIcon color="primary" />}
    />
  );
};

export default EntriesList;
