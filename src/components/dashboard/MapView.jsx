// src/components/dashboard/MapView.jsx
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { BORNEO_INDOBARA_GEOJSON } from '../../data/miningData';

const MapView = ({ 
  trucks, 
  selectedTruck, 
  handleTruckSelect, 
  dashboardStats,
  setSelectedTruck 
}) => {
  // Calculate center of mining area for initial map view
  const miningAreaCenter = useMemo(() => {
    if (BORNEO_INDOBARA_GEOJSON.features.length > 0) {
      const coordinates = BORNEO_INDOBARA_GEOJSON.features[0].geometry.coordinates[0];
      const lats = coordinates.map(coord => coord[1]);
      const lngs = coordinates.map(coord => coord[0]);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      return [centerLat, centerLng];
    }
    return [-3.6, 115.58]; // Default center for Borneo Indobara area
  }, []);

  // Style for mining area
  const miningAreaStyle = {
    color: "#2563eb",
    weight: 3,
    opacity: 0.8,
    fillColor: "#3b82f6",
    fillOpacity: 0.1,
    dashArray: "5, 5"
  };

  // Custom marker icons
  const createCustomIcon = (status, isSelected = false) => {
    const colors = {
      active: "bg-green-500",
      inactive: "bg-red-500", 
      maintenance: "bg-yellow-500"
    };
    
    const size = isSelected ? "w-4 h-4" : "w-3 h-3";
    const border = isSelected ? "border-2 border-blue-400" : "border border-white";
    
    return L.divIcon({
      className: "",
      html: `<div class="${size} ${colors[status]} rounded-full ${border} shadow-lg"></div>`,
      iconSize: isSelected ? [16, 16] : [12, 12]
    });
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={miningAreaCenter}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        className="h-full w-full"
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri"
        />

        {/* PT Borneo Indobara Mining Area */}
        <GeoJSON 
          data={BORNEO_INDOBARA_GEOJSON} 
          style={miningAreaStyle}
          onEachFeature={(feature, layer) => {
            if (feature.properties && feature.properties.Name) {
              layer.bindPopup(`
                <div style="font-family: Arial, sans-serif;">
                  <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px; font-weight: bold;">
                    ${feature.properties.Name}
                  </h3>
                  <div style="color: #6b7280; font-size: 14px;">
                    <p style="margin: 5px 0;"><strong>Wilayah:</strong> Area Operasional Tambang</p>
                    <p style="margin: 5px 0;"><strong>Perusahaan:</strong> ${feature.properties.company || 'PT Borneo Indobara'}</p>
                    <p style="margin: 5px 0;"><strong>Tipe:</strong> Area Penambangan</p>
                  </div>
                </div>
              `);
            }
          }}
        />
        
        {/* Truck Markers */}
        {trucks.map((truck) => (
          <Marker
            key={truck.id}
            position={[truck.location.coordinates[1], truck.location.coordinates[0]]}
            icon={createCustomIcon(truck.status, selectedTruck?.id === truck.id)}
            eventHandlers={{
              click: () => handleTruckSelect(truck)
            }}
          >
            <Popup>
              <div className="w-64 p-2">
                <div className="font-bold text-lg mb-3 border-b pb-2 flex items-center justify-between">
                  <span>{truck.truckNumber}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                    truck.status === "active" ? "bg-green-100 text-green-700" :
                    truck.status === "inactive" ? "bg-red-100 text-red-700" : 
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {truck.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>Model:</strong> {truck.model}</div>
                    <div><strong>Driver:</strong> {truck.driver || 'N/A'}</div>
                    <div><strong>Speed:</strong> {truck.speed} km/h</div>
                    <div><strong>Fuel:</strong> {truck.fuel}%</div>
                    <div><strong>Payload:</strong> {truck.payload} tons</div>
                    <div><strong>Engine Hours:</strong> {truck.engineHours}h</div>
                  </div>
                  
                  {truck.tirePressures && (
                    <div className="mt-3">
                      <strong className="block mb-1">Tire Pressure:</strong>
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        {truck.tirePressures.slice(0, 6).map((tire, idx) => (
                          <div key={idx} className={`text-center p-1 rounded ${
                            tire.status === 'low' ? "bg-red-100 text-red-700" : 
                            tire.status === 'high' ? "bg-yellow-100 text-yellow-700" : 
                            "bg-green-100 text-green-700"
                          }`}>
                            {tire.pressure?.toFixed(1)} psi
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    Last update: {new Date(truck.lastUpdate).toLocaleString()}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10">
        <div className="text-sm font-semibold mb-2">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Active ({dashboardStats.activeTrucks || 0})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Inactive ({dashboardStats.inactiveTrucks || 0})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>Maintenance ({dashboardStats.maintenanceTrucks || 0})</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center">
              <div className="w-4 h-1 bg-blue-500 mr-2" style={{border: '1px dashed #2563eb'}}></div>
              <span>Mining Area</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Truck Details */}
      {selectedTruck && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg">{selectedTruck.truckNumber}</h3>
            <button 
              onClick={() => setSelectedTruck(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-600">Status</div>
              <div className={`font-semibold capitalize ${
                selectedTruck.status === "active" ? "text-green-600" :
                selectedTruck.status === "inactive" ? "text-red-600" : "text-yellow-600"
              }`}>
                {selectedTruck.status}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Speed</div>
              <div className="font-semibold">{selectedTruck.speed} km/h</div>
            </div>
            <div>
              <div className="text-gray-600">Driver</div>
              <div className="font-semibold">{selectedTruck.driver || 'N/A'}</div>
            </div>
            <div>
              <div className="text-gray-600">Fuel Level</div>
              <div className="font-semibold">{selectedTruck.fuel}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;