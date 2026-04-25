import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqliteUrl = process.env.DATABASE_URL ?? "file:./local.db";
const sqlitePath = sqliteUrl.startsWith("file:") ? sqliteUrl.replace("file:", "") : sqliteUrl;
const iminUrl = process.env.IMIN_DATABASE_URL ?? "file:./imin.db";
const iminPath = iminUrl.startsWith("file:") ? iminUrl.replace("file:", "") : iminUrl;
const client = new Database(sqlitePath);
export const sqliteClient = client;

const quoteSqlString = (value: string) => `'${value.replaceAll("'", "''")}'`;

client.exec(`ATTACH DATABASE ${quoteSqlString(iminPath)} AS imin`);

client.exec(`
  CREATE TABLE IF NOT EXISTS imin.proyecto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL
  )
`);
client.exec(`
  INSERT INTO imin.proyecto (id, nombre)
  VALUES
    (1, 'Pilates Reformer'),
    (2, 'Lake Sport')
  ON CONFLICT(id) DO UPDATE SET nombre = excluded.nombre
`);
client.exec(`
  CREATE TABLE IF NOT EXISTS imin.component (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL
  )
`);
client.exec(`
  INSERT INTO imin.component (id, nombre)
  VALUES
    (1, 'navbar'),
    (2, 'home'),
    (3, 'footer')
  ON CONFLICT(id) DO UPDATE SET nombre = excluded.nombre
`);
client.exec(`
  UPDATE imin.datahydrate
  SET component = 3
  WHERE component = 4
`);
client.exec(`
  DELETE FROM imin.component
  WHERE id = 4
    AND nombre = 'footer'
`);

const createDatahydrateTable = (tableName = "datahydrate") => {
  client.exec(`
    CREATE TABLE IF NOT EXISTS imin.${tableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idproyecto INTEGER NOT NULL DEFAULT 1,
      component INTEGER NOT NULL,
      label TEXT NOT NULL,
      descripcion TEXT,
      FOREIGN KEY (idproyecto) REFERENCES proyecto(id),
      FOREIGN KEY (component) REFERENCES component(id)
    )
  `);
};

createDatahydrateTable();
client.exec(`
  CREATE INDEX IF NOT EXISTS imin.datahydrate_idproyecto_idx
  ON datahydrate (idproyecto)
`);

const datahydrateColumns = client
  .prepare("PRAGMA imin.table_info(datahydrate)")
  .all() as Array<{ name: string; type: string; pk: number }>;
const datahydrateColumnNames = new Set(datahydrateColumns.map((column) => column.name));
const datahydrateIdColumn = datahydrateColumns.find((column) => column.name === "id");
const datahydrateComponentColumn = datahydrateColumns.find((column) => column.name === "component");
const shouldRebuildDatahydrate =
  !datahydrateColumnNames.has("id") ||
  !datahydrateColumnNames.has("idproyecto") ||
  !datahydrateColumnNames.has("component") ||
  datahydrateComponentColumn?.type.toUpperCase() !== "INTEGER" ||
  datahydrateIdColumn?.type.toUpperCase() !== "INTEGER" ||
  datahydrateIdColumn.pk !== 1;

if (shouldRebuildDatahydrate) {
  client.exec("DROP TABLE IF EXISTS imin.datahydrate_next");
  createDatahydrateTable("datahydrate_next");

  const selectId = datahydrateColumnNames.has("id") ? "CAST(id AS INTEGER)" : "NULL";
  const selectIdproyecto = datahydrateColumnNames.has("idproyecto")
    ? "COALESCE(CAST(idproyecto AS INTEGER), 1)"
    : "1";
  const selectComponent = datahydrateColumnNames.has("component")
    ? `
      COALESCE(
        (
          SELECT id
          FROM imin.component
          WHERE id = CAST(imin.datahydrate.component AS INTEGER)
             OR nombre = imin.datahydrate.component
          LIMIT 1
        ),
        1
      )
    `
    : "1";
  const selectLabel = datahydrateColumnNames.has("label") ? "label" : "''";
  const selectDescripcion = datahydrateColumnNames.has("descripcion") ? "descripcion" : "NULL";

  client.exec(`
    INSERT INTO imin.datahydrate_next (id, idproyecto, component, label, descripcion)
    SELECT ${selectId}, ${selectIdproyecto}, ${selectComponent}, ${selectLabel}, ${selectDescripcion}
    FROM imin.datahydrate
  `);
  client.exec("DROP TABLE imin.datahydrate");
  client.exec("ALTER TABLE imin.datahydrate_next RENAME TO datahydrate");
}

