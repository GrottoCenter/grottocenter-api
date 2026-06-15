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
    - Edit caves, entrances, documents, massifs, organisations, descriptions, locations, riggings, histories
    - Edit own comments
    - Unlink documents from entities
    - Rollback to a previous version of any content
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
    - Delete/restore devices and sensor configurations
    - Update any device or sensor configuration (regardless of ownership)
    - Update any user's comments
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
  - **Sensitive Data Management**:
    - View coordinates of sensitive entrances
    - Remove sensitive flag from entrances
    - Modify coordinates of sensitive entrances
    - Mark/unmark massifs as sensitive (cascades to contained entrances)
    - Preview massif sensitivity impact
  - **Permanent Deletion**:
    - Permanently delete any content (caves, entrances, documents, devices, sensor configurations, etc.)
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
| **Content Creation**                                          |
| Create caves/entrances/documents/organisations/massifs        | ❌ | ✅ | ✅ | ✅ | ✅ |
| Create comments/descriptions/locations/riggings/histories     | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Content Modification**                                      |
| Update caves/entrances/documents/organisations/massifs        | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update descriptions/locations/riggings/histories              | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update own comments                                           | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update any comment                                            | ❌ | ❌ | ❌ | ✅ | ❌ |
| Set main name for entities                                    | ❌ | ✅ | ✅ | ✅ | ✅ |
| Move entrance to another cave                                 | ❌ | ✅ | ✅ | ✅ | ✅ |
| Reorder descriptions/locations/riggings/histories/comments    | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Soft-deleted Content Management**                           |
| Soft delete any content                                       | ❌ | ❌ | ❌ | ✅ | ✅ |
| View soft-deleted content                                     | ❌ | ❌ | ❌ | ✅ | ✅ |
| Restore soft-deleted content                                  | ❌ | ❌ | ❌ | ✅ | ✅ |
| Permanent delete                                              | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Document Management**                                       |
| Validate documents                                            | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage document duplicates                                    | ❌ | ❌ | ❌ | ✅ | ✅ |
| Unlink documents from entities                                | ❌ | ✅ | ✅ | ✅ | ✅ |
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

### Owner-Based Access Control
- **Content Ownership**: Users can modify any content except other's comments
- **Moderator Override**: Moderators and Administrators can modify any content regardless of ownership
- **Comment Updates**: Users can update their own comments; Moderators can update any comments

### Snapshot and History Access
- **Public History**: Available to all users for non-sensitive content
- **Sensitive History**: Historical data for sensitive entrances requires Administrator privileges

### Scientific Domain Access
- **Devices**: Any authenticated user can create devices; update requires ownership or Moderator role; soft delete requires Moderator or Administrator; restore requires Moderator; permanent delete requires Administrator
- **Sensor Configurations**: Same permission model as devices — scoped under a device (nested resource)
- **Observation Import**: Any authenticated user can import observation data via CSV/TSV
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
- Only Moderators and Administrators can soft-delete and restore content
- Only Administrators can perform permanent deletions
- Permanent deletion of devices is blocked if they have associated sensor configurations
- Permanent deletion of sensor configurations is blocked if they have associated time series

## Architecture

### Three-Layer Permission Model

1. **Route Level** (`config/policies.js`)
- `false` - Blocked (default)
- `true` - Public access (no authentication required)
- `'tokenAuth'` - Requires valid JWT token
- `'mfaEnrollmentAuth'` - Requires valid MFA enrollment token
- `['validateId']` - Public access with ID validation
- `['validateId', 'tokenAuth']` - Authenticated with ID validation

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
