# Suppliers table: add `portfolio_urls` (optional)

The Submit Supplier Profile form can store portfolio file URLs in a `portfolio_urls` column. If your Supabase `suppliers` table doesn’t have this column, the form still works but portfolio URLs are not saved.

To enable saving portfolio URLs:

1. In **Supabase Dashboard** → **SQL Editor**, run:

```sql
-- Add portfolio_urls to suppliers (array of text URLs)
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS portfolio_urls text[] DEFAULT NULL;
```

2. In the code, add `portfolio_urls` back into the insert payload in `frontend/src/pages/SupplierRegister.tsx` (in the `insertData` object where the comment references this doc).

No other code changes are required once the column exists.
