---
name: Technical feature description
about: Describe precisely how a feature sould be implementend in the API
title: ''
labels: 'Type: Feature'
assignees: ''
---

## Who can do it

Any user

## Dependant on issues

Mandatory ➡️

Facultative ➡️

## Feature description

- Create thingA.
- Update thingB (related to thingA).
- Delete thingC in database.

## Route & body

`POST /api/v1/ressources/:resourceId/messages`

```json
{
  "content": "this is a content"
}
```

## Response

```json
{
  "content": "this is a content"
}
```
