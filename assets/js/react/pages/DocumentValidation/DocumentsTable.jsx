import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import makeCustomCellRenders from './customCellRenders';
import Table from '../../components/common/Table';
import { createColumns } from '../../components/common/Table/TableHead';

const defaultHiddenColumns = [
  'authors',
  'cave',
  'datePublication',
  'dateValidation',
  'descriptions',
  'editor',
  'entrance',
  'id',
  'identifier',
  'identifierType',
  'library',
  'license',
  'massif',
  'pages',
  'parent',
  'publication',
  'publicationFasciculeBBSOld',
  'refBbs',
  'regions',
  'reviewer',
  'subjects',
];

const DocumentsTable = ({
  currentPage,
  documents,
  loading,
  openDetailedView,
  order,
  orderBy,
  rowsCount,
  rowsPerPage,
  selected,
  updateOrder,
  updateOrderBy,
  updatePage,
  updateRowsPerPage,
  updateSelected,
}) => {
  const { formatMessage } = useIntl();
  const [hiddenColumns, setHiddenColumns] = useState(defaultHiddenColumns);
  const makeTranslation = (id) =>
    formatMessage({ id: `${id[0].toUpperCase()}${id.slice(1)}` });
  const [columns, setColumns] = useState(
    createColumns(documents, makeTranslation),
  );

  useEffect(() => {
    setColumns(createColumns(documents, makeTranslation));
  }, [documents]);

  return (
    <Table
      columns={columns}
      currentPage={currentPage}
      customCellRenders={makeCustomCellRenders()}
      data={documents || []}
      hiddenColumns={hiddenColumns}
      loading={loading}
      openDetailedView={openDetailedView}
      order={order}
      orderBy={orderBy}
      rowsCount={rowsCount}
      rowsPerPage={rowsPerPage}
      selection={selected}
      title={formatMessage({ id: 'Documents' })}
      updateCurrentPage={updatePage}
      updateHiddenColumns={setHiddenColumns}
      updateOrder={updateOrder}
      updateOrderBy={updateOrderBy}
      updateRowsPerPage={updateRowsPerPage}
      updateSelection={updateSelected}
    />
  );
};

DocumentsTable.propTypes = {
  currentPage: PropTypes.number.isRequired,
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
    }),
  ),
  loading: PropTypes.bool.isRequired,
  openDetailedView: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string,
  rowsCount: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  selected: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.number.isRequired,
      PropTypes.string.isRequired,
    ]),
  ).isRequired,
  updateOrder: PropTypes.func.isRequired,
  updateOrderBy: PropTypes.func.isRequired,
  updatePage: PropTypes.func.isRequired,
  updateRowsPerPage: PropTypes.func.isRequired,
  updateSelected: PropTypes.func.isRequired,
};

export default DocumentsTable;
