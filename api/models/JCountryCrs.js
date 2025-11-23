module.exports = {
  tableName: 'j_country_crs',
  attributes: {
    country: {
      model: 'TCountry',
      columnName: 'id_country',
    },
    crs: {
      model: 'TCrs',
      columnName: 'id_crs',
    },
  },
};
