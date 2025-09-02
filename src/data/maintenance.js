// Dummy data for maintenance orders and items

export const maintenanceOrders = [
  {
    id: "maint_order_001",
    truck_id: "550e8400-e29b-41d4-a716-446655440001",
    title: "Routine Engine Service",
    description: "Regular engine oil change and filter replacement",
    status: "completed",
    opened_at: "2024-08-15T08:00:00Z",
    closed_at: "2024-08-15T16:30:00Z"
  },
  {
    id: "maint_order_002", 
    truck_id: "550e8400-e29b-41d4-a716-446655440002",
    title: "Tire Replacement - Front Left",
    description: "Replace worn front left tire due to low pressure alerts",
    status: "in_progress",
    opened_at: "2024-08-28T10:15:00Z",
    closed_at: null
  },
  {
    id: "maint_order_003",
    truck_id: "550e8400-e29b-41d4-a716-446655440003",
    title: "Brake System Inspection",
    description: "Comprehensive brake system check due to speeding incidents",
    status: "open",
    opened_at: "2024-08-30T14:20:00Z",
    closed_at: null
  },
  {
    id: "maint_order_004",
    truck_id: "550e8400-e29b-41d4-a716-446655440004",
    title: "Fuel System Diagnostic",
    description: "Investigate fuel consumption irregularities",
    status: "open",
    opened_at: "2024-08-29T09:45:00Z",
    closed_at: null
  },
  {
    id: "maint_order_005",
    truck_id: "550e8400-e29b-41d4-a716-446655440005",
    title: "Air Filter Replacement",
    description: "Replace air filter for optimal engine performance",
    status: "completed",
    opened_at: "2024-08-20T11:00:00Z",
    closed_at: "2024-08-20T15:45:00Z"
  }
];

export const maintenanceItems = [
  // Items for maint_order_001 (Engine Service)
  {
    id: "maint_item_001",
    order_id: "maint_order_001",
    part_code: "ENG-OIL-15W40",
    part_name: "Engine Oil 15W-40",
    qty: 12.0,
    cost: 480000.00
  },
  {
    id: "maint_item_002",
    order_id: "maint_order_001", 
    part_code: "FILTER-OIL-001",
    part_name: "Oil Filter",
    qty: 1.0,
    cost: 85000.00
  },
  {
    id: "maint_item_003",
    order_id: "maint_order_001",
    part_code: "FILTER-AIR-001",
    part_name: "Air Filter",
    qty: 1.0,
    cost: 125000.00
  },
  // Items for maint_order_002 (Tire Replacement)
  {
    id: "maint_item_004",
    order_id: "maint_order_002",
    part_code: "TIRE-295-80R22.5",
    part_name: "Truck Tire 295/80R22.5",
    qty: 1.0,
    cost: 2850000.00
  },
  {
    id: "maint_item_005",
    order_id: "maint_order_002",
    part_code: "VALVE-STEM-001",
    part_name: "Tire Valve Stem",
    qty: 1.0,
    cost: 25000.00
  },
  // Items for maint_order_003 (Brake Inspection)
  {
    id: "maint_item_006",
    order_id: "maint_order_003",
    part_code: "BRAKE-PAD-FRONT",
    part_name: "Front Brake Pads",
    qty: 1.0,
    cost: 650000.00
  },
  {
    id: "maint_item_007",
    order_id: "maint_order_003",
    part_code: "BRAKE-FLUID-DOT4",
    part_name: "Brake Fluid DOT 4",
    qty: 2.0,
    cost: 180000.00
  },
  // Items for maint_order_005 (Air Filter)
  {
    id: "maint_item_008",
    order_id: "maint_order_005",
    part_code: "FILTER-AIR-HEAVY",
    part_name: "Heavy Duty Air Filter",
    qty: 1.0,
    cost: 165000.00
  }
];

export default {
  maintenanceOrders,
  maintenanceItems
};
