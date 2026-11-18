-- Tabla de partidas
create table partidas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha timestamptz not null default now(),
  resultado text not null,
  puntuacion integer not null,
  duracion integer not null
);

-- Row Level Security: cada usuario solo ve y guarda sus partidas
alter table partidas enable row level security;

create policy "Ver mis partidas"
  on partidas for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Guardar mis partidas"
  on partidas for insert
  to authenticated
  with check (auth.uid() = user_id);
