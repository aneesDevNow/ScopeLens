# Checkout & Payment Flow

## Overview

The checkout system handles subscription purchases for users and credit purchases for resellers.

## User Checkout (`/checkout`)

### Flow

```
Plans Page → Select Plan → Checkout → Payment → Thank You
```

### Checkout Page Features

- **Plan Summary**: Selected plan details
- **Payment Form**: Card information input
- **Billing Address**: Invoice address
- **Order Summary**: Price breakdown with tax
- **Currency Switcher**: USD/PKR toggle

### Price Breakdown

| Item | Description |
|------|-------------|
| Subtotal | Plan base price |
| Tax (10%) | Calculated tax |
| **Total** | Final amount |

## API Endpoints

### Create Subscription

```
POST /api/subscription
{
  "planId": "plan_pro",
  "paymentMethodId": "pm_xxx"
}

Response:
{
  "success": true,
  "subscriptionId": "sub_123",
  "status": "active"
}
```

## Thank You Page (`/checkout/thank-you`)

Displayed after successful payment:

- Order confirmation number
- Plan details
- Next steps
- Link to dashboard

## Payment Page (`/payment`)

### Saved Payment Methods

- View saved cards
- Add new card
- Set default card
- Remove card

### Invoice History

| Column | Description |
|--------|-------------|
| Date | Invoice date |
| Description | Plan/service |
| Amount | Charged amount |
| Status | paid/pending/failed |
| Actions | Download invoice |

### Billing Summary

- Current plan name
- Monthly cost
- Next payment date
- Amount due

## Currency Support

All checkout pages support PKR/USD:

```tsx
import { useCurrency, CurrencySwitcher } from "@/contexts/CurrencyContext";

const { formatPrice } = useCurrency();

// Display price in selected currency
<span>{formatPrice(19.99)}</span>
```

See [Currency Support](./CURRENCY_SUPPORT.md) for details.

## Error Handling

| Error | User Message | Action |
|-------|--------------|--------|
| Card declined | "Payment declined" | Try different card |
| Invalid card | "Invalid card details" | Re-enter information |
| Network error | "Connection failed" | Retry payment |
| Already subscribed | "Active subscription exists" | Go to billing |
