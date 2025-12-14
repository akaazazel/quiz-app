-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Quizzes Table (Optional context, assuming one main quiz for now)
create table if not exists quizzes (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Questions Table
create table if not exists questions (
  id uuid default uuid_generate_v4() primary key,
  quiz_id uuid references quizzes(id),
  question_text text not null,
  options jsonb not null, -- Array of 4 strings
  correct_index integer not null, -- 0-3
  time_seconds integer not null default 30,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Students Table
create table if not exists students (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null,
  token uuid default uuid_generate_v4() unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Submissions Table
create table if not exists submissions (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references students(id),
  score numeric not null,
  answers jsonb, -- Store details of answers
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) - Basic Setup
-- You might want to enable RLS and add policies for security.
-- For now, we will handle security via the backend API key (Service Role).
alter table quizzes enable row level security;
alter table questions enable row level security;
alter table students enable row level security;
alter table submissions enable row level security;

-- Migrations for new student details
alter table students add column if not exists phone text;
alter table students add column if not exists institution_type text check (institution_type in ('school', 'college'));
alter table students add column if not exists institution_name text;
alter table students add column if not exists class_grade text; -- 'class' is a reserved keyword in some contexts, safer to use class_grade
alter table students add column if not exists course text;
alter table students add column if not exists branch text;
alter table students add column if not exists semester text;
