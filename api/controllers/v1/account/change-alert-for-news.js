module.exports = async (req, res) => {
  // Check params
  const newAlertForNewsValue = req.param('alertForNews');
  if (newAlertForNewsValue !== 'true' && newAlertForNewsValue !== 'false') {
    return res.badRequest(
      "You must provide an alertForNews value ('true' or 'false')."
    );
  }

  // Update alertForNews request
  try {
    const updatedCaver = await TCaver.updateOne({
      id: req.token.id,
    }).set({
      alertForNews: newAlertForNewsValue === 'true',
    });
    if (!updatedCaver) {
      return res.notFound({
        message: `Caver with id ${req.token.id} not found.`,
      });
    }
  } catch (error) {
    sails.log.error(error);
  }

  return res.ok();
};
