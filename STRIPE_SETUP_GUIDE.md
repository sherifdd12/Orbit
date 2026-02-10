# Stripe Payment Integration - Quick Setup

## 5-Minute Setup Guide

### Step 1: Create Stripe Account (2 minutes)
```
1. Go to stripe.com
2. Click "Sign up"
3. Email and password
4. Verify email
5. Complete business details
```

### Step 2: Get API Keys (1 minute)
```
1. Dashboard → Developers → API keys
2. Copy "Secret key" (sk_live_xxxxx)
3. Copy "Publishable key" (pk_live_xxxxx)
```

### Step 3: Setup Webhook (1 minute)
```
1. Developers → Webhooks → Add endpoint
2. URL: https://yourdomain.com/api/stripe/webhook
3. Events: customer.subscription.created/updated/deleted, invoice.payment_*
4. Copy "Signing secret" (whsec_xxxxx)
```

### Step 4: Add to .env (1 minute)
```bash
# .env.local
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 5: Deploy & Test (Optional - for live)
```bash
npm run build
vercel deploy
```

---

## Testing Your Integration

### Test Mode (Sandbox)
Use test keys instead of live keys:
- `sk_test_xxxxx` (Stripe will provide these)
- Test card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

### Local Testing with Stripe CLI
```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy signing secret and add to .env.local
```

---

## Test Checkout Flow

1. Navigate to `/pricing`
2. Click "Subscribe to Starter"
3. Should redirect to Stripe checkout
4. Use test card `4242 4242 4242 4242`
5. Fill in details (any values work in test mode)
6. Should return to success URL
7. Check Supabase `subscriptions` table for new record

---

## Webhook Events

Your webhook at `/api/stripe/webhook` handles:

```
✓ customer.subscription.created
  → Creates subscription record in database

✓ customer.subscription.updated  
  → Updates subscription in database

✓ customer.subscription.deleted
  → Marks subscription as canceled

✓ invoice.payment_succeeded
  → Payment processed successfully

✓ invoice.payment_failed
  → Payment failed (send email to user)
```

---

## Troubleshooting

### Webhook Not Triggering?
1. Check endpoint URL is correct
2. Check signing secret matches
3. Check firewall allows Stripe IPs
4. Test with Stripe CLI: `stripe trigger payment_intent.succeeded`

### Subscription Not Creating?
1. Check metadata is passed in checkout
2. Check user_id and tier_id are valid UUIDs
3. Check Supabase table exists and has permissions
4. Check RLS policies allow inserts

### Checkout Button Not Working?
1. Check API keys are correct
2. Check environment variables are loaded
3. Check browser console for errors
4. Test with `curl` to debug

---

## Next Features (Optional)

### Customer Portal
Let customers manage subscriptions:
```typescript
// Create portal session
stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: 'https://yourdomain.com/dashboard'
})
```

### Invoicing
Automated invoices when subscriptions renew

### Dunning Management
Retry failed payments automatically

### Usage-Based Billing
Charge based on actual usage (API calls, reports)

---

## Security Best Practices

✅ **DO:**
- Keep `STRIPE_SECRET_KEY` in environment variables
- Verify webhook signatures (we do this ✅)
- Use HTTPS only in production
- Store sensitive data only on server

❌ **DON'T:**
- Commit API keys to git
- Expose secret key in frontend
- Trust client-side amount values
- Test with real credit cards

---

## Monthly Tasks

- [ ] Review failed payments
- [ ] Check churn rate
- [ ] Process refunds if needed
- [ ] Review Stripe dashboard metrics
- [ ] Update pricing if needed

---

## Support

- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stripe Docs**: https://stripe.com/docs
- **API Reference**: https://stripe.com/docs/api
- **Community**: https://stackoverflow.com/questions/tagged/stripe

---

**Status**: Ready to implement
**Estimated Implementation Time**: 30 minutes
**Testing Time**: 15 minutes
**Total**: ~45 minutes to live payments

Ready to go! 🚀
