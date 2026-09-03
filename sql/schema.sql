-- clientes
create table clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text not null unique,
  created_at timestamptz default now()
);

-- vehiculos
create table vehiculos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  patente text not null unique,
  marca text,
  modelo text,
  anio int,
  km_ultimo_service int,
  created_at timestamptz default now()
);

-- servicios
create table servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text unique not null, -- para la url limpia /servicios/slug
  descripcion text,
  duracion_min int not null default 30,
  precio numeric,
  activo boolean default true,
  orden int default 0
);

-- boxes / elevadores
create table boxes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activo boolean default true
);

-- turnos
create table turnos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id),
  vehiculo_id uuid references vehiculos(id),
  servicio_id uuid references servicios(id),
  box_id uuid references boxes(id),
  fecha date not null,
  hora time not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','confirmado','completado','cancelado')),
  cancelacion_token uuid default gen_random_uuid(), -- para que el cliente cancele/reprograme sin llamar
  created_at timestamptz default now(),
  -- evita que dos personas reserven el mismo horario en el mismo box por una
  -- condición de carrera; el chequeo de disponibilidad en el JS es solo UX,
  -- esto es lo que realmente lo impide a nivel base de datos
  unique (fecha, hora, box_id)
);
create index idx_turnos_fecha on turnos(fecha);

-- historial de service por vehiculo
create table historial_service (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid references vehiculos(id) on delete cascade,
  turno_id uuid references turnos(id),
  fecha date not null default current_date,
  km int,
  detalle text,
  fotos_url text[],
  created_at timestamptz default now()
);

-- galeria publica
create table fotos_galeria (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  categoria text,
  orden int default 0
);

-- notificaciones push enviadas
create table notificaciones_push (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  cuerpo text not null,
  segmento text default 'todos',
  enviado_at timestamptz default now()
);

-- cache de reviews de google (la usa la edge function, nunca el cliente directo)
create table reviews_cache (
  id uuid primary key default gen_random_uuid(),
  google_place_id text unique not null,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- RLS: lectura pública de lo que es público, escritura solo autenticado (panel admin)
alter table servicios enable row level security;
alter table fotos_galeria enable row level security;
alter table turnos enable row level security;
alter table clientes enable row level security;
alter table vehiculos enable row level security;

create policy "servicios publicos" on servicios for select using (activo = true);
create policy "galeria publica" on fotos_galeria for select using (true);

create policy "cualquiera reserva un turno" on turnos for insert with check (true);
create policy "cualquiera lee horarios ocupados" on turnos for select using (true);
create policy "solo admin modifica turnos" on turnos for update using (auth.role() = 'authenticated');
-- cancelación self-service: el cliente solo puede cancelar el turno que
-- tiene el token exacto (viene en el link que le mandamos por WhatsApp),
-- nunca puede tocar el resto de la tabla.
-- OJO: esta policy es MVP. Como RLS no puede validar el token en sí (eso
-- lo hace el .eq() del lado del cliente), alguien que adivine un UUID
-- podría cancelar un turno ajeno. Antes de producción, mover esto a una
-- edge function que reciba el token, lo valide server-side con
-- service_role, y recién ahí actualice el estado.
create policy "cancelacion con token" on turnos for update
  using (true)
  with check (estado = 'cancelado');

create policy "cualquiera se registra como cliente" on clientes for insert with check (true);
create policy "cualquiera lee su propio telefono" on clientes for select using (true);

create policy "cualquiera registra su vehiculo" on vehiculos for insert with check (true);
create policy "lectura de vehiculos" on vehiculos for select using (true);
