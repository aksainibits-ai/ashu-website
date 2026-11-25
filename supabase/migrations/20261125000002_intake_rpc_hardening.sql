-- Restrict SECURITY DEFINER public intake functions to the server-side service role.
-- Public traffic must pass through the validated, origin-checked Next.js endpoints.
REVOKE ALL ON FUNCTION public.request_appointment(uuid,text,text,text,text,text,boolean,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_enquiry(text,text,text,text,text,boolean,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_appointment(uuid,text,text,text,text,text,boolean,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_enquiry(text,text,text,text,text,boolean,text) TO service_role;

-- Keep the public availability view while eliminating duplicate permissive SELECT policies.
DROP POLICY IF EXISTS "advocates can read all appointment slots" ON public.appointment_slots;
DROP POLICY IF EXISTS "public can read available appointment slots" ON public.appointment_slots;
CREATE POLICY "staff and visitors can read appropriate appointment slots"
ON public.appointment_slots FOR SELECT TO anon, authenticated
USING (
  (is_available = true AND starts_at > now())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('owner','advocate')
  )
);

-- Cover foreign-key lookups identified by the database performance advisor.
CREATE INDEX IF NOT EXISTS admin_audit_log_actor_id_idx ON public.admin_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS appointment_events_actor_id_idx ON public.appointment_events(actor_id);
CREATE INDEX IF NOT EXISTS appointment_slots_created_by_idx ON public.appointment_slots(created_by);
