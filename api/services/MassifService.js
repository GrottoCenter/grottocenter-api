const FIND_NETWORKS_IN_MASSIF = `
  SELECT c.*
  FROM t_entrance AS e
  LEFT JOIN t_cave c ON c.id = e.id_cave
  WHERE c.is_deleted = false
  AND c.id_massif = $1
  GROUP BY c.id
  HAVING count(e.id_cave) > 1
`;

module.exports = {
  setNetworks: async (massif) => {
    const queryResult = await CommonService.query(FIND_NETWORKS_IN_MASSIF, [
      massif.id,
    ]);
    if (!queryResult || queryResult.rowCount === 0) {
      return [];
    }

    // Build TCave model
    const networkIds = queryResult.rows.map((r) => r.id);
    const networks = await TCave.find({ id: { in: networkIds } });
    massif.networks = networks;
  },
};
