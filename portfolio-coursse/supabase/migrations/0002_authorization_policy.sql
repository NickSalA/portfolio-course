-- Allows an authenticated user to verify only their own pre-authorized email.
create policy "students verify own authorization"
on public.authorized_students for select to authenticated
using (lower(email) = lower((auth.jwt() ->> 'email')));
