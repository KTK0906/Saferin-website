alter table public.elderly
  add column gender text check (gender in ('男', '女', '其他', '未提供'));

comment on column public.elderly.gender is
  'Resident gender for demographic form prefill; nullable until recorded.';
