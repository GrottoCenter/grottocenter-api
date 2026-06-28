const MAX_IDS = 1000;

module.exports = async (req, res) => {
  const rawIds = req.body && Array.isArray(req.body.ids) ? req.body.ids : [];

  if (rawIds.length > 0) {
    // Validate that all provided IDs are positive integers
    const allValid = rawIds.every((id) => Number.isInteger(id) && id > 0);
    if (!allValid) {
      return res.badRequest('ids must be an array of positive integers.');
    }

    // De-duplicate so that repeated IDs don't cause a false 403
    const ids = [...new Set(rawIds)];

    if (ids.length > MAX_IDS) {
      return res.badRequest(
        `ids array exceeds the maximum allowed length of ${MAX_IDS}.`
      );
    }

    // Verify ownership: all requested IDs must belong to the authenticated user.
    // Returns 403 for both "not yours" and "doesn't exist" to prevent ID enumeration.
    const ownedCount = await TNotification.count({
      id: { in: ids },
      notified: req.token.id,
    });

    if (ownedCount !== ids.length) {
      return res.forbidden(
        'You cannot mark as read notifications that do not belong to you.'
      );
    }

    // Batch update only the unread ones
    await TNotification.update({
      id: { in: ids },
      dateReadAt: null,
    }).set({ dateReadAt: new Date() });
  } else {
    // Mark all unread notifications for the authenticated user as read
    await TNotification.update({
      notified: req.token.id,
      dateReadAt: null,
    }).set({ dateReadAt: new Date() });
  }

  return res.status(204).send();
};
