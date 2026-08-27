# Permission Management System

## Overview

Grottocenter API implements a **Role-Based Access Control (RBAC) Level 1** system where users are assigned to roles and permissions are checked based on role membership. The system uses a combination of route-level policies and controller-level permission checks.

## User Roles

Roles are **not hierarchical**; for instance, an Administrator does not automatically inherit all permissions of a Moderator, nevertheless, **a user can be assigned multiple roles** cumulating their permissions.

### 1. **Visitor** (Anonymous Users)
- **Description**: Non-authenticated users
- **Permissions**:
  - View public cave/entrance/document/organisation/massif/person data
  - Search through cave/entrance/document/organisation/massif/person/device data
  - View legislation guidelines (list, by geographic entity, and snapshots)
  - View the organizations responsible for a country/region/massif
  - View complete entity history
  - View statistics
  - View all organization details
  - Access API documentation
  - Access API within the rate limits

### 2. **User** (Authenticated Users)
- **Description**: Default authenticated users role
- **Permissions**: All Visitor permissions plus:
  - **Content Management**:
    - Create caves, entrances, documents, massifs, organisations, comments, descriptions, locations, riggings, histories
    - Create legislation guidelines
    - Edit caves, entrances, documents, massifs, organisations, descriptions, locations, riggings, histories
    - Edit own comments
    - Edit own legislation guidelines
    - Unlink documents from entities
    - Rollback to a previous version of any content, except guidelines (own only)
    - Associate/dissociate responsible organizations for any country, region, or massif
    - Add/remove own explored entrances
    - Set main name for entities
  - **Scientific Data Management**:
    - Create devices and sensor configurations
    - Update own devices and sensor configurations
    - Import observation data (CSV/TSV)
  - **Messaging**:
    - Send and receive private messages
    - View, archive, and unarchive own conversations only
    - Read messages only in conversations where the user is a participant
  - **Notifications**:
    - View own notifications
    - Mark notifications as read
  - **Personal Management**:
    - Manage personal profile and settings
    - Join/leave organizations (own membership only)
  - **Organization Membership**:
    - Manage own organization memberships
    - Manage explored caves for organizations they belong to

### 3. **Leader** (Regional Leaders)
- **Description**: Contributors that others can refer to for questions
- **Permissions**: All User permissions plus:
  - **Regional Management**:
    - Subscribe/unsubscribe to country notifications
    - Subscribe/unsubscribe to massif notifications
    - Subscribe/unsubscribe to region notifications
  - **Data Export**:
    - Download full database export

### 4. **Moderator** (Content Reviewers)
- **Description**: Content reviewers and validators
- **Permissions**: All User permissions plus:
  - **Content Moderation**:
    - Delete/restore any caves, entrances, documents, comments, descriptions, locations, riggings, histories, organisations, massifs
    - **Permanently** delete those same entities — the permanent path reuses the Moderator check with no additional
      Administrator gate (see "Known Permission Inconsistencies")
    - Delete/restore legislation guidelines (permanent deletion of these requires Administrator)
    - Delete/restore devices and sensor configurations (permanent deletion of these requires Administrator)
    - Update any device or sensor configuration (regardless of ownership)
    - Update any user's comments
    - Update/rollback any user's legislation guidelines
    - Update documents that have modifications pending moderator approval
    - Validate documents
    - Manage duplicates (documents and entrances)
  - **Advanced Access**:
    - View deleted content
    - Access moderation tools and interfaces
  - **Explored Cave Management**:
    - Add/remove explored caves for any organization

