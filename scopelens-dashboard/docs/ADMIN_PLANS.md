# Admin Plan Management

## Overview

The Plans page allows administrators to create, configure, and manage subscription plans offered on the platform.

## Plans Page (`/plans`)

### Plan List

| Column | Description |
|--------|-------------|
| Name | Plan display name |
| Price | Monthly USD price |
| Scan Limit | Scans per month |
| Users | Active subscribers |
| Status | Active/Inactive |
| Actions | Edit/Delete |

## Creating Plans

### Create Plan Modal

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | Text | Yes | Plan name |
| Price | Number | Yes | Monthly cost (USD) |
| Scan Limit | Number | Yes | Monthly scan limit |
| Features | Text[] | No | Feature list |
| Description | Text | No | Plan description |
| Popular | Boolean | No | Featured badge |
| Active | Boolean | Yes | Available for purchase |

### API

```
POST /api/admin/plans
{
  "name": "Pro",
  "price": 19,
  "scanLimit": 100,
  "features": [
    "100 scans/month",
    "Priority support",
    "PDF reports"
  ],
  "popular": true,
  "active": true
}
```

## Editing Plans

### Editable Fields

All fields can be edited except:
- Existing subscriber counts

### Impact Warning

Editing a plan shows warnings for:
- Price changes (affects renewals)
- Limit changes (affects current users)

### API

```
PATCH /api/admin/plans/{id}
{
  "price": 29,
  "scanLimit": 150
}
```

## Plan Status

### Active Plans

- Visible on pricing page
- Available for purchase
- Current subscribers active

### Inactive Plans

- Hidden from pricing
- Cannot be purchased
- Existing subscribers maintained

### API

```
POST /api/admin/plans/{id}/deactivate
POST /api/admin/plans/{id}/activate
```

## Deleting Plans

Plans can only be deleted if:
- No active subscribers
- Not set as default plan

### Migration

If deleting with subscribers:
1. Select migration plan
2. Subscribers moved automatically
3. Notification sent to users

### API

```
DELETE /api/admin/plans/{id}
DELETE /api/admin/plans/{id}?migrateTo={newPlanId}
```

## Default Plan

One plan must be set as default:
- Assigned to new free users
- Cannot be deleted
- Must have $0 price or be free tier

```
POST /api/admin/plans/{id}/set-default
```

## Plan Features

### Adding Features

Features are displayed as bullet points:

```json
{
  "features": [
    "100 scans per month",
    "Priority email support",
    "PDF report export",
    "API access"
  ]
}
```

### Feature Icons

Features can include icons:
- ✓ Included features (default)
- ✗ Excluded features
- ★ Highlighted features

## Pricing Display

### Currency Support

Plans store prices in USD. The frontend converts to PKR for Pakistani users using the CurrencyContext.

### Price Formatting

```tsx
import { useCurrency } from "@/contexts/CurrencyContext";

const { formatPrice } = useCurrency();
<span>{formatPrice(plan.price)}/month</span>
```
