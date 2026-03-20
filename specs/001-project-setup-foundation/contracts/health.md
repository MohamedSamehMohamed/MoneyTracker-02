# API Contract: Health Check

**Endpoint**: `GET /api/health`
**Purpose**: Verify the server is running and responsive.

## Request

```
GET /api/health
```

No headers, authentication, or body required.

## Response

**Status**: `200 OK`
**Content-Type**: `application/json`

```json
{
  "status": "ok",
  "timestamp": "2026-03-20T12:00:00.000Z"
}
```

| Field       | Type   | Description                          |
| ----------- | ------ | ------------------------------------ |
| `status`    | string | Always `"ok"` when server is healthy |
| `timestamp` | string | ISO 8601 UTC timestamp               |

## Error Response

If the server is unreachable, no response is returned (connection refused). There are no application-level error responses for this endpoint.