const seedDatahydrate = client.prepare(`
  INSERT INTO imin.datahydrate (idproyecto, component, label, descripcion)
  SELECT @idproyecto, @component, @label, @descripcion
  WHERE NOT EXISTS (
    SELECT 1
    FROM imin.datahydrate
    WHERE idproyecto = @idproyecto
      AND component = @component
      AND label = @label
  )
`);

client.exec(`
  DELETE FROM imin.datahydrate
  WHERE component = 1
    AND label LIKE 'href\\_%' ESCAPE '\\'
`);

client.exec(`
  CREATE VIEW IF NOT EXISTS imin.datahydrate_view AS
  SELECT
    datahydrate.id,
    datahydrate.idproyecto,
    proyecto.nombre AS proyecto,
    datahydrate.component AS idcomponent,
    component.nombre AS component,
    datahydrate.label,
    datahydrate.descripcion
  FROM datahydrate
  INNER JOIN proyecto ON proyecto.id = datahydrate.idproyecto
  INNER JOIN component ON component.id = datahydrate.component
`);

[
  ["index_one", "Planes"],
  ["index_two", "Horarios"],
  ["index_three", "Agenda"],
  ["index_four", "Cobros"],
  ["index_five", "Contacto"],
].forEach(([label, descripcion]) => {
  seedDatahydrate.run({
    idproyecto: 1,
    component: 1,
    label,
    descripcion,
  });
});

