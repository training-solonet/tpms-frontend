-- =========================
-- Extensions
-- =========================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- Fleet grouping (opsional, untuk site/region)
-- =========================
CREATE TABLE IF NOT EXISTS fleet_group (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  site        TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  created_by  UUID,
  updated_by  UUID
);

-- =========================
-- Master: Truck
-- =========================
CREATE TABLE IF NOT EXISTS truck (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number      TEXT UNIQUE NOT NULL,
  vin               TEXT UNIQUE,
  name              TEXT,
  model             TEXT,
  year              INT,
  tire_config       TEXT, -- misalnya "10 ban"
  fleet_group_id    UUID REFERENCES fleet_group(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID,
  updated_by        UUID
);

-- =========================
-- Device (gateway IoT, bisa auto-register dari data sensor)
-- =========================
CREATE TABLE IF NOT EXISTS device (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id    UUID REFERENCES truck(id),  -- nullable, bisa di-assign nanti
  sn          TEXT UNIQUE NOT NULL,       -- SN device dari JSON
  sim_number  TEXT,                       -- dari JSON simNumber
  status      TEXT DEFAULT 'unregistered' CHECK (status IN ('registered','unregistered','inactive')),
  first_seen  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
  installed_at TIMESTAMPTZ,
  removed_at   TIMESTAMPTZ,
  created_by   UUID,
  updated_by   UUID
);
CREATE INDEX IF NOT EXISTS idx_device_sn ON device (sn);
CREATE INDEX IF NOT EXISTS idx_device_sim_number ON device (sim_number);
CREATE INDEX IF NOT EXISTS idx_device_status ON device (status);

-- =========================
-- Tire position mapping (untuk fleksibilitas tireNo)
-- =========================
CREATE TABLE IF NOT EXISTS tire_position_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id    UUID REFERENCES truck(id),
  tire_no     INT NOT NULL,               -- dari JSON tireNo
  position_name TEXT,                     -- "Front Left", "Rear Right 1", etc
  wheel_type  TEXT CHECK (wheel_type IN ('steer','drive','trailer')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(truck_id, tire_no)
);

-- =========================
-- Raw sensor data (semua data masuk sini dulu)
-- =========================
CREATE TABLE IF NOT EXISTS sensor_data_raw (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_sn     TEXT NOT NULL,             -- dari JSON sn
  cmd_type      TEXT NOT NULL,             -- "tpdata", "hubdata", "device", "state"
  truck_id      UUID REFERENCES truck(id), -- nullable, bisa di-assign nanti
  tire_no       INT,                       -- dari JSON tireNo
  raw_json      JSONB NOT NULL,            -- simpan semua data JSON
  processed     BOOLEAN DEFAULT FALSE,     -- flag untuk processing
  received_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sensor_data_raw_device_sn ON sensor_data_raw (device_sn, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_raw_cmd_type ON sensor_data_raw (cmd_type, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_raw_processed ON sensor_data_raw (processed, received_at DESC);

-- =========================
-- Tire pressure events (processed dari raw data)
-- =========================
CREATE TABLE IF NOT EXISTS tire_pressure_event (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_data_id   UUID REFERENCES sensor_data_raw(id),
  device_sn     TEXT NOT NULL,
  truck_id      UUID REFERENCES truck(id),
  tire_no       INT NOT NULL,              -- nomor ban dari JSON
  pressure_kpa  REAL,                      -- tiprValue
  temp_celsius  REAL,                      -- tempValue
  ex_type       TEXT,                      -- "1,3" format
  battery_level SMALLINT,                  -- bat
  sim_number    TEXT,                      -- simNumber
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- Hub temperature events (processed dari raw data)
-- =========================
CREATE TABLE IF NOT EXISTS hub_temperature_event (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_data_id   UUID REFERENCES sensor_data_raw(id),
  device_sn     TEXT NOT NULL,
  truck_id      UUID REFERENCES truck(id),
  tire_no       INT NOT NULL,              -- hub nomor dari JSON
  temp_celsius  REAL,                      -- tempValue
  ex_type       TEXT,                      -- exception types
  battery_level SMALLINT,                  -- bat
  sim_number    TEXT,                      -- simNumber
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- Geofence
-- =========================
CREATE TABLE IF NOT EXISTS geofence (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  area              GEOGRAPHY(MULTIPOLYGON, 4326) NOT NULL,
  created_by        UUID,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- GPS positions (partitioned) - Enhanced for direct tracking
-- =========================
CREATE TABLE IF NOT EXISTS gps_position (
  id          BIGSERIAL,
  device_sn   TEXT NOT NULL,                    -- langsung dari JSON sn
  device_id   UUID REFERENCES device(id),       -- optional jika device terdaftar
  truck_id    UUID REFERENCES truck(id),        -- bisa null jika belum di-assign
  ts          TIMESTAMPTZ NOT NULL,
  pos         GEOGRAPHY(POINT, 4326) NOT NULL,
  longitude   DECIMAL(10,7) NOT NULL,           -- lng dari JSON untuk query mudah
  latitude    DECIMAL(10,7) NOT NULL,           -- lat dari JSON untuk query mudah
  speed_kph   REAL,
  heading_deg REAL,
  hdop        REAL,                             -- GPS accuracy (lower = better)
  satellites  SMALLINT,                         -- number of satellites
  accuracy_m  REAL,                             -- GPS accuracy in meters
  is_valid    BOOLEAN DEFAULT TRUE,             -- GPS point validity flag
  distance_m  REAL,                             -- distance from previous point
  time_diff_s REAL,                             -- time difference from previous point
  calculated_speed REAL,                        -- speed calculated from distance/time
  host_bat    SMALLINT,                         -- bat1 dari device status
  lock_state  SMALLINT,                         -- lock state saat GPS
  source      TEXT DEFAULT 'iot_device',
  raw_data_id UUID REFERENCES sensor_data_raw(id),
  PRIMARY KEY (id, ts)
) PARTITION BY RANGE (ts);

-- =========================
-- Trip summary
-- =========================
CREATE TABLE IF NOT EXISTS trip (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id          UUID NOT NULL REFERENCES truck(id),
  start_ts          TIMESTAMPTZ NOT NULL,
  end_ts            TIMESTAMPTZ,
  start_pos         GEOGRAPHY(POINT,4326),
  end_pos           GEOGRAPHY(POINT,4326)
);

-- =========================
-- Device status (dari JSON cmd=device)
-- =========================
CREATE TABLE IF NOT EXISTS device_status_event (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_data_id   UUID REFERENCES sensor_data_raw(id),
  device_sn     TEXT NOT NULL,
  truck_id      UUID REFERENCES truck(id),
  longitude     DECIMAL(10,7),              -- lng
  latitude      DECIMAL(10,7),              -- lat
  host_bat      SMALLINT,                   -- bat1
  repeater1_bat SMALLINT,                   -- bat2
  repeater2_bat SMALLINT,                   -- bat3
  lock_state    SMALLINT,                   -- lock (0=unlocked,1=locked)
  reported_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- Lock events (dari JSON cmd=state)
-- =========================
CREATE TABLE IF NOT EXISTS lock_event (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_data_id   UUID REFERENCES sensor_data_raw(id),
  device_sn     TEXT NOT NULL,
  truck_id      UUID REFERENCES truck(id),
  is_lock       SMALLINT,                   -- is_lock
  reported_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- Device-Truck assignment history
-- =========================
CREATE TABLE IF NOT EXISTS device_truck_assignment (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_sn   TEXT NOT NULL,
  truck_id    UUID NOT NULL REFERENCES truck(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID,
  removed_at  TIMESTAMPTZ,
  removed_by  UUID,
  notes       TEXT
);

-- =========================
-- Fuel level
-- =========================
CREATE TABLE IF NOT EXISTS fuel_level_event (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id          UUID NOT NULL REFERENCES truck(id),
  fuel_percent      REAL CHECK (fuel_percent >= 0 AND fuel_percent <= 100),
  changed_at        TIMESTAMPTZ NOT NULL,
  source            TEXT
);

-- =========================
-- Speed event
-- =========================
CREATE TABLE IF NOT EXISTS speed_event (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id          UUID NOT NULL REFERENCES truck(id),
  speed_kph         REAL,
  changed_at        TIMESTAMPTZ NOT NULL,
  source            TEXT
);

-- =========================
-- Alerts
-- =========================
CREATE TYPE IF NOT EXISTS alert_type AS ENUM ('LOW_TIRE','SPEEDING','IDLE','GEOFENCE_IN','GEOFENCE_OUT','FUEL_DROP','HIGH_TEMP','DEVICE_LOST');
CREATE TABLE IF NOT EXISTS alert_event (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id          UUID NOT NULL REFERENCES truck(id),
  type              alert_type NOT NULL,
  severity          SMALLINT CHECK (severity BETWEEN 1 AND 5),
  detail            JSONB,
  occurred_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged      BOOLEAN NOT NULL DEFAULT FALSE
);

-- =========================
-- Auto-register function untuk device baru
-- =========================
CREATE OR REPLACE FUNCTION auto_register_device(p_device_sn TEXT, p_sim_number TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    device_uuid UUID;
BEGIN
    -- Cek apakah device sudah ada
    SELECT id INTO device_uuid FROM device WHERE sn = p_device_sn;
    
    -- Jika belum ada, buat baru
    IF device_uuid IS NULL THEN
        INSERT INTO device (sn, sim_number, status, first_seen, last_seen)
        VALUES (p_device_sn, p_sim_number, 'unregistered', now(), now())
        RETURNING id INTO device_uuid;
    ELSE
        -- Update last_seen dan sim_number jika ada
        UPDATE device 
        SET last_seen = now(),
            sim_number = COALESCE(p_sim_number, sim_number)
        WHERE id = device_uuid;
    END IF;
    
    RETURN device_uuid;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- Function untuk assign device ke truck
-- =========================
CREATE OR REPLACE FUNCTION assign_device_to_truck(p_device_sn TEXT, p_truck_id UUID, p_assigned_by UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    device_uuid UUID;
BEGIN
    -- Cari device
    SELECT id INTO device_uuid FROM device WHERE sn = p_device_sn;
    
    IF device_uuid IS NULL THEN
        RAISE EXCEPTION 'Device dengan SN % tidak ditemukan', p_device_sn;
    END IF;
    
    -- Update device
    UPDATE device 
    SET truck_id = p_truck_id, 
        status = 'registered',
        updated_by = p_assigned_by
    WHERE id = device_uuid;
    
    -- Catat assignment history
    INSERT INTO device_truck_assignment (device_sn, truck_id, assigned_by)
    VALUES (p_device_sn, p_truck_id, p_assigned_by);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- Function untuk sync GPS dari device_status_event dengan validasi dan smoothing
-- =========================
CREATE OR REPLACE FUNCTION sync_gps_from_device_status()
RETURNS TRIGGER AS $$
DECLARE
    is_valid_gps BOOLEAN;
    last_pos RECORD;
    distance_m REAL;
    time_diff_s REAL;
    calculated_speed REAL;
    smooth_heading REAL;
BEGIN
    -- Insert ke gps_position jika ada longitude/latitude
    IF NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL THEN
        -- Validate GPS point
        is_valid_gps := validate_gps_point(
            NEW.device_sn, 
            NEW.longitude, 
            NEW.latitude,
            NULL, -- speed not available from device status
            NULL, -- hdop not available
            NULL  -- accuracy not available
        );
        
        -- Get last position for distance/speed calculation
        SELECT longitude, latitude, ts INTO last_pos
        FROM gps_position 
        WHERE device_sn = NEW.device_sn AND is_valid = TRUE
        ORDER BY ts DESC 
        LIMIT 1;
        
        -- Calculate distance and time difference
        IF last_pos IS NOT NULL THEN
            distance_m := ST_Distance(
                ST_SetSRID(ST_MakePoint(last_pos.longitude, last_pos.latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography
            );
            time_diff_s := EXTRACT(EPOCH FROM (NEW.reported_at - last_pos.ts));
            
            -- Calculate speed from distance/time
            IF time_diff_s > 0 THEN
                calculated_speed := (distance_m / time_diff_s) * 3.6; -- convert to km/h
            END IF;
        END IF;
        
        -- Calculate smooth heading
        smooth_heading := calculate_smooth_heading(NEW.device_sn, NEW.longitude, NEW.latitude);
        
        INSERT INTO gps_position (
            device_sn, device_id, truck_id, ts, pos, longitude, latitude,
            distance_m, time_diff_s, calculated_speed, heading_deg,
            host_bat, lock_state, source, raw_data_id, is_valid
        ) VALUES (
            NEW.device_sn,
            (SELECT id FROM device WHERE sn = NEW.device_sn),
            NEW.truck_id,
            NEW.reported_at,
            ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography,
            NEW.longitude,
            NEW.latitude,
            distance_m,
            time_diff_s,
            calculated_speed,
            smooth_heading,
            NEW.host_bat,
            NEW.lock_state,
            'device_status',
            NEW.raw_data_id,
            is_valid_gps
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-sync GPS
DROP TRIGGER IF EXISTS trigger_sync_gps_from_device_status ON device_status_event;
CREATE TRIGGER trigger_sync_gps_from_device_status
    AFTER INSERT ON device_status_event
    FOR EACH ROW
    EXECUTE FUNCTION sync_gps_from_device_status();

-- =========================
-- Function untuk processing sensor data raw
-- =========================
CREATE OR REPLACE FUNCTION process_sensor_data_raw()
RETURNS TRIGGER AS $$
DECLARE
    json_data JSONB;
    device_uuid UUID;
    truck_uuid UUID;
BEGIN
    json_data := NEW.raw_json;
    
    -- Auto-register device jika belum ada
    SELECT auto_register_device(
        NEW.device_sn, 
        json_data->'data'->>'simNumber'
    ) INTO device_uuid;
    
    -- Cari truck_id jika device sudah di-assign
    SELECT truck_id INTO truck_uuid FROM device WHERE sn = NEW.device_sn;
    
    -- Update truck_id di raw data jika ditemukan
    IF truck_uuid IS NOT NULL THEN
        UPDATE sensor_data_raw SET truck_id = truck_uuid WHERE id = NEW.id;
    END IF;
    
    -- Process berdasarkan cmd_type
    CASE NEW.cmd_type
        WHEN 'device' THEN
            -- Insert device status event
            INSERT INTO device_status_event (
                raw_data_id, device_sn, truck_id, longitude, latitude,
                host_bat, repeater1_bat, repeater2_bat, lock_state, reported_at
            ) VALUES (
                NEW.id, NEW.device_sn, truck_uuid,
                (json_data->'data'->>'lng')::DECIMAL(10,7),
                (json_data->'data'->>'lat')::DECIMAL(10,7),
                (json_data->'data'->>'bat1')::SMALLINT,
                (json_data->'data'->>'bat2')::SMALLINT,
                (json_data->'data'->>'bat3')::SMALLINT,
                (json_data->'data'->>'lock')::SMALLINT,
                NEW.received_at
            );
            
        WHEN 'tpdata' THEN
            -- Insert tire pressure event
            INSERT INTO tire_pressure_event (
                raw_data_id, device_sn, truck_id, tire_no, pressure_kpa,
                temp_celsius, ex_type, battery_level, sim_number, changed_at
            ) VALUES (
                NEW.id, NEW.device_sn, truck_uuid,
                (json_data->'data'->>'tireNo')::INT,
                (json_data->'data'->>'tiprValue')::REAL,
                (json_data->'data'->>'tempValue')::REAL,
                json_data->'data'->>'exType',
                (json_data->'data'->>'bat')::SMALLINT,
                json_data->'data'->>'simNumber',
                NEW.received_at
            );
            
        WHEN 'hubdata' THEN
            -- Insert hub temperature event
            INSERT INTO hub_temperature_event (
                raw_data_id, device_sn, truck_id, tire_no, temp_celsius,
                ex_type, battery_level, sim_number, changed_at
            ) VALUES (
                NEW.id, NEW.device_sn, truck_uuid,
                (json_data->'data'->>'tireNo')::INT,
                (json_data->'data'->>'tempValue')::REAL,
                json_data->'data'->>'exType',
                (json_data->'data'->>'bat')::SMALLINT,
                json_data->'data'->>'simNumber',
                NEW.received_at
            );
            
        WHEN 'state' THEN
            -- Insert lock event
            INSERT INTO lock_event (
                raw_data_id, device_sn, truck_id, is_lock, reported_at
            ) VALUES (
                NEW.id, NEW.device_sn, truck_uuid,
                (json_data->'data'->>'is_lock')::SMALLINT,
                NEW.received_at
            );
    END CASE;
    
    -- Mark as processed
    UPDATE sensor_data_raw SET processed = TRUE, processed_at = now() WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-processing
DROP TRIGGER IF EXISTS trigger_process_sensor_data_raw ON sensor_data_raw;
CREATE TRIGGER trigger_process_sensor_data_raw
    AFTER INSERT ON sensor_data_raw
    FOR EACH ROW
    EXECUTE FUNCTION process_sensor_data_raw();

-- =========================
-- GPS Smoothing Functions untuk tracking yang smooth
-- =========================

-- Function untuk validasi GPS point
CREATE OR REPLACE FUNCTION validate_gps_point(
    p_device_sn TEXT,
    p_longitude DECIMAL(10,7),
    p_latitude DECIMAL(10,7),
    p_speed_kph REAL DEFAULT NULL,
    p_hdop REAL DEFAULT NULL,
    p_accuracy_m REAL DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    last_pos RECORD;
    distance_m REAL;
    time_diff_s REAL;
    max_speed_kph REAL := 120; -- maksimal speed untuk truck
    max_distance_jump_m REAL := 1000; -- maksimal jump distance dalam meter
BEGIN
    -- Basic coordinate validation
    IF p_longitude IS NULL OR p_latitude IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Coordinate range validation
    IF p_longitude < -180 OR p_longitude > 180 OR p_latitude < -90 OR p_latitude > 90 THEN
        RETURN FALSE;
    END IF;
    
    -- HDOP validation (lower is better, >20 is usually bad)
    IF p_hdop IS NOT NULL AND p_hdop > 20 THEN
        RETURN FALSE;
    END IF;
    
    -- Accuracy validation (>100m is usually bad for tracking)
    IF p_accuracy_m IS NOT NULL AND p_accuracy_m > 100 THEN
        RETURN FALSE;
    END IF;
    
    -- Get last valid position for distance/speed validation
    SELECT longitude, latitude, ts INTO last_pos
    FROM gps_position 
    WHERE device_sn = p_device_sn AND is_valid = TRUE
    ORDER BY ts DESC 
    LIMIT 1;
    
    IF last_pos IS NOT NULL THEN
        -- Calculate distance from last position
        distance_m := ST_Distance(
            ST_SetSRID(ST_MakePoint(last_pos.longitude, last_pos.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
        );
        
        -- Calculate time difference
        time_diff_s := EXTRACT(EPOCH FROM (now() - last_pos.ts));
        
        -- Reject if distance jump is too large (teleportation detection)
        IF distance_m > max_distance_jump_m AND time_diff_s < 60 THEN
            RETURN FALSE;
        END IF;
        
        -- Reject if calculated speed is unrealistic
        IF time_diff_s > 0 THEN
            DECLARE calculated_speed_kph REAL := (distance_m / time_diff_s) * 3.6;
            IF calculated_speed_kph > max_speed_kph THEN
                RETURN FALSE;
            END IF;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function untuk smoothing GPS positions menggunakan moving average
CREATE OR REPLACE FUNCTION smooth_gps_positions(p_device_sn TEXT, p_window_size INT DEFAULT 5)
RETURNS TABLE(
    device_sn TEXT,
    ts TIMESTAMPTZ,
    longitude DECIMAL(10,7),
    latitude DECIMAL(10,7),
    smoothed_longitude DECIMAL(10,7),
    smoothed_latitude DECIMAL(10,7),
    heading_deg REAL,
    speed_kph REAL
) AS $$
BEGIN
    RETURN QUERY
    WITH windowed_positions AS (
        SELECT 
            gp.device_sn,
            gp.ts,
            gp.longitude,
            gp.latitude,
            gp.speed_kph,
            gp.heading_deg,
            -- Moving average untuk smoothing
            AVG(gp.longitude) OVER (
                PARTITION BY gp.device_sn 
                ORDER BY gp.ts 
                ROWS BETWEEN (p_window_size-1) PRECEDING AND CURRENT ROW
            )::DECIMAL(10,7) AS smoothed_longitude,
            AVG(gp.latitude) OVER (
                PARTITION BY gp.device_sn 
                ORDER BY gp.ts 
                ROWS BETWEEN (p_window_size-1) PRECEDING AND CURRENT ROW
            )::DECIMAL(10,7) AS smoothed_latitude,
            -- Calculate heading from smoothed positions
            LAG(gp.longitude) OVER (PARTITION BY gp.device_sn ORDER BY gp.ts) AS prev_lng,
            LAG(gp.latitude) OVER (PARTITION BY gp.device_sn ORDER BY gp.ts) AS prev_lat
        FROM gps_position gp
        WHERE gp.device_sn = p_device_sn 
        AND gp.is_valid = TRUE
        AND gp.ts > (now() - INTERVAL '1 hour') -- last hour only
        ORDER BY gp.ts
    )
    SELECT 
        wp.device_sn,
        wp.ts,
        wp.longitude,
        wp.latitude,
        wp.smoothed_longitude,
        wp.smoothed_latitude,
        -- Calculate smooth heading
        CASE 
            WHEN wp.prev_lng IS NOT NULL AND wp.prev_lat IS NOT NULL THEN
                degrees(ST_Azimuth(
                    ST_MakePoint(wp.prev_lng, wp.prev_lat),
                    ST_MakePoint(wp.smoothed_longitude, wp.smoothed_latitude)
                ))::REAL
            ELSE wp.heading_deg
        END AS heading_deg,
        wp.speed_kph
    FROM windowed_positions wp;
END;
$$ LANGUAGE plpgsql;

-- Function untuk kalkulasi heading yang smooth
CREATE OR REPLACE FUNCTION calculate_smooth_heading(
    p_device_sn TEXT,
    p_current_lng DECIMAL(10,7),
    p_current_lat DECIMAL(10,7)
) RETURNS REAL AS $$
DECLARE
    prev_positions RECORD;
    heading_deg REAL;
BEGIN
    -- Get average of last 3 positions for smooth heading calculation
    SELECT 
        AVG(longitude) as avg_lng,
        AVG(latitude) as avg_lat
    INTO prev_positions
    FROM (
        SELECT longitude, latitude
        FROM gps_position 
        WHERE device_sn = p_device_sn 
        AND is_valid = TRUE
        ORDER BY ts DESC 
        LIMIT 3 OFFSET 1  -- skip current position
    ) recent_pos;
    
    IF prev_positions.avg_lng IS NOT NULL THEN
        heading_deg := degrees(ST_Azimuth(
            ST_MakePoint(prev_positions.avg_lng, prev_positions.avg_lat),
            ST_MakePoint(p_current_lng, p_current_lat)
        ));
        
        -- Normalize to 0-360 degrees
        IF heading_deg < 0 THEN
            heading_deg := heading_deg + 360;
        END IF;
        
        RETURN heading_deg;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- Daily routes
-- =========================
CREATE TABLE IF NOT EXISTS daily_route (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id          UUID NOT NULL REFERENCES truck(id),
  route_date        DATE NOT NULL,
  geom              GEOGRAPHY(LINESTRING, 4326) NOT NULL,
  point_count       INT NOT NULL,
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (truck_id, route_date)
);

-- =========================
-- Partition function for gps_position
-- =========================
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

-- =========================
-- Views untuk tracking dengan GPS smoothing
-- =========================
CREATE OR REPLACE VIEW latest_truck_position AS
SELECT 
    COALESCE(t.id, d.truck_id) AS truck_id,
    COALESCE(t.name, 'Unassigned') AS truck_name,
    COALESCE(t.plate_number, 'Unknown') AS plate_number,
    p.device_sn,
    p.ts AS last_update,
    p.longitude,
    p.latitude,
    p.calculated_speed AS speed_kph,
    p.heading_deg,
    p.host_bat,
    p.lock_state,
    p.is_valid,
    CASE 
        WHEN p.ts > (now() - INTERVAL '5 minutes') THEN 'online'
        WHEN p.ts > (now() - INTERVAL '30 minutes') THEN 'idle'
        ELSE 'offline'
    END AS status
FROM (
    SELECT DISTINCT ON (device_sn) 
        device_sn, device_id, truck_id, ts, longitude, latitude,
        calculated_speed, heading_deg, host_bat, lock_state, is_valid
    FROM gps_position 
    WHERE is_valid = TRUE  -- only show valid GPS points
    ORDER BY device_sn, ts DESC
) p
LEFT JOIN device d ON d.sn = p.device_sn
LEFT JOIN truck t ON t.id = COALESCE(p.truck_id, d.truck_id);

-- View untuk smoothed tracking positions (untuk frontend yang smooth)
CREATE OR REPLACE VIEW smoothed_truck_tracking AS
SELECT 
    COALESCE(t.id, d.truck_id) AS truck_id,
    COALESCE(t.name, 'Unassigned') AS truck_name,
    COALESCE(t.plate_number, 'Unknown') AS plate_number,
    sp.device_sn,
    sp.ts,
    sp.smoothed_longitude AS longitude,
    sp.smoothed_latitude AS latitude,
    sp.heading_deg,
    sp.speed_kph,
    CASE 
        WHEN sp.ts > (now() - INTERVAL '1 minute') THEN 'real_time'
        WHEN sp.ts > (now() - INTERVAL '5 minutes') THEN 'recent'
        WHEN sp.ts > (now() - INTERVAL '30 minutes') THEN 'delayed'
        ELSE 'offline'
    END AS tracking_status
FROM smooth_gps_positions(NULL, 5) sp  -- 5-point moving average
LEFT JOIN device d ON d.sn = sp.device_sn
LEFT JOIN truck t ON t.id = d.truck_id
WHERE sp.ts > (now() - INTERVAL '2 hours')  -- last 2 hours
ORDER BY sp.device_sn, sp.ts DESC;

-- View untuk real-time tracking semua truck dengan sensor data
CREATE OR REPLACE VIEW real_time_truck_tracking AS
SELECT 
    ltp.*,
    tpe.pressure_avg,
    tpe.temp_avg,
    hte.hub_temp_avg,
    CASE 
        WHEN ltp.last_update > (now() - INTERVAL '1 minute') THEN 'real_time'
        WHEN ltp.last_update > (now() - INTERVAL '5 minutes') THEN 'recent'
        WHEN ltp.last_update > (now() - INTERVAL '30 minutes') THEN 'delayed'
        ELSE 'offline'
    END AS tracking_status
FROM latest_truck_position ltp
LEFT JOIN (
    SELECT device_sn, 
           AVG(pressure_kpa) as pressure_avg,
           AVG(temp_celsius) as temp_avg
    FROM tire_pressure_event 
    WHERE changed_at > (now() - INTERVAL '1 hour')
    GROUP BY device_sn
) tpe ON tpe.device_sn = ltp.device_sn
LEFT JOIN (
    SELECT device_sn, AVG(temp_celsius) as hub_temp_avg
    FROM hub_temperature_event 
    WHERE changed_at > (now() - INTERVAL '1 hour')
    GROUP BY device_sn
) hte ON hte.device_sn = ltp.device_sn;

-- View untuk route history yang smooth (untuk menampilkan jalur perjalanan)
CREATE OR REPLACE VIEW smooth_route_history AS
SELECT 
    device_sn,
    truck_id,
    DATE(ts) as route_date,
    ST_MakeLine(
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geometry 
        ORDER BY ts
    ) as route_geom,
    COUNT(*) as point_count,
    MIN(ts) as start_time,
    MAX(ts) as end_time,
    AVG(calculated_speed) as avg_speed_kph
FROM gps_position
WHERE is_valid = TRUE 
AND ts > (now() - INTERVAL '7 days')  -- last week
GROUP BY device_sn, truck_id, DATE(ts)
HAVING COUNT(*) >= 10  -- minimum 10 points untuk membuat route
ORDER BY device_sn, route_date DESC;

-- =========================
-- Index tuning untuk tracking
-- =========================
CREATE INDEX IF NOT EXISTS idx_gps_position_device_sn_ts ON gps_position (device_sn, ts DESC);
CREATE INDEX IF NOT EXISTS idx_gps_position_truck_ts ON gps_position (truck_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_gps_position_pos ON gps_position USING GIST (pos);
CREATE INDEX IF NOT EXISTS idx_gps_position_longitude_latitude ON gps_position (longitude, latitude);
CREATE INDEX IF NOT EXISTS idx_device_status_event_device_sn ON device_status_event (device_sn, reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_tire_pressure_event_device_sn ON tire_pressure_event (device_sn, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_hub_temperature_event_device_sn ON hub_temperature_event (device_sn, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_lock_event_device_sn ON lock_event (device_sn, reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_raw_device_sn ON sensor_data_raw (device_sn, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_raw_cmd_type ON sensor_data_raw (cmd_type, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_raw_processed ON sensor_data_raw (processed, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_level_event_truck_ts ON fuel_level_event (truck_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_speed_event_truck_ts ON speed_event (truck_id, changed_at DESC);