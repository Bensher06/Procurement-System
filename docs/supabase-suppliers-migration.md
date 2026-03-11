# Suppliers table: optional columns

The Submit Supplier Profile form can store **portfolio_urls** and **project_attending**. If your Supabase `suppliers` table doesn’t have these columns, the form still works but those values are not saved.

## Add the columns in Supabase (optional)

In **Supabase Dashboard** → **SQL Editor**, run:

```sql
-- Optional: portfolio URLs (array of text)
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS portfolio_urls text[] DEFAULT NULL;

-- Optional: project attending (text)
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS project_attending text DEFAULT NULL;
```

## Re-enable in the code (after adding columns)

In `frontend/src/pages/SupplierRegister.tsx`, in the `insertData` object (where the comment references this doc), add back:

- `project_attending: formData.project_attending?.trim() || null,`
- `portfolio_urls: portfolioUrls` (only if you use portfolio uploads)

No other code changes are required once the columns exist.
