/* eslint-disable no-param-reassign */
/**
 * 401 (Unauthorized) Handler
 *
 * Usage:
 * return res.unauthorized();
 * return res.unauthorized(err);
 * return res.unauthorized(err, 'some/specific/unauthorized/view');
 *
 * e.g.:
 * ```
 * return res.unauthorized('Unauthorized.');
 * ```
 */

module.exports = function unauthorized(data, options) {
  // Get access to `req`, `res`, & `sails`
  const { req } = this;
  const { res } = this;
  const sails = req._sails; // eslint-disable-line no-underscore-dangle

  // Set status code
  res.status(401);

  // Log error to console
  if (data !== undefined) {
    sails.log.verbose('Sending 401 ("Unauthorized") response: \n', data);
  } else sails.log.verbose('Sending 401 ("Unauthorized") response');

  // Only include errors in response if application environment
  // is not set to 'production'.  In production, we shouldn't
  // send back any identifying information about errors.
  if (sails.config.environment === 'production') {
    data = undefined;
  }

  // If the user-agent wants JSON, always respond with JSON
  if (req.wantsJSON) {
    // If data is a plain string, cast it to json with a message key
    if (typeof data === 'string') {
      return res.json({ message: data });
    }
    return res.json(data);
  }

  // If second argument is a string, we take that to mean it refers to a view.
  // If it was omitted, use an empty object (`{}`)
  options = typeof options === 'string'
    ? {
      view: options,
    }
    : options || {};

  // If a view was provided in options, serve it.
  // Otherwise try to guess an appropriate view, or if that doesn't
  // work, just send JSON.
  if (options.view) {
    return res.view(options.view, {
      data,
    });
  }
  // TODO add WWW-Authenticate header field

  // If no second argument provided, try to serve the default view,
  // but fall back to sending JSON(P) if any errors occur.
  return res.view(
    '401',
    {
      data,
    },
    (err, html) => {
      // If a view error occured, fall back to JSON(P).
      if (err) {
        //
        // Additionally:
        // • If the view was missing, ignore the error but provide a verbose log.
        if (err.code === 'E_VIEW_FAILED') {
          sails.log.verbose(
            'res.unauthorized() :: Could not locate view for error page (sending JSON instead).  Details: ',
            err,
          );
        } else {
          // Otherwise, if this was a more serious error, log to the console with the details.
          sails.log.warn(
            'res.unauthorized() :: When attempting to render error page view, an error occured (sending JSON instead).  Details: ',
            err,
          );
        }
        return res.json(data);
      }

      return res.send(html);
    },
  );
};
