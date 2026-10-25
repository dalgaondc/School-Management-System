-- Run AFTER creating the user in Authentication -> Users (auto-confirm ticked).
-- Replace the name and email below.
insert into profiles (id, full_name, role)
select id, 'Your Name', 'admin' from auth.users where email = 'you@example.com';
