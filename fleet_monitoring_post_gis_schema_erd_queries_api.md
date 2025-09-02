# Fleet Monitoring — Extended Final Schema (PostGIS + IoT + Future-proof)

---

## fleet_schema.sql (FINAL EXTENDED)

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fleet grouping
CREATE TABLE IF NOT EXISTS fleet_group (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  site        TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  created_by  UUID,
  updated_by  UUID
);

-- Master tables
CREATE TABLE IF NOT EXISTS truck (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number      TEXT UNIQUE NOT NULL,
  vin               TEXT UNIQUE,
  name              TEXT,
  model             TEXT,
  year              INT,
  tire_config       TEXT,
  fleet_group_id    UUID REFERENCES fleet_group(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID,
  updated_by        UUID
);

CREATE TABLE IF NOT EXISTS driver (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  employee_id       TEXT UNIQUE,
  phone             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_by        UUID,
  updated_by        UUID
);

-- Device mapping
CREATE TABLE IF NOT EXISTS device (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id    UUID NOT NULL REFERENCES truck(id),
  sn          TEXT UNIQUE NOT NULL,
  sim_number  TEXT,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at   TIMESTAMPTZ,
  created_by   UUID,
  updated_by   UUID
);
CREATE INDEX IF NOT EXISTS idx_device_sn ON device (sn);

-- Sensor mapping
CREATE TABLE IF NOT EXISTS sensor (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   UUID NOT NULL REFERENCES device(id),
  type        TEXT CHECK (type IN ('tire','hub')),
  position_no INT NOT NULL,
  sn          TEXT UNIQUE,
  installed_at TIMESTAMPTZ DEFAULT now(),
  removed_at   TIMESTAMPTZ,
  created_by   UUID,
  updated_by   UUID
);

-- Driver assignments
CREATE TABLE IF NOT EXISTS driver_assignment (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id         UUID NOT NULL REFERENCES driver(id),
  truck_id          UUID NOT NULL REFERENCES truck(id),
  start_at          TIMESTAMPTZ NOT NULL,
  end_at            TIMESTAMPTZ,
  created_by        UUID,
  updated_by        UUID,
  UNIQUE (driver_id, start_at)
);
CREATE INDEX IF NOT EXISTS idx_driver_assignment_truck_start ON driver_assignment (truck_id, start_at DESC);

-- Driver shift
CREATE TABLE IF NOT EXISTS driver_shift (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id   UUID NOT NULL REFERENCES driver(id),
  truck_id    UUID REFERENCES truck(id),
  shift_date  DATE NOT NULL,
  shift_code  TEXT CHECK (shift_code IN ('day','night','custom')),
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ,
  created_by  UUID,
  updated_by  UUID
);

-- Truck status events
CREATE TYPE IF NOT EXISTS truck_status AS ENUM ('active','inactive','maintenance');
CREATE TABLE IF NOT EXISTS truck_status_event (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id          UUID NOT NULL REFERENCES truck(id),
  status            truck_status NOT NULL,
  note              TEXT,
  changed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID
);

-- Geofence
CREATE TABLE IF NOT EXISTS geofence (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  area              GEOGRAPHY(MULTIPOLYGON, 4326) NOT NULL,
  created_by        UUID
);

-- GPS positions (partitioned)
CREATE TABLE IF NOT EXISTS gps_position (
  id          BIGSERIAL PRIMARY KEY,
  device_id   UUID REFERENCES device(id),
  truck_id    UUID NOT NULL REFERENCES truck(id),
  ts          TIMESTAMPTZ NOT NULL,
  pos         GEOGRAPHY(POINT, 4326) NOT NULL,
  speed_kph   REAL,
  heading_deg REAL,
  hdop        REAL,
  source      TEXT
) PARTITION BY RANGE (ts);

-- Trip summary
CREATE TABLE IF NOT EXISTS trip (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id          UUID NOT NULL REFERENCES truck(id),
  start_ts          TIMESTAMPTZ NOT NULL,
  end_ts            TIMESTAMPTZ,
  start_pos         GEOGRAPHY(POINT,4326),
  end_pos           GEOGRAPHY(POINT,4326)
);

-- Tire pressure events
CREATE TABLE IF NOT EXISTS tire_pressure_event (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id     UUID NOT NULL REFERENCES device(id),
  truck_id      UUID NOT NULL REFERENCES truck(id),
  tire_no       INT NOT NULL,
  pressure_kpa  REAL,
  temp_celsius  REAL,
  ex_type       TEXT,
  battery_level SMALLINT,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID
);

-- Tire error lookup
CREATE TABLE IF NOT EXISTS tire_error_code (
  code INT PRIMARY KEY,
  description TEXT
);

-- Hub temperature
CREATE TABLE IF NOT EXISTS hub_temperature_event (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id         UUID NOT NULL REFERENCES device(id),
  truck_id          UUID NOT NULL REFERENCES truck(id),
  hub_no            INT,
  temp_celsius      REAL,
  ex_type           TEXT,
  battery_level     SMALLINT,
  changed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID
);

-- Fuel level
CREATE TABLE IF NOT EXISTS fuel_level_event (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id          UUID NOT NULL REFERENCES truck(id),
  fuel_percent      REAL CHECK (fuel_percent >= 0 AND fuel_percent <= 100),
  changed_at        TIMESTAMPTZ NOT NULL,
  source            TEXT,
  created_by        UUID
);

-- Speed event
CREATE TABLE IF NOT EXISTS speed_event (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id          UUID NOT NULL REFERENCES truck(id),
  speed_kph         REAL,
  changed_at        TIMESTAMPTZ NOT NULL,
  source            TEXT,
  created_by        UUID
);

-- Alerts
CREATE TYPE IF NOT EXISTS alert_type AS ENUM ('LOW_TIRE','SPEEDING','IDLE','GEOFENCE_IN','GEOFENCE_OUT','FUEL_DROP','HIGH_TEMP','DEVICE_LOST');
CREATE TABLE IF NOT EXISTS alert_event (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id          UUID NOT NULL REFERENCES truck(id),
  type              alert_type NOT NULL,
  severity          SMALLINT CHECK (severity BETWEEN 1 AND 5),
  detail            JSONB,
  occurred_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged      BOOLEAN NOT NULL DEFAULT FALSE,
  created_by        UUID
);

-- Maintenance
CREATE TABLE IF NOT EXISTS maintenance_order (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id          UUID NOT NULL REFERENCES truck(id),
  title             TEXT NOT NULL,
  description       TEXT,
  status            TEXT NOT NULL DEFAULT 'open',
  opened_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at         TIMESTAMPTZ,
  created_by        UUID,
  updated_by        UUID
);

CREATE TABLE IF NOT EXISTS maintenance_item (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES maintenance_order(id) ON DELETE CASCADE,
  part_code         TEXT,
  part_name         TEXT,
  qty               NUMERIC(10,2),
  cost              NUMERIC(14,2),
  created_by        UUID
);

-- Device status (latest snapshot)
CREATE TABLE IF NOT EXISTS device_status_event (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id         UUID NOT NULL REFERENCES device(id),
  truck_id          UUID NOT NULL REFERENCES truck(id),
  host_bat          SMALLINT,
  repeater1_bat     SMALLINT,
  repeater2_bat     SMALLINT,
  lock_state        SMALLINT,
  reported_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID
);

-- Lock history
CREATE TABLE IF NOT EXISTS lock_event (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id         UUID NOT NULL REFERENCES device(id),
  truck_id          UUID NOT NULL REFERENCES truck(id),
  is_lock           SMALLINT,
  reported_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID
);

-- Daily routes
CREATE TABLE IF NOT EXISTS daily_route (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id          UUID NOT NULL REFERENCES truck(id),
  route_date        DATE NOT NULL,
  geom              GEOGRAPHY(LINESTRING, 4326) NOT NULL,
  point_count       INT NOT NULL,
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID,
  UNIQUE (truck_id, route_date)
);

-- Partition auto creation
CREATE OR REPLACE FUNCTION create_gps_partition(target_date DATE) RETURNS void AS $$
DECLARE
    start_date DATE := date_trunc('month', target_date)::DATE;
    end_date   DATE := (start_date + INTERVAL '1 month')::DATE;
    partition_name TEXT := format('gps_position_%s', to_char(start_date, 'YYYY_MM'));
    sql TEXT;
BEGIN
    IF to_regclass(partition_name) IS NOT NULL THEN
        RETURN;
    END IF;
    sql := format($f$
        CREATE TABLE %I PARTITION OF gps_position
        FOR VALUES FROM ('%s') TO ('%s');
    $f$, partition_name, start_date, end_date);
    EXECUTE sql;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ensure_partition() RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_gps_partition(NEW.ts::date);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gps_partition_trigger ON gps_position;
CREATE TRIGGER gps_partition_trigger
BEFORE INSERT ON gps_position
FOR EACH ROW EXECUTE FUNCTION ensure_partition();

-- Views
CREATE OR REPLACE VIEW latest_truck_position AS
SELECT t.id AS truck_id,
       t.name AS truck_name,
       p.ts AS last_update,
       ST_X(p.pos::geometry) AS lon,
       ST_Y(p.pos::geometry) AS lat,
       p.speed_kph,
       p.heading_deg
FROM truck t
JOIN LATERAL (
  SELECT ts, pos, speed_kph, heading_deg
  FROM gps_position
  WHERE truck_id = t.id
  ORDER BY ts DESC
  LIMIT 1
) p ON TRUE;

CREATE OR REPLACE VIEW active_driver AS
SELECT da.truck_id,
       d.id AS driver_id,
       d.full_name,
       da.start_at,
       da.end_at
FROM driver_assignment da
JOIN driver d ON d.id = da.driver_id
WHERE da.end_at IS NULL OR da.end_at > now();

-- Function to generate daily route
CREATE OR REPLACE FUNCTION generate_daily_route(truck UUID, route_date DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO daily_route (truck_id, route_date, geom, point_count, created_by)
    SELECT truck, route_date,
           ST_MakeLine(pos::geometry ORDER BY ts)::geography,
           COUNT(*),
           NULL
    FROM gps_position
    WHERE truck_id = truck
      AND ts >= route_date
      AND ts <  (route_date + INTERVAL '1 day')
    ON CONFLICT (truck_id, route_date)
    DO UPDATE
      SET geom = EXCLUDED.geom,
          point_count = EXCLUDED.point_count,
          generated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Index tuning
CREATE INDEX IF NOT EXISTS idx_gps_position_truck_ts ON gps_position (truck_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_gps_position_pos ON gps_position USING GIST (pos);
CREATE INDEX IF NOT EXISTS idx_tire_pressure_event_truck_ts ON tire_pressure_event (truck_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_hub_temperature_event_truck_ts ON hub_temperature_event (truck_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_level_event_truck_ts ON fuel_level_event (truck_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_speed_event_truck_ts ON speed_event (truck_id, changed_at DESC);
```

