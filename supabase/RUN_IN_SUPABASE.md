# Run these in Supabase so Request Progress works

Yes. You need to run the migrations in your **Supabase project** (Dashboard → SQL Editor). Otherwise approve/reject and new requests can fail or behave incorrectly.

## Option A: Run the combined script (easiest)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor**.
3. Open the file **`supabase/migrations/RUN_THIS_IN_SQL_EDITOR.sql`** in this repo.
4. Copy its entire contents, paste into the SQL Editor, and click **Run**.

## Option B: Run each migration one by one

Run in this order (each in a new SQL Editor tab):

1. **`20250324000000_requests_total_price_computed.sql`**  
   - Fixes "cannot insert into total_price" when creating a request.  
   - Adds a trigger so `total_price` is computed from quantity × unit_price.

2. **`20250325000000_requests_allow_authenticated_update.sql`**  
   - Allows authenticated users to **UPDATE** requests.  
   - Required for **Approve** and **Reject** to work (and to avoid logout on reject).

3. **`20250326000000_requests_negotiating_and_delivery.sql`**  
   - Adds **Negotiating** workflow and **bid winner / delivery notes** when marking a request as Delivering.  
   - Adds columns: `bid_winner_supplier_id`, `delivery_notes`, `negotiating_notes`.

After all run successfully, request progress, approve/reject/negotiate, and the full pipeline (Gathering supplies → Delivering → Completed) work as intended.

## If something still doesn’t work

- **Request Progress counts not updating:** Use the **Refresh** button on the Request Progress page, or switch to another page and back.
- **Reject still logs me out:** Make sure the second migration (authenticated UPDATE) ran without errors.
- **New request fails on submit:** Make sure the first migration (total_price trigger) ran without errors.
