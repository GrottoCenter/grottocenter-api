import React from 'react';
import PropTypes from 'prop-types';
import List from '@material-ui/core/List';
import { withStyles } from '@material-ui/core/styles';
import Translate from '../Translate';
import EntryListItem from './EntryListItem';

const StyledList = withStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%',
  },
})(List);

const EntriesList = (props) => {
  const { entries, title, emptyMessageComponent } = props;

  return (
    <div>
      {entries.length > 0 ? (
        <>
          <strong>{title}</strong>
          <StyledList>
            {entries
              .sort((a, b) => a.name > b.name)
              .map((entry) => (
                <EntryListItem key={entry.id} entry={entry} />
              ))}
          </StyledList>
        </>
      ) : (
        <>
          {title}
          <br />
          <em>{emptyMessageComponent}</em>
        </>
      )}
    </div>
  );
};

EntriesList.propTypes = {
  entries: PropTypes.arrayOf(PropTypes.shape({})),
  title: PropTypes.node,
  emptyMessageComponent: PropTypes.node,
};

EntriesList.defaultProps = {
  entries: undefined,
  title: <Translate>Entries list</Translate>,
  emptyMessageComponent: <Translate>Empty list</Translate>,
};

export default EntriesList;
