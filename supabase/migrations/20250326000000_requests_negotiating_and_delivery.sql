-- Add workflow: Negotiating status (admin negotiates with faculty), bid winner + delivery notes when marking Delivering.
-- Status is stored as text; "Negotiating" is valid without enum change.
-- Add columns for bid winner and delivery confirmation sent to faculty.

ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS bid_winner_supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
  ADD COLUMN IF NOT EXISTS negotiating_notes TEXT;

COMMENT ON COLUMN requests.bid_winner_supplier_id IS 'Supplier selected as bid winner; set when admin marks request as Delivering';
COMMENT ON COLUMN requests.delivery_notes IS 'Details sent to faculty when marking Delivering (confirmation form content)';
COMMENT ON COLUMN requests.negotiating_notes IS 'Optional note from admin when requesting negotiation with faculty';
