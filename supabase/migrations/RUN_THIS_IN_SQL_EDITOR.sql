-- =============================================================================
-- Run this entire file in Supabase Dashboard → SQL Editor (one paste, one Run).
-- Order: (1) total_price computed column + trigger, (2) authenticated UPDATE.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. total_price: computed by trigger (fixes "cannot insert into total_price")
-- -----------------------------------------------------------------------------
ALTER TABLE requests DROP COLUMN IF EXISTS total_price;

ALTER TABLE requests
  ADD COLUMN total_price NUMERIC(12,2) NOT NULL DEFAULT 0;

UPDATE requests SET total_price = quantity * unit_price;

CREATE OR REPLACE FUNCTION requests_set_total_price()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_price := NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS requests_total_price_trigger ON requests;
CREATE TRIGGER requests_total_price_trigger
  BEFORE INSERT OR UPDATE OF quantity, unit_price ON requests
  FOR EACH ROW
  EXECUTE PROCEDURE requests_set_total_price();

COMMENT ON COLUMN requests.total_price IS 'Computed as quantity * unit_price by trigger; do not insert/update from application';

-- -----------------------------------------------------------------------------
-- 2. Allow authenticated users to UPDATE requests (approve/reject; no 403/logout)
-- -----------------------------------------------------------------------------
GRANT UPDATE ON public.requests TO authenticated;

DROP POLICY IF EXISTS "Allow authenticated update requests" ON public.requests;
CREATE POLICY "Allow authenticated update requests"
  ON public.requests FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "Allow authenticated update requests" ON public.requests IS
  'Authenticated users (Admin, DeptHead, Faculty) can update requests for approve/reject/workflow';
