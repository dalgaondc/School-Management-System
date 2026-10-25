create type user_role as enum ('admin', 'teacher');
create type attendance_status as enum ('present', 'absent', 'late', 'excused');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  role user_role not null default 'teacher',
  created_at timestamptz default now()
);

create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  section text,
  academic_year text not null
);

create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  roll_no text,
  class_id uuid references classes on delete set null,
  guardian_name text,
  guardian_phone text,
  created_at timestamptz default now()
);

create table teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles on delete cascade,
  class_id uuid not null references classes on delete cascade,
  subject_id uuid not null references subjects on delete cascade,
  unique (teacher_id, class_id, subject_id)
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students on delete cascade,
  class_id uuid not null references classes on delete cascade,
  date date not null,
  status attendance_status not null,
  marked_by uuid references profiles,
  unique (student_id, date)
);

create table exams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class_id uuid not null references classes on delete cascade,
  subject_id uuid references subjects,
  max_marks numeric not null
);

create table grades (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams on delete cascade,
  student_id uuid not null references students on delete cascade,
  marks numeric not null,
  unique (exam_id, student_id)
);

-- Helpers
create function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create function teaches_class(cid uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from teacher_assignments
                 where teacher_id = auth.uid() and class_id = cid);
$$;

-- Enable RLS everywhere
alter table profiles            enable row level security;
alter table classes             enable row level security;
alter table subjects            enable row level security;
alter table students            enable row level security;
alter table teacher_assignments enable row level security;
alter table attendance          enable row level security;
alter table exams               enable row level security;
alter table grades              enable row level security;

-- Admin: full access everywhere
create policy "admin all" on profiles            for all using (is_admin()) with check (is_admin());
create policy "admin all" on classes             for all using (is_admin()) with check (is_admin());
create policy "admin all" on subjects            for all using (is_admin()) with check (is_admin());
create policy "admin all" on students            for all using (is_admin()) with check (is_admin());
create policy "admin all" on teacher_assignments for all using (is_admin()) with check (is_admin());
create policy "admin all" on attendance          for all using (is_admin()) with check (is_admin());
create policy "admin all" on exams               for all using (is_admin()) with check (is_admin());
create policy "admin all" on grades              for all using (is_admin()) with check (is_admin());

-- Teachers: read-only on reference data
create policy "teacher read own profile" on profiles for select using (id = auth.uid());
create policy "teacher read classes" on classes for select using (teaches_class(id));
create policy "teacher read subjects" on subjects for select using (auth.uid() is not null);
create policy "teacher read students" on students for select using (teaches_class(class_id));
create policy "teacher read own assignments" on teacher_assignments for select using (teacher_id = auth.uid());

-- Teachers: read/write on their own classes
create policy "teacher attendance" on attendance for all
  using (teaches_class(class_id)) with check (teaches_class(class_id));

create policy "teacher exams" on exams for all
  using (teaches_class(class_id)) with check (teaches_class(class_id));

create policy "teacher grades" on grades for all
  using (exists (select 1 from exams e where e.id = exam_id and teaches_class(e.class_id)))
  with check (exists (select 1 from exams e where e.id = exam_id and teaches_class(e.class_id)));