### 5. **Administrator** (System Administrators)
- **Description**: Technical responsible for the application
- **Permissions**: All User permissions plus:
  - **User Management**:
    - Assign/remove user roles
    - Manage any user accounts
    - Delete user accounts
    - Ban/unban users (revokes all active tokens)
    - View user lists (authors, contributors, users, banned, invalid-email)
    - View complete user information
    - Cancel any user's subscriptions
  - **MFA Management**:
    - Enroll MFA (generate TOTP secret)
    - Verify MFA enrollment (activate TOTP)
    - Reset MFA (requires password re-entry)
  - **System Operations**:
    - Import data from CSV files (documents and entrances)
    - System configuration and maintenance
  - **Content Moderation** (guidelines only; other content moderation is Moderator-only):
    - Update/rollback any user's legislation guidelines
    - Delete/restore legislation guidelines
  - **Sensitive Data Management**:
    - View coordinates of sensitive entrances
    - Remove sensitive flag from entrances
    - Modify coordinates of sensitive entrances
    - Mark/unmark massifs as sensitive (cascades to contained entrances)
    - Preview massif sensitivity impact
  - **Permanent Deletion**:
    - Permanently delete devices, sensor configurations, and legislation guidelines
    - **Not** core content: permanently deleting caves, entrances, documents, comments, descriptions, locations,
      riggings, histories, organisations, or massifs requires the Moderator role, not Administrator (see "Known
      Permission Inconsistencies")
  - **Advanced Organization Management**:
    - Add/remove explored caves for any organization
    - Manage organization memberships for any user

## Comprehensive Permission Matrix

| Action                                                        | Visitor | User | Leader | Moderator | Administrator |
|---------------------------------------------------------------|---------|------|--------|-----------|---------------|
| **Public Data Access**                                        |
| View public cave/entrance/document/organisation/massif/person | ✅ | ✅ | ✅ | ✅ | ✅ |
| View non-sensitive coordinates                                | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search content (including devices)                            | ✅ | ✅ | ✅ | ✅ | ✅ |
| View statistics                                               | ✅ | ✅ | ✅ | ✅ | ✅ |
| View history/snapshots                                        | ✅ | ✅ | ✅ | ✅ | ✅ |
| View guidelines (list/by-entity/snapshots)                    | ✅ | ✅ | ✅ | ✅ | ✅ |
| View responsible organizations of country/region/massif       | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Content Creation**                                          |
| Create caves/entrances/documents/organisations/massifs        | ❌ | ✅ | ✅ | ✅ | ✅ |
| Create comments/descriptions/locations/riggings/histories     | ❌ | ✅ | ✅ | ✅ | ✅ |
| Create guidelines                                             | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Content Modification**                                      |
| Update caves/entrances/documents/organisations/massifs        | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update descriptions/locations/riggings/histories              | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update own comments                                           | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update any comment                                            | ❌ | ❌ | ❌ | ✅ | ❌ |
| Update/rollback own guidelines                                | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update/rollback any guideline                                 | ❌ | ❌ | ❌ | ✅ | ✅ |
| Set main name for entities                                    | ❌ | ✅ | ✅ | ✅ | ✅ |
| Move entrance to another cave                                 | ❌ | ✅ | ✅ | ✅ | ✅ |
| Reorder descriptions/locations/riggings/histories/comments    | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Soft-deleted Content Management**                           |
| Soft delete core content (caves/entrances/documents/etc.)     | ❌ | ❌ | ❌ | ✅ | ❌ |
| View soft-deleted content                                     | ❌ | ❌ | ❌ | ✅ | ❌ |
| Restore core content (caves/entrances/documents/etc.)         | ❌ | ❌ | ❌ | ✅ | ❌ |
| Soft delete/restore guidelines                                | ❌ | ❌ | ❌ | ✅ | ✅ |
| Permanently delete core content (caves/entrances/docs/etc.)   | ❌ | ❌ | ❌ | ✅ | ❌ |
| Permanently delete guidelines                                 | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Document Management**                                       |
| Validate documents                                            | ❌ | ❌ | ❌ | ✅ | ❌ |
| Manage document duplicates                                    | ❌ | ❌ | ❌ | ✅ | ❌ |
| Unlink documents from entities                                | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update a document with modifications pending approval         | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Scientific Domain (Devices, Sensors, Observations)**        |
| View device/sensor configuration details                      | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search devices                                                | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create devices/sensor configurations                          | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update own devices/sensor configurations                      | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update any device/sensor configuration                        | ❌ | ❌ | ❌ | ✅ | ✅ |
| Soft delete devices/sensor configurations                     | ❌ | ❌ | ❌ | ✅ | ✅ |
| Restore devices/sensor configurations                         | ❌ | ❌ | ❌ | ✅ | ❌ |
| Permanently delete devices/sensor configurations              | ❌ | ❌ | ❌ | ❌ | ✅ |
| Import observation data                                       | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Organization Management**                                   |
| Join/leave own organizations                                  | ❌ | ✅ | ✅ | ✅ | ✅ |
| Revoke any user's organization membership                     | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Responsible Organization Associations**                     |
| Associate organization with country/region/massif             | ❌ | ✅ | ✅ | ✅ | ✅ |
| Dissociate organization from country/region/massif            | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Explored Cave Management**                                  |
| Add/remove explored caves (own orgs)                          | ❌ | ✅ | ✅ | ✅ | ✅ |
| Add/remove explored caves (any org)                           | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Messaging**                                                 |
| Send/receive private messages                                 | ❌ | ✅ | ✅ | ✅ | ✅ |
| View/archive/unarchive own conversations                      | ❌ | ✅ | ✅ | ✅ | ✅ |
| View another user's conversations                             | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Notifications**                                             |
| View and manage own notifications                             | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Subscriptions**                                             |
| Subscribe to country/massif/region                            | ❌ | ❌ | ✅ | ❌ | ❌ |
| Cancel any user's subscriptions                               | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Sensitive Data Access**                                     |
| View sensitive entrance coordinates                           | ❌ | ❌ | ❌ | ❌ | ✅ |
| Modify sensitive entrance coordinates                         | ❌ | ❌ | ❌ | ❌ | ✅ |
| Remove sensitive flag from entrances                          | ❌ | ❌ | ❌ | ❌ | ✅ |
| Mark/unmark massif as sensitive                               | ❌ | ❌ | ❌ | ❌ | ✅ |
| Preview massif sensitivity impact                             | ❌ | ❌ | ❌ | ❌ | ✅ |
| **User Management**                                           |
| View user lists (authors, contributors, users)                | ❌ | ❌ | ❌ | ❌ | ✅ |
| View banned users list                                        | ❌ | ❌ | ❌ | ❌ | ✅ |
| Ban/unban users                                               | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage user roles                                             | ❌ | ❌ | ❌ | ❌ | ✅ |
| Delete user accounts                                          | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Authentication & MFA**                                      |
| Enroll MFA (generate TOTP secret)                             | ❌ | ❌ | ❌ | ❌ | ✅ |
| Verify MFA enrollment                                         | ❌ | ❌ | ❌ | ❌ | ✅ |
| Reset own MFA                                                 | ❌ | ❌ | ❌ | ❌ | ✅ |
| **System Operations**                                         |
| Import data from CSV (documents/entrances)                    | ❌ | ❌ | ❌ | ❌ | ✅ |
| Download full database export                                 | ❌ | ❌ | ✅ | ❌ | ❌ |

## Special Permission Cases

### Sensitive Entrance Data
- **Coordinates**: Only Administrators can view coordinates of sensitive entrances
- **Locations**: Sensitive entrance location descriptions are hidden from non-Administrators
- **Modification**: Only Administrators can remove the sensitive flag or modify coordinates of sensitive entrances
- **Creation**: Any authenticated user can mark an entrance as sensitive, but coordinates are then hidden from their own
  view
- **Restriction**: Once marked as sensitive, only Administrators can unmark an entrance (remove the sensitive flag)

### Massif Sensitivity
- **Mark sensitive**: Only Administrators can mark a massif as sensitive, which cascades to all non-sensitive entrances contained within it
- **Unmark sensitive**: Only Administrators can unmark a massif (does not cascade removal to individual entrances)
- **Preview**: Only Administrators can preview how many entrances would be affected by marking a massif as sensitive

### Organization-Based Permissions
- **Membership Management**: Users can only manage their own organization memberships
- **Explored Cave Management**: Organization members can add/remove explored caves for organizations they belong to
- **Administrative Override**: Moderators and Administrators can manage any organization's explored caves and
  memberships

### Legislation Guidelines
Guidelines are legal/regulatory notes attached to one or more geographic entities (country, region, massif).

- **Read**: Fully public — list, by-entity lookup, and snapshots require no authentication
- **Create**: Any authenticated user; no role check. At least one country, region, or massif must be referenced
- **Update**: Author, Moderator, or Administrator only — unlike most content, a plain user cannot edit another user's
  guideline
- **Rollback**: Same rule as update (rollback mutates title/description/language, so it is treated as an update).
  Guidelines are currently the only entity exposing a rollback route
- **Soft delete/restore**: Moderator or Administrator only — the author alone cannot delete their own guideline
- **Permanent delete**: Administrator only, via `?isPermanent=1`. Performed as a two-phase delete that first clears the
  country/region/massif junction rows and history
- **Asymmetry to note**: authorship grants edit rights but not delete rights, so an author can amend their guideline but
  must ask a Moderator to remove it

### Responsible Organization Associations
Countries, regions, and massifs can be linked to the organizations in charge of managing them and their caves.

- **Read**: Public — associated organizations are returned inline by `v1/country/find`, `v1/massif/find`, and
  `v1/region/find-by-country` (note: `v1/region/find` does not include them)
- **Associate/dissociate**: Any authenticated user; gated only by the `tokenAuth` and `validateId` policies, with no
  role check and no organization-membership check in the controllers or `GeoAssociationService`
- **Not ownership-scoped**: unlike explored-cave management, a user does **not** need to belong to the organization
  being associated
- **Attribution**: the acting user is recorded as `author` on creation and as `reviewer` on re-association; removal is
  not attributed
- **Soft-deleted organizations**: cannot be newly associated (the lookup filters on `isDeleted: false`), but existing
  associations are still returned by reads, flagged with `isDeleted` and a `redirectTo` pointer

### Owner-Based Access Control
- **Content Ownership**: Users can modify any content except other users' comments and other users' guidelines
- **Moderator Override**: Moderators and Administrators can modify any content regardless of ownership
- **Comment Updates**: Users can update their own comments; Moderators can update any comments
- **Guideline Updates**: Users can update and roll back only their own guidelines; Moderators and Administrators can
  update and roll back any guideline

### Snapshot and History Access
- **Public History**: Available to all users for non-sensitive content
- **Sensitive History**: Historical data for sensitive entrances requires Administrator privileges

### Scientific Domain Access
- **Devices**: Any authenticated user can create devices; update requires ownership or Moderator role; soft delete requires Moderator or Administrator; restore requires Moderator; permanent delete requires Administrator
- **Sensor Configurations**: Same permission model as devices — scoped under a device (nested resource)
- **Observation Import**: Any authenticated user can import observation data via CSV/TSV. `v1/observation/import` is
  gated by `tokenAuth` alone — neither the controller nor `ObservationImportService` performs a role check, so a plain
  User can bulk-create observation entities (up to a 100 MB file). **This openness is intended**: observation upload is
  a core contributor workflow, unlike the document/entrance CSV imports, which are admin-driven and require the
  Administrator role. Do not "fix" the missing role check here
- **Owner-based update**: The original author of a device or sensor configuration can update it; Moderators can update any device or sensor configuration regardless of ownership

### Ban/Unban
- Only Administrators can ban or unban users
- Banning a user revokes all their active JWT tokens immediately
- A user cannot ban themselves

### MFA (Multi-Factor Authentication)
- MFA is restricted to Administrators only — both `enroll` and `reset` check for Administrator role
- Enrollment and verification use a dedicated `mfaEnrollmentAuth` policy with a restricted token (subject `MfaEnrollment`)
- The `verify` endpoint doesn't have an explicit role check, but it's gated by the MFA enrollment token which is only issued during the admin enrollment flow
- MFA reset requires a standard `tokenAuth` (full authentication token) plus Administrator role plus password re-entry to prevent stolen-token abuse

## Security Features

### JWT Token Authentication
- All authenticated endpoints require valid JWT tokens
- Tokens contain user ID and role memberships
- Tokens are validated by the `tokenAuth` policy
- Tokens can be revoked via the ban mechanism (iat-based blacklist)

### Token Blacklist
- Backed by `t_token_blacklist` table with in-memory cache
- Stores a `revoked_before` timestamp per user
- Tokens with `iat < revoked_before` are considered revoked
- Used by the ban system to invalidate all tokens for a user

### MFA Enrollment Tokens
- Separate token type with subject `MfaEnrollment`
- Only accepted by MFA-specific endpoints (`enroll`, `verify`)
- Full authentication tokens are rejected by MFA enrollment endpoints
- Only Administrators can initiate the enrollment flow

### Ownership-Based Access
- Users can modify their own content
- Moderators and Administrators can override ownership
- Organization members can manage their organization's explored caves

### Sensitive Data Protection
- Sensitive entrance coordinates are hidden from everyone except Administrators
- Only Administrators can modify sensitive entrance coordinates
- Massif-level sensitivity cascades to contained entrances

### Soft Deletes
- Content is soft-deleted (marked as deleted, not removed)
- **Who may delete/restore depends on the entity** — there is no single rule, because roles are not hierarchical:
  - **Core content** (caves, entrances, documents, comments, descriptions, locations, riggings, histories,
    organisations, massifs): the controllers check `MODERATOR` only, so an Administrator who does not also hold the
    Moderator role cannot soft-delete or restore them
  - **Cavers, devices, sensor configurations, guidelines**: accept either Moderator or Administrator
  - **Restore** is Moderator-only for every entity except guidelines
- **Permanent deletion is not uniformly Administrator-only**:
  - For core content, the permanent path (`?isPermanent=…`) is guarded by the *same* Moderator check as the soft
    delete, with no additional Administrator check — so a Moderator can permanently delete a cave, and an
    Administrator alone cannot
  - Only devices, sensor configurations, and guidelines re-check for the Administrator role before hard-deleting
  - See "Known Permission Inconsistencies" below
- Permanent deletion of devices is blocked if they have associated sensor configurations
- Permanent deletion of sensor configurations is blocked if they have associated time series

## Known Permission Inconsistencies

These record **current observed behaviour**. They follow from the fact that roles are not hierarchical (see "User Roles")
combined with per-controller role checks that were not applied uniformly — so a capability that reads as
"administrative" may in fact be gated on the Moderator group alone.

Items 1, 4 and 5 are tracked in
[#1796](https://github.com/GrottoCenter/grottocenter-api/issues/1796). Items 2 and 3 are **accepted behaviour**: in
practice Administrators are granted every group, so they cumulate Moderator powers and are not blocked.

1. **Moderators can permanently delete core content.** For caves, entrances, documents, comments, descriptions,
   locations, riggings, histories, organisations, and massifs, the `isPermanent` branch of the delete controller is
   reached after only a `MODERATOR` check — for example `api/controllers/v1/cave/delete.js` checks `MODERATOR` at the
   top and then acts on `req.param('isPermanent')` with no further gate. Devices, sensor configurations, and guidelines
   do re-check for `ADMINISTRATOR`. This is the widest gap in the model — a Moderator can irreversibly destroy core
   content while a non-Moderator Administrator cannot delete it at all. Tracked in #1796.
2. **Administrators cannot moderate core content** — *accepted, not a defect.* An Administrator who does not also hold
   the Moderator role receives a 403 when soft-deleting or restoring core content, validating a document, or managing
   duplicates. Administrators are normally granted all groups, so they cumulate Moderator powers in practice. The matrix
   marks these ❌ for Administrator because it records what each role grants **on its own**.
3. **Administrators cannot see soft-deleted content** — *accepted, same reasoning as #2.* The `find` controllers for
   caves, entrances, documents, massifs, and organisations check `MODERATOR` only before revealing deleted records; a
   non-Moderator Administrator gets the redacted `toDeletedEntity` shape, and `cave/find.js` additionally forces
   `isDeleted = false` on list queries.
4. **Restore is Moderator-only almost everywhere.** 12 of 13 restore controllers check `MODERATOR` alone; guideline is
   the outlier, accepting either role. Tracked in #1796.
5. **Delete and restore disagree within the same entity.** `device`, `sensor-configuration` and `guideline` all accept
   either role to *delete*, but only `guideline` accepts either role to *restore*. Tracked in #1796.

If any of these are corrected in code, update the matrix rows and the "Soft Deletes" section together.

## Architecture

### Three-Layer Permission Model

1. **Route Level** (`config/policies.js`)
- `false` - Blocked (default)
- `true` - Public access (no authentication required)
- `'tokenAuth'` - Requires valid JWT token
- `'mfaEnrollmentAuth'` - Requires valid MFA enrollment token
- `['validateId']` - Public access with ID validation
- `['validateId', 'tokenAuth']` - Authenticated with ID validation
- `['tokenAuth', 'validateId']` - Same pair in the opposite order, used by the responsible-organization association
  routes. Policies run in sequence, so the order decides which rejection an unauthenticated request with a malformed ID
  receives: this order returns `401` first, whereas `['validateId', 'tokenAuth']` rejects the ID before checking the token

**Routes that deliberately omit `validateId`**: `v1/guideline/rollback` and `v1/guideline/get-snapshots` validate the
`:id` in the controller instead. `validateId` requires an integer, and the guideline snapshot identifier
(`:snapshotId`) is an ISO date string, so applying the policy would reject every otherwise-valid request.

2. **Controller Level** (`RightService.hasGroup()`)
- Role-based permission checks
- Owner-based access control

3. **Business Logic Level**
- Resource-specific permissions
- Contextual access control
- FK guards for permanent deletion

## Implementation Details

### Database Schema

```sql
-- User groups/roles
CREATE TABLE t_group (
  id smallserial PRIMARY KEY,
  name varchar(200) NOT NULL,
  comments varchar(1000)
);

-- User-to-group assignments
CREATE TABLE j_caver_group (
  id_caver int4 NOT NULL,
  id_group int2 NOT NULL,
  PRIMARY KEY (id_caver, id_group)
);

-- Token blacklist for ban/revocation
CREATE TABLE t_token_blacklist (
  id_caver int4 PRIMARY KEY,
  revoked_before timestamp NOT NULL
);
```

### Code Examples

#### Route-Level Policy
```javascript
// config/policies.js
module.exports.policies = {
  '*': false, // Deny all by default
  'v1/entrance/find': true, // Public access
  'v1/entrance/create': 'tokenAuth', // Requires authentication
  'v1/mfa/enroll': ['mfaEnrollmentAuth'], // Requires MFA enrollment token
  'v1/device/update': ['validateId', 'tokenAuth'], // ID validation + auth
};
```

#### Role-Based Permission Check
```javascript
// In controllers
const hasRight = RightService.hasGroup(
  req.token.groups,
  RightService.G.MODERATOR
);
if (!hasRight) {
  return res.forbidden('You are not authorized to perform this action.');
}
```

#### Owner-Based Access Control
```javascript
// Users can edit their own content, moderators can edit any content
if (req.token.id !== resource.author) {
  const hasModeratorRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasModeratorRight) {
    return res.forbidden('You can only edit your own content.');
  }
}
```

#### Organization Membership Check
```javascript
// Check if user is member of organization for cave explorer management
const memberQuery = `
  SELECT 1 FROM j_grotto_caver
  WHERE id_caver = $1 AND id_grotto = $2
`;
const memberResult = await sails.sendNativeQuery(memberQuery, [
  req.token.id,
  organizationId,
]);
const isMember = memberResult.rows.length > 0;

if (!hasAdminRight && !hasModeratorRight && !isMember) {
  return res.forbidden('You are not authorized to manage cave explorers.');
}
```

#### Sensitive Data Access Control
```javascript
// Hide coordinates and locations for sensitive entrances
result.latitude = !isSensitive || meta?.hasCompleteViewRight === true
  ? parseFloat(source.latitude)
  : null;
result.longitude = !isSensitive || meta?.hasCompleteViewRight === true
  ? parseFloat(source.longitude)
  : null;
result.locations = !source.isSensitive || meta?.hasCompleteViewRight === true
  ? toList('locations', source, toSimpleLocation)
  : [];
```

#### Permanent Delete with FK Guard
```javascript
// Permanent deletion gated by foreign key check
if (isPermanent) {
  if (!hasAdminRight) {
    return res.forbidden('You are not authorized to permanently delete.');
  }
  // Soft-delete first (phase 1)
  if (!entity.isDeleted) {
    await TDevice.destroyOne({ id: entityId });
  }
  // FK guard: block hard delete if children exist
  const childCount = await TSensorConfiguration.count({ device: entityId });
  if (childCount > 0) {
    return res.conflict('Cannot permanently delete: has associated children.');
  }
  // Hard delete (phase 2)
  await TDevice.destroyOne({ id: entityId });
}
```

## Adding New Permissions

### 1. Route-Level Permission
Add to `config/policies.js`:
```javascript
'v1/new-endpoint/action': 'tokenAuth',
```

### 2. Role-Based Permission
Add to controller:
```javascript
const hasRight = RightService.hasGroup(
  req.token.groups,
  RightService.G.REQUIRED_ROLE
);
```

### 3. New Role
1. Add to `t_group` table
2. Update `RightService.G` constants
3. Add permission checks in relevant controllers

### 4. Organization-Based Permission
Add membership check:
```javascript
const isMember = await checkOrganizationMembership(req.token.id, organizationId);
if (!hasAdminRight && !isMember) {
  return res.forbidden('You must be a member of this organization.');
}
```

### 5. Sensitive Data Permission
Add sensitive data check:
```javascript
const hasCompleteViewRight = RightService.hasGroup(
  req.token.groups,
  RightService.G.ADMINISTRATOR
);
// Use hasCompleteViewRight in converters to show/hide sensitive data
```
