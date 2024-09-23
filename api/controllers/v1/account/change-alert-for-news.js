module.exports = async (req, res) => {
  const newAlertForNewsValue = req.param('alertForNews');
  if (newAlertForNewsValue !== 'true' && newAlertForNewsValue !== 'false') {
    return res.badRequest(
      "You must provide an alertForNews value ('true' or 'false')."
    );
  }

  const updatedCaver = await TCaver.updateOne({ id: req.token.id }).set({
    alertForNews: newAlertForNewsValue === 'true',
  });

  if (!updatedCaver) {
    return res.notFound({
      message: `Caver with id ${req.token.id} not found.`,
    });
  }

  return res.ok();
};
