# Trial-Ended Test-User (2026-05-13)

**Zweck:** Trial-Ended-Modal + Stripe-Checkout-Flow testen ohne Davids echte Sub anzufassen.

## Credentials

```
Email:    test-trial-27864@spurig-test.invalid
Password: 6ZktJZFFLQSrTS7S
User-ID:  d31895ca-11a5-4f97-9e23-697f628d3b7d
```

> Login geht über Email+Passwort auf `/login`. Die `.invalid` TLD heisst nur,
> dass dieser User keine echten Mails empfangen kann — fuer Stripe-Tests reicht das.

## DB-State

- `auth.users.email_confirmed_at` ist gesetzt (kein PIN-Code noetig)
- `profiles.trial_ends_at = 2026-04-01` (laengst abgelaufen)
- keine `subscriptions`-Row → `getUserTier()` liefert `expired`

## Was beim Login passieren sollte

1. `/dashboard` laedt
2. Trial-Ended-Modal triggert sofort (Hard-Paywall, unschliessbar)
3. Yearly (Default) zeigt **8,99 €/Mo** + "Spare 31 %"
4. Monthly zeigt **12,99 €/Mo** + "erste 3 Monate nur 5,99 €"
5. Click "Weiter zum Checkout" → Stripe-Hosted-Page mit V2-Preisen

## Stripe-Testkarten

- **Erfolgreich:** `4242 4242 4242 4242` · MM/YY beliebig in Zukunft · CVC beliebig 3-stellig
- **SCA-Abfrage:** `4000 0027 6000 3184`
- **Decline:** `4000 0000 0000 0002`

## Aufräumen wenn fertig

User komplett löschen:
```bash
curl -X DELETE "https://otgymdbdurpsszulhsji.supabase.co/auth/v1/admin/users/d31895ca-11a5-4f97-9e23-697f628d3b7d" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Falls Stripe-Checkout abgeschlossen wurde, vorher Stripe-Customer + Sub in Stripe-Dashboard löschen
(Suche nach Customer-Email `test-trial-27864@spurig-test.invalid`).
