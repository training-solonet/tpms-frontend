// Dummy data for geofence table
// Simple UUID generator function
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const geofences = [
  {
    id: "geo1e400-e29b-41d4-a716-446655440001",
    name: "PT Borneo Indobara Main Area",
    area: {
      type: "MultiPolygon",
      coordinates: [[
        [
          [115.570000, -3.510000],
          [115.630000, -3.510000],
          [115.630000, -3.600000],
          [115.570000, -3.600000],
          [115.570000, -3.510000]
        ]
      ]]
    },
    created_by: null
  },
  {
    id: "geo1e400-e29b-41d4-a716-446655440002",
    name: "Mining Pit Area North",
    area: {
      type: "MultiPolygon",
      coordinates: [[
        [
          [115.575000, -3.515000],
          [115.590000, -3.515000],
          [115.590000, -3.535000],
          [115.575000, -3.535000],
          [115.575000, -3.515000]
        ]
      ]]
    },
    created_by: null
  },
  {
    id: "geo1e400-e29b-41d4-a716-446655440003",
    name: "Mining Pit Area South",
    area: {
      type: "MultiPolygon",
      coordinates: [[
        [
          [115.600000, -3.570000],
          [115.620000, -3.570000],
          [115.620000, -3.595000],
          [115.600000, -3.595000],
          [115.600000, -3.570000]
        ]
      ]]
    },
    created_by: null
  },
  {
    id: "geo1e400-e29b-41d4-a716-446655440004",
    name: "Workshop and Maintenance Area",
    area: {
      type: "MultiPolygon",
      coordinates: [[
        [
          [115.585000, -3.575000],
          [115.595000, -3.575000],
          [115.595000, -3.585000],
          [115.585000, -3.585000],
          [115.585000, -3.575000]
        ]
      ]]
    },
    created_by: null
  },
  {
    id: "geo1e400-e29b-41d4-a716-446655440005",
    name: "Fuel Station Area",
    area: {
      type: "MultiPolygon",
      coordinates: [[
        [
          [115.572000, -3.532000],
          [115.578000, -3.532000],
          [115.578000, -3.538000],
          [115.572000, -3.538000],
          [115.572000, -3.532000]
        ]
      ]]
    },
    created_by: null
  },
  {
    id: "geo1e400-e29b-41d4-a716-446655440006",
    name: "Weighbridge Area",
    area: {
      type: "MultiPolygon",
      coordinates: [[
        [
          [115.582000, -3.542000],
          [115.588000, -3.542000],
          [115.588000, -3.548000],
          [115.582000, -3.548000],
          [115.582000, -3.542000]
        ]
      ]]
    },
    created_by: null
  },
  {
    id: "geo1e400-e29b-41d4-a716-446655440007",
    name: "Main Haul Road",
    area: {
      type: "MultiPolygon",
      coordinates: [[
        [
          [115.580000, -3.520000],
          [115.610000, -3.590000],
          [115.612000, -3.588000],
          [115.582000, -3.518000],
          [115.580000, -3.520000]
        ]
      ]]
    },
    created_by: null
  },
  {
    id: "geo1e400-e29b-41d4-a716-446655440008",
    name: "Safety Restricted Zone",
    area: {
      type: "MultiPolygon",
      coordinates: [[
        [
          [115.595000, -3.550000],
          [115.605000, -3.550000],
          [115.605000, -3.560000],
          [115.595000, -3.560000],
          [115.595000, -3.550000]
        ]
      ]]
    },
    created_by: null
  }
];

export default geofences;
