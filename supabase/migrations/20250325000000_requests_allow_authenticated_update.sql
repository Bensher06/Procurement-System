-- Allow authenticated users to UPDATE requests (e.g. approve/reject by Admin/DeptHead).
-- Fixes: reject leaving request in Pending and possible logout on 403.

GRANT UPDATE ON public.requests TO authenticated;

DROP POLICY IF EXISTS "Allow authenticated update requests" ON public.requests;
CREATE POLICY "Allow authenticated update requests"
  ON public.requests FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "Allow authenticated update requests" ON public.requests IS
  'Authenticated users (Admin, DeptHead, Faculty) can update requests for approve/reject/workflow';
