-- Optional attachment URL when admin marks request as Delivering (e.g. confirmation form PDF).
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS delivery_attachment_url TEXT;

COMMENT ON COLUMN requests.delivery_attachment_url IS 'Optional file URL (e.g. from storage) when marking as Delivering';