[
  ["small_reference", "Sistema integral de membresías"],
  ["h1_reference", "Agenda tu cita y conócenos"],
  [
    "p_reference",
    "Construye una experiencia premium con planes semanales, quincenales y mensuales. Automatiza cobros y permite que tus clientes reserven en segundos.",
  ],
  ["button_plans", "Ver Planes"],
  ["button_book", "¡Reserva Ahora!"],
  ["stats_one", "Clientes"],
  ["stats_two", "Ocupación"],
  ["stats_three", "Clases"],
  ["stats_label_one", "+100"],
  ["stats_label_two", "Media"],
  ["stats_label_three", "Pilates"],
  ["small_start", "Comienza un nuevo reto"],
  ["h2_start", "Reforma y progresa"],
  ["quick_eyebrow", "Inicio rápido"],
  ["quick_title", "Continuar configuración"],
  ["quick_step", "02"],
  ["quick_card_label", "Siguiente paso recomendado"],
  ["quick_card_title", "Define horarios y capacidad"],
  [
    "quick_card_description",
    "Elige cuántas sesiones puede reservar cada plan y bloquea los turnos del staff.",
  ],
  ["flow_one_title", "Configura planes y cupos"],
  [
    "flow_one_description",
    "Define sesiones, límite de reservas y reglas de reprogramación por plan.",
  ],
  ["flow_two_title", "Automatiza cobros"],
  [
    "flow_two_description",
    "Mensualidades recurrentes, facturas y recordatorios en un solo lugar.",
  ],
  ["flow_three_title", "Agenda inteligente"],
  [
    "flow_three_description",
    "El cliente reserva en tiempo real y recibe confirmación inmediata.",
  ],
  ["flow_four_title", "Seguimiento continuo"],
  [
    "flow_four_description",
    "Notas por clase, evolución y renovación automática de planes.",
  ],
  ["quick_button", "Continuar"],
  ["booking_customer_placeholder", "Nombre del cliente"],
  ["plans_eyebrow", "Planes Studio 57"],
  ["plans_title", "Elige tu frecuencia de práctica"],
  [
    "plans_description",
    "Aparte de las frecuencias de cobro, estos son los planes que puedes ofrecer en el estudio con sus precios por modalidad.",
  ],
  ["plans_image_caption", "Foto del estudio · reemplazar imagen"],
  ["plans_card_one_name", "Plan Equilibrio"],
  ["plans_card_one_frequency", "3 clases por semana"],
  ["plans_card_one_schedule", "Lunes, Miércoles y Viernes · Martes, Jueves y Sábado"],
  ["plans_card_one_price_weekly", "$400"],
  ["plans_card_one_price_biweekly", "$700"],
  ["plans_card_one_price_monthly", "$1350"],
  ["plans_card_two_name", "Plan Vitalidad"],
  ["plans_card_two_frequency", "5 clases por semana"],
  ["plans_card_two_schedule", "Lunes a Viernes"],
  ["plans_card_two_price_weekly", "$650"],
  ["plans_card_two_price_biweekly", "$1150"],
  ["plans_card_two_price_monthly", "$2200"],
  ["plans_price_label", "Precio por clase"],
  ["plans_price_value", "$140"],
  ["cadence_semanal", "Semanal"],
  ["cadence_quincenal", "Quincenal"],
  ["cadence_mensual", "Mensual"],
  ["schedule_badge", "Horarios Pilates"],
  ["schedule_image_eyebrow", "Sesiones de 60 minutos"],
  ["schedule_image_title", "Agenda optimizada para reservar rapido."],
  ["schedule_eyebrow", "Horarios del calendario"],
  ["schedule_title", "Bloques claros, reservables y visuales."],
  ["schedule_description", "Matutino y vespertino listos para que el cliente elija rapido."],
  ["schedule_morning_title", "Matutino"],
  ["schedule_evening_title", "Vespertino"],
  ["schedule_morning_one", "7:00 AM - 8:00 AM"],
  ["schedule_morning_two", "8:00 AM - 9:00 AM"],
  ["schedule_morning_three", "9:00 AM - 10:00 AM"],
  ["schedule_morning_four", "10:00 AM - 11:00 AM"],
  ["schedule_evening_one", "5:00 PM - 6:00 PM"],
  ["schedule_evening_two", "6:00 PM - 7:00 PM"],
  ["schedule_evening_three", "7:00 PM - 8:00 PM"],
  ["schedule_evening_four", "8:00 PM - 9:00 PM"],
  ["schedule_note", "Clases de 60 minutos con disponibilidad en tiempo real."],
  ["schedule_button_agenda", "Reservar en agenda"],
  ["schedule_button_plans", "Ver planes"],
  ["agenda_eyebrow", "Agenda inteligente"],
  ["agenda_title", "Reservas en tiempo real para clientes y equipo."],
  [
    "agenda_description",
    "El calendario permite seleccionar horarios, bloquear cupos y mantener la disponibilidad siempre actualizada.",
  ],
  ["booking_eyebrow", "Reserva rápida"],
  ["booking_title_selected", "Confirma la sesión"],
  ["booking_title_empty", "Selecciona un horario"],
  ["booking_start_prefix", "Inicio:"],
  ["booking_empty_description", "Elige un bloque en el calendario para reservar."],
  ["booking_customer_label", "Cliente"],
  ["booking_frequency_label", "Frecuencia"],
  [
    "booking_selected_note",
    "Reserva lista para confirmar. Se enviará recordatorio automático 24 h antes.",
  ],
  [
    "booking_empty_note",
    "Selecciona un horario y confirma para bloquear la sesión en el calendario.",
  ],
  ["booking_confirm_button", "Confirmar reserva"],
].forEach(([label, descripcion]) => {
  seedDatahydrate.run({
    idproyecto: 1,
    component: 2,
    label,
    descripcion,
  });
});

[
  ["brand_initials", "PR"],
  ["brand_name", "Pilates Reformer Studio"],
  ["brand_subtitle", "Planes · Cobros · Reservas"],
  ["mobile_menu_title", "Menú"],
  ["mobile_menu_brand", "Pilates Reformer"],
  ["mobile_menu_close", "Cerrar"],
  ["logo_alt", "Pilates Reformer"],
  ["menu_aria_label", "Abrir menú"],
  [
    "description",
    "Una base elegante para gestionar membresías, control de pagos y reservas en tiempo real.",
  ],
  ["explore_title", "Explorar"],
  ["contact_title", "Contacto"],
  ["email", "hola@pilatesreformer.com"],
  ["phone", "+52 55 1234 5678"],
  ["demo_button", "Agendar demo"],
  ["studio_placeholder", "Nombre del estudio"],
  ["email_placeholder", "Correo de contacto"],
  ["message_placeholder", "Cuéntanos qué necesitas integrar"],
  ["copyright", "© 2026 Pilates Reformer Studio. Todos los derechos reservados."],
  ["policy", "Políticas"],
  ["privacy", "Privacidad"],
  ["support", "Soporte"],
].forEach(([label, descripcion]) => {
  seedDatahydrate.run({
    idproyecto: 1,
    component: 3,
    label,
    descripcion,
  });
});

export const db = drizzle(client, { schema });
