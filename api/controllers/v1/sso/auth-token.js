const SsoService = require('../../../services/SsoService');

module.exports = async (req, res) => {
  const { product } = req.body || {};

  // req.token only has { id, groups, nickname } — fetch full caver for name/surname
  const caver = await TCaver.findOne({ id: req.token.id });
  if (!caver) {
    return res.forbidden('Access denied.');
  }

  const result = SsoService.issueToken(caver, product);

  if (result.error) {
    if (result.status === 500) {
      return res.serverError(result.error);
    }
    return res.badRequest(result.error);
  }

  const params = { controllerMethod: 'SsoController.authToken' };
  return ControllerService.treat(
    req,
    null,
    { token: result.token },
    params,
    res
  );
};
