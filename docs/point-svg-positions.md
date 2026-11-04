# Point positions on SVG documents

A point (`t_point`) can be drawn on several SVG documents at once, for instance
a plan and a section of the same cave. Each position is a row of
`j_point_document_position`: `(id_point, id_document, x, y)`, unique per point
and document.

| Endpoint                                     | Purpose                                     |
| -------------------------------------------- | ------------------------------------------- |
| `PUT /api/v1/points/:id/positions/:docId`    | Create or replace one position (idempotent) |
| `DELETE /api/v1/points/:id/positions/:docId` | Remove that position only                   |
| `GET /api/v1/points/:id/positions`           | List a point's positions (`page`, `size`)   |
| `GET /api/v1/documents/:id/points`           | The markers to draw on one document         |

`GET /api/v1/points/:id` returns the first 20 positions and `positionCount`.

Positions are separate from the documents **attached** to a point
(`t_document.id_point`, `PUT /api/v1/points/:id/documents/:docId`): a photo can
document a point without the point being drawn on it.

## The reference frame is fixed per document

`x` and `y` are stored against the **document**, not against one of its files.
They are in the user units of the document's SVG `viewBox`: the frontend uses
them directly as `cx`/`cy`. The backend stores no width, height or transform.

For the stored positions to stay valid, the reference frame of a document never
changes:

- A replacement SVG (a new file validated in place of the old one) keeps the
  same origin, units and orientation, and the same correspondence between
  coordinates and the locations they represent.
- Every SVG file used for positioning within one document shares that frame.
- An unchanged `viewBox` is not enough: redrawing the survey at another scale,
  shifting it, or flipping an axis inside the same `viewBox` moves every point.

A survey redrawn in a different frame is a new document; its points are
positioned on it afresh. There is no reference-file field and no restriction on
replacing a document's SVG: the invariant is a contract on the content of the
files.

When a document is permanently deleted or merged into another one, its
positions are removed: their coordinates mean nothing in another document's
frame. Soft-deleting a document hides its positions without removing them.

## Underground and geographic location

`t_point.is_underground` is `true` underground, `false` at the surface, and
`NULL` for points created before the flag existed. Those are not classified
from their cave or their coordinates: they stay `null` until a user sets the
flag through `PATCH /api/v1/points/:id`, and cannot be set back to `null`. A new
point must state it.

`latitude` and `longitude` are a complete pair or both `null`, finite and within
±90 / ±180, and required for a surface point. `PATCH` validates the point that
results from the stored values and the fields sent.
