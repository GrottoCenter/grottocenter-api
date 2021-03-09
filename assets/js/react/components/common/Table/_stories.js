import React, { useState, useEffect, useCallback } from 'react';
import { storiesOf } from '@storybook/react';
import { isNil } from 'ramda';
import { useIntl } from 'react-intl';
import { boolean } from '@storybook/addon-knobs';

import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import data from './data.json';
import StandardDialog from '../StandardDialog';
import Table from './index';
import { createColumns } from './TableHead';

// memoize
const makeCustomHeaderRenders = () => {
  return [
    {
      id: 'title',
      customRender: () => 'Custom title',
    },
  ];
};

// memoize
const makeCustomRenders = () => {
  const { formatDate } = useIntl();
  return [
    {
      id: 'submit_date',
      customRender: (date) => {
        const tmpDate = new Date(date);
        const formattedDate =
          // eslint-disable-next-line no-self-compare
          tmpDate.getTime() === tmpDate.getTime() ? formatDate(tmpDate) : date;

        return (
          <Typography variant="subtitle2">{`${formattedDate}`}</Typography>
        );
      },
    },
    {
      id: 'title',
      customRender: (title) => {
        return <Typography color="error">{title}</Typography>;
      },
    },
  ];
};

const HydratedTable = ({
  loading,
  hasDetailedView,
  hasSelection,
  hasUpdateRowsPerPage,
  hasPagination,
  hasOrder,
  hasCustomHeaderRenders,
  hasCustomRenders,
  hasEmptyData,
}) => {
  const { formatMessage } = useIntl();
  const makeTranslation = (id) => formatMessage({ id });
  const [selection, setSelection] = useState([1]);
  const [hiddenColumns, setHiddenColumns] = useState(['id']);
  const [columns, setColumns] = useState(
    createColumns(data.documents, makeTranslation),
  );
  const [detailedView, setDetailedView] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [order, setOrder] = useState(null);
  const [orderBy, setOrderBy] = useState(null);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [currentData, updateCurrentData] = useState(
    data.documents.slice(
      currentPage * rowsPerPage,
      currentPage * rowsPerPage + rowsPerPage,
    ),
  );

  const onFetchData = () => {
    updateCurrentData(
      data.documents.slice(
        currentPage * rowsPerPage,
        currentPage * rowsPerPage + rowsPerPage,
      ),
    );
  };

  const handleSelection = useCallback(
    (newSelection) => {
      setSelection(newSelection);
    },
    [setSelection],
  );

  useEffect(() => {
    setColumns(createColumns(data.documents, makeTranslation));
  }, [data]);

  // When these table states change, fetch new data!
  useEffect(() => {
    // This might need a debounce
    onFetchData({ currentPage, rowsPerPage, orderBy, order });
  }, [order, orderBy, rowsPerPage, currentPage]);

  // Force header rerender for storybook knobs
  useEffect(() => {
    setColumns(createColumns(data.documents, makeTranslation));
  }, [hasDetailedView, hasSelection]);

  return (
    <>
      <Table
        columns={hasEmptyData ? [] : columns}
        currentPage={currentPage}
        customCellRenders={hasCustomRenders ? makeCustomRenders() : undefined}
        customHeaderCellRenders={
          hasCustomHeaderRenders ? makeCustomHeaderRenders() : undefined
        }
        data={hasEmptyData ? [] : currentData}
        hiddenColumns={hiddenColumns}
        loading={loading}
        openDetailedView={hasDetailedView ? setDetailedView : undefined}
        order={order}
        orderBy={orderBy || undefined}
        rowsCount={data.documents.length}
        rowsPerPage={rowsPerPage}
        selection={selection}
        title="Table story"
        updateCurrentPage={hasPagination ? setCurrentPage : undefined}
        updateHiddenColumns={setHiddenColumns}
        updateOrder={hasOrder ? setOrder : undefined}
        updateOrderBy={hasOrder ? setOrderBy : undefined}
        updateRowsPerPage={hasUpdateRowsPerPage ? setRowsPerPage : undefined}
        updateSelection={hasSelection ? handleSelection : undefined}
      />
      <StandardDialog
        maxWidth="lg"
        open={!isNil(detailedView)}
        onClose={() => {
          setDetailedView(null);
        }}
        title="detailed view"
      >
        <>detailed view number {detailedView || 'nothing'}</>
      </StandardDialog>
    </>
  );
};

storiesOf('Table', module).add('Default', () => (
  <HydratedTable
    loading={boolean('Loading', false)}
    hasEmptyData={boolean('Has no data', false)}
    hasUpdateRowsPerPage={boolean('Has update rows per page', true)}
    hasPagination={boolean('Has pagination', true)}
    hasDetailedView={boolean('Has detailed view', true)}
    hasSelection={boolean('Has selection', true)}
    hasOrder={boolean('Has order', true)}
    hasCustomRenders={boolean('Has custom renders', true)}
    hasCustomHeaderRenders={boolean('Has custom header renders', true)}
  />
));

HydratedTable.propTypes = {
  loading: PropTypes.bool.isRequired,
  hasUpdateRowsPerPage: PropTypes.bool.isRequired,
  hasPagination: PropTypes.bool.isRequired,
  hasDetailedView: PropTypes.bool.isRequired,
  hasSelection: PropTypes.bool.isRequired,
  hasOrder: PropTypes.bool.isRequired,
  hasCustomRenders: PropTypes.bool.isRequired,
  hasCustomHeaderRenders: PropTypes.bool.isRequired,
  hasEmptyData: PropTypes.bool.isRequired,
};
