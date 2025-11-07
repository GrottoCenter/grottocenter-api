const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const { countryId } = req.params;
  const { regionId } = req.params;

  // Find ISO 3166-2 region by ID (format: countryId-regionId, e.g., US-CA)
  const isoCode = `${countryId}-${regionId}`;

  try {
    const region = await TISO31662.findOne({ id: isoCode });
    if (!region) {
      return res.notFound({ message: `Region with id ${isoCode} not found.` });
    }

    return ControllerService.treat(
      req,
      null,
      region,
      {
        controllerMethod: 'TISO31662Controller.findByCountry',
        searchedItem: `Region ${isoCode}`,
      },
      res
    );
  } catch (err) {
    return ControllerService.treat(
      req,
      err,
      null,
      {
        controllerMethod: 'TISO31662Controller.findByCountry',
        searchedItem: `Region ${isoCode}`,
      },
      res
    );
  }
};
