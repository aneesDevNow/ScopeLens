# Currency Support Documentation

## Overview

ScopeLens supports multiple currencies with automatic detection for Pakistani users. The system defaults to USD but automatically switches to PKR (Pakistani Rupees) when a user from Pakistan visits the platform.

## Features

- **Automatic IP Detection**: Detects user location via IP and sets PKR for Pakistani users
- **Manual Currency Toggle**: Users can switch between USD and PKR using the currency switcher
- **Persistent Preference**: Currency preference is saved to localStorage
- **Real-time Conversion**: All prices update instantly when switching currencies

## Exchange Rate

- **1 USD = 280 PKR** (configurable in `CurrencyContext.tsx`)

## Implementation

### CurrencyContext (`/src/contexts/CurrencyContext.tsx`)

The core currency logic is provided by a React Context:

```tsx
import { useCurrency, CurrencySwitcher } from "@/contexts/CurrencyContext";

// In your component
const { currency, formatPrice, convertPrice, setCurrency, symbol } = useCurrency();

// Format a USD amount to current currency
formatPrice(19.99); // Returns "$19.99" or "Rs. 5,597"

// Get raw converted value
convertPrice(100); // Returns 100 (USD) or 28000 (PKR)
```

### Available Functions

| Function | Description | Example |
|----------|-------------|---------|
| `formatPrice(amount)` | Formats USD amount with currency symbol | `formatPrice(50)` → `"$50.00"` or `"Rs. 14,000"` |
| `convertPrice(amount)` | Converts USD to selected currency | `convertPrice(50)` → `50` or `14000` |
| `setCurrency(currency)` | Sets currency ('USD' or 'PKR') | `setCurrency('PKR')` |

### Available Properties

| Property | Type | Description |
|----------|------|-------------|
| `currency` | `"USD" \| "PKR"` | Current currency code |
| `symbol` | `string` | Currency symbol (`"$"` or `"Rs."`) |
| `rate` | `number` | Exchange rate (1 for USD, 280 for PKR) |
| `isLoading` | `boolean` | True while detecting location |

### CurrencySwitcher Component

A ready-to-use toggle component:

```tsx
import { CurrencySwitcher } from "@/contexts/CurrencyContext";

// Add to your page header
<CurrencySwitcher className="optional-classes" />
```

## Pages with Currency Support

- `/checkout` - User subscription checkout
- `/checkout/thank-you` - User checkout confirmation
- `/payment` - User payment methods & billing
- `/reseller/checkout` - Reseller credit purchase
- `/reseller/checkout/thank-you` - Reseller checkout confirmation  
- `/reseller/payment` - Reseller payment methods & transactions

## Adding Currency Support to New Pages

1. Import the hook and component:
```tsx
import { useCurrency, CurrencySwitcher } from "@/contexts/CurrencyContext";
```

2. Use the hook in your component:
```tsx
const { formatPrice } = useCurrency();
```

3. Add the switcher to your header:
```tsx
<CurrencySwitcher />
```

4. Replace hardcoded prices with `formatPrice()`:
```tsx
// Before
<span>${price}</span>

// After
<span>{formatPrice(price)}</span>
```

## Configuration

### Changing the Exchange Rate

Edit `/src/contexts/CurrencyContext.tsx`:

```tsx
const PKR_RATE = 280; // Change this value
```

### Adding New Currencies

1. Update the type definition:
```tsx
type Currency = "USD" | "PKR" | "EUR"; // Add new currency
```

2. Add conversion logic in `convertPrice()` and `formatPrice()`

3. Update the `CurrencySwitcher` component with new toggle option

## IP Detection

Location detection uses the [ipapi.co](https://ipapi.co) API:

- **Endpoint**: `https://ipapi.co/json/`
- **Timeout**: 5 seconds
- **Fallback**: USD on error or timeout

## localStorage Keys

| Key | Value | Description |
|-----|-------|-------------|
| `preferred_currency` | `"USD"` or `"PKR"` | User's currency preference |
