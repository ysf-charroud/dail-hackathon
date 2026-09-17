-- Fix role self-promotion + auto-create applicant profiles on signup.

drop policy if exists "own_profile" on profiles;
create policy "own_profile_select" on profiles for select to authenticated
  using (id = auth.uid());
create policy "own_profile_insert" on profiles for insert to authenticated
  with check (id = auth.uid() and role = 'applicant');

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, display_name)
  values (new.id, 'applicant', split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();
