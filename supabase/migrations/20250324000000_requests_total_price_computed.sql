-- Fix: "cannot insert a non-DEFAULT value into column 'total_price'"
-- Make total_price a normal column computed by trigger so the app does not send it on insert.

-- 1. Drop existing total_price (whether GENERATED or regular) so we can redefine it
ALTER TABLE requests DROP COLUMN IF EXISTS total_price;

-- 2. Add total_price as a normal column (trigger will set it on insert/update)
ALTER TABLE requests
  ADD COLUMN total_price NUMERIC(12,2) NOT NULL DEFAULT 0;

-- 3. Backfill existing rows
UPDATE requests SET total_price = quantity * unit_price;

-- 4. Trigger function: set total_price from quantity * unit_price
CREATE OR REPLACE FUNCTION requests_set_total_price()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_price := NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger: run before insert or update
DROP TRIGGER IF EXISTS requests_total_price_trigger ON requests;
CREATE TRIGGER requests_total_price_trigger
  BEFORE INSERT OR UPDATE OF quantity, unit_price ON requests
  FOR EACH ROW
  EXECUTE PROCEDURE requests_set_total_price();

-- 6. Run trigger for UPDATE so backfill is consistent (optional; already set above)
-- No need; backfill already set total_price. New inserts/updates will use the trigger.

COMMENT ON COLUMN requests.total_price IS 'Computed as quantity * unit_price by trigger; do not insert/update from application';
