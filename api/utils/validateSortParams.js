/**
 * Sentinel value returned by validateSortParams when a 400 response has
 * already been sent.  Using a named constant avoids fragile string
 * comparisons in callers.
 */
const VALIDATION_ERROR = Symbol.for('validateSortParams.error');

const SORTABLE_COLUMNS = [
  'entrance_name',
  'date_of_update',
  'general_latest_date_of_update',
  'general_nb_contributions',
  'location_latest_date_of_update',
  'location_nb_contributions',
  'description_latest_date_of_update',
  'description_nb_contributions',
  'document_latest_date_of_update',
  'document_nb_contributions',
  'rigging_latest_date_of_update',
  'rigging_nb_contributions',
  'history_latest_date_of_update',
  'history_nb_contributions',
  'comment_latest_date_of_update',
  'comment_nb_contributions',
  'country_name',
  'massif_name',
];

/**
 * Columns available in the country and region queries.
 * These queries use explicit SELECT lists that do NOT include massif_name.
 */
const SORTABLE_COLUMNS_COUNTRY = SORTABLE_COLUMNS.filter(
  (c) => c !== 'massif_name'
);

const VALID_ORDERS = ['asc', 'desc'];

/**
 * Extracts and validates `sort` and `order` query parameters from the request.
 *
 * @param {Object} req - Sails request object
 * @param {Object} res - Sails response object
 * @param {string[]} [allowedColumns=SORTABLE_COLUMNS] - per-endpoint allow-list
 * @returns {{ sort: string, order: string } | null | symbol}
 *   - { sort, order } when a valid sort column is provided
 *   - null when no sort is provided (order is ignored)
 *   - VALIDATION_ERROR when a 400 response has already been sent
 */
const validateSortParams = (req, res, allowedColumns = SORTABLE_COLUMNS) => {
  const sort = req.param('sort');
  const order = req.param('order');

  // No sort parameter — ignore order even if present
  if (sort === undefined || sort === null) {
    return null;
  }

  // Validate sort column against allow-list (case-insensitive)
  const sortLower = sort.toString().toLowerCase();
  if (!allowedColumns.includes(sortLower)) {
    res.badRequest(
      `Invalid sort column '${sort}'. Valid columns: ${allowedColumns.join(', ')}`
    );
    return VALIDATION_ERROR;
  }

  // Default order to 'asc' when absent
  if (order === undefined || order === null) {
    return { sort: sortLower, order: 'asc' };
  }

  // Validate order direction (case-insensitive)
  const orderLower = order.toString().toLowerCase();
  if (!VALID_ORDERS.includes(orderLower)) {
    res.badRequest(`Invalid order value '${order}'. Must be 'asc' or 'desc'`);
    return VALIDATION_ERROR;
  }

  return { sort: sortLower, order: orderLower };
};

module.exports = {
  SORTABLE_COLUMNS,
  SORTABLE_COLUMNS_COUNTRY,
  VALID_ORDERS,
  VALIDATION_ERROR,
  validateSortParams,
};
