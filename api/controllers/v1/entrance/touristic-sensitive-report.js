const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // AC-5.2: only administrators can access this report
  const isAdmin = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!isAdmin) {
    return res.forbidden('Only administrators can perform this action.');
  }

  // AC-5.1: find entrances where both flags are true
  const query = `
    SELECT e.id, e.is_sensitive, e.is_touristic, n.name
    FROM t_entrance e
    LEFT JOIN t_name n ON n.id_entrance = e.id AND n.is_main = true AND n.is_deleted = false
    WHERE e.is_sensitive = true
    AND e.is_touristic = true
    AND e.is_deleted = false
    ORDER BY e.id
  `;

  try {
    const result = await CommonService.query(query, []);
    // AC-5.3: returns empty array when no conflicts exist
    return ControllerService.treat(
      req,
      null,
      {
        count: result.rows.length,
        entrances: result.rows.map((r) => ({
          id: r.id,
          name: r.name,
          isSensitive: r.is_sensitive,
          isTouristic: r.is_touristic,
        })),
      },
      { controllerMethod: 'EntranceController.touristic-sensitive-report' },
      res
    );
  } catch (err) {
    sails.log.error('Error fetching touristic-sensitive report:', err);
    return res.serverError(err);
  }
};
