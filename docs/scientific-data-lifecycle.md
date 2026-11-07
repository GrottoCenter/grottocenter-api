# Scientific data and the cave lifecycle

Points (`t_point`) and observations (`t_observation`) reference a cave through
`id_cave`. An observation may also reference a point (`id_point`); the import
sets both. Entrance moves, cave merges and cave deletions keep these references
consistent (#1982). The logic lives in `api/services/CaveLifecycleService.js`
and is called by `PATCH /entrances/{entranceId}/cave/{caveId}` and by
`CaveService.permanentlyDeleteCave()` (cave and entrance permanent deletes).

## Rules

| Operation                                      | Points and observations of cave A                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| Move the last entrance of A to B               | Transferred to B, then A is soft-deleted with `redirect_to = B`.          |
| Move an entrance while A keeps other entrances | Stay on A: which of them belong to the moved entrance cannot be inferred. |
| Soft-delete A                                  | Untouched, so restoring A finds them back.                                |
| Permanently merge A into B                     | Transferred to B, then A is physically deleted.                           |
| Permanently delete A without a target          | Detached (`id_cave = NULL`), then A is physically deleted.                |

- Soft-deleted points and observations are transferred or detached too: their
  rows still reference A and would block its physical deletion.
- Only `id_cave` changes. Point and observation ids, the observation → point
  link, coordinates, `is_underground`, time series, measurements and documents
  are kept. The denormalized `t_observation.cave_name` and `point_label` are
  snapshots taken at import time and are not rewritten: never read them as the
  current association.
- Points sharing a label are never merged. After a merge, a cave can hold
  several points with the same label (see _Imports_ below).
- No scientific record is ever deleted by these operations.

## Detached records

A detached point has `caveId: null` (and `entrance: null`, `network: null` once
the association contract of #1978 is in place). It:

- is returned by `GET /points/{id}` and by `GET /points` without `caveId`, under
  the usual rules (soft-deleted points stay hidden);
- is no longer returned by `GET /points?caveId=…` for its former cave;
- can be edited and reassociated with `PATCH /points/{id}` (`caveId`).
  Detaching changes nothing but `id_cave`: no coordinates or placeholder are
  made up, and a point that could be edited before can still be edited.

A detached observation keeps its point when it had one. An observation recorded
directly on the cave, without a point, is left with neither. The database
allows that state since `sql/9_38_2026_11_07_observation_detached.sql`, which
drops the CHECK `t_observation_point_or_cave`. Creating a new observation still
requires a cave or a point label: that rule is enforced by the import
validation (`ProfileValidator`), not by the database.

Front end: show a detached point without a cave or network (do not fall back
on a historical cave name), and offer the cave picker of the point edit form to
reassociate it.

## Concurrency

Every lifecycle operation locks the caves it changes (`SELECT … FOR UPDATE`, in
id order) in the same transaction as the entrance move, the reference updates,
the redirect and the deletion. Every writer of a scientific cave reference
(point creation and update, observation import) locks the cave it references
with `lockCaveForScientificWrite()` (`FOR SHARE`) on its own transaction and
refuses a deleted cave. Either the writer commits first and its new reference is
transferred or detached with the others, or it waits and then finds the cave
deleted (400) or gone.

## Imports

`POST /observations/import` reuses the non-deleted point carrying `pointLabel` in
the profile's cave. When several points match, which can happen after a merge,
the import is refused with `409 IMPORT_CONFLICT_ERROR` and the ids of the
candidates, instead of picking one. Importing by point id is #1660.

## Deployment

Production migrations are applied by hand. Apply
`sql/9_38_2026_11_07_observation_detached.sql` **before** deploying the API
that detaches observations: the previous API never writes such a row, so the
migration is safe ahead of the code, whereas the code without the migration
fails (and rolls back) on a permanent delete of a cave holding an observation
without a point.
