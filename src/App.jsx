import React from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

function App() {
  // Dummy GeoJSON area tambang
  const areaTambang = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [116.785, -1.232],
          [116.790, -1.232],
          [116.790, -1.238],
          [116.785, -1.238],
          [116.785, -1.232],
        ],
      ],
    },
    properties: { name: "Area Tambang" },
  };

  // Dummy data truk
  const trucks = [
    {
      id: "TRK-001",
      status: "Aktif",
      position: [-1.234, 116.787],
      tekananBan: [32, 31, 30, 32],
      speed: 25,
      lastUpdate: "20 Aug 2025",
    },
    {
      id: "TRK-002",
      status: "Inaktif",
      position: [-1.236, 116.789],
      tekananBan: [30, 30, 29, 31],
      speed: 0,
      lastUpdate: "20 Aug 2025",
    },
    {
      id: "TRK-003",
      status: "Maintenance",
      position: [-1.237, 116.788],
      tekananBan: [28, 29, 28, 29],
      speed: 0,
      lastUpdate: "20 Aug 2025",
    },
  ];

  // Custom marker icons
  const icons = {
    Aktif: L.divIcon({
      className: "", html: '<div class="w-3 h-3 bg-green-500 rounded-full border border-white"></div>', iconSize: [12, 12]
    }),
    Inaktif: L.divIcon({
      className: "", html: '<div class="w-3 h-3 bg-red-500 rounded-full border border-white"></div>', iconSize: [12, 12]
    }),
    Maintenance: L.divIcon({
      className: "", html: '<div class="w-3 h-3 bg-yellow-500 rounded-full border border-white"></div>', iconSize: [12, 12]
    }),
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 font-bold text-xl border-b">Fleet Monitoring</div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="block py-2 px-4 rounded hover:bg-gray-200">Dashboard</a>
          <a href="#" className="block py-2 px-4 rounded hover:bg-gray-200">Map</a>
          <a href="#" className="block py-2 px-4 rounded hover:bg-gray-200">Data Truk</a>
          <a href="#" className="block py-2 px-4 rounded hover:bg-gray-200">Notifikasi</a>
          <a href="#" className="block py-2 px-4 rounded hover:bg-gray-200">Setting</a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white shadow flex items-center justify-between px-6">
          <div className="font-semibold">Area Tambang - Monitoring</div>
          <div className="flex items-center gap-4">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded">Admin</span>
            <button className="relative">
              <span className="material-icons text-gray-500">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Filter Panel */}
          <div className="w-64 bg-white border-r p-4">
            <div className="font-bold mb-2">Filter Kategori</div>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox text-green-500" defaultChecked />
                <span className="ml-2 text-green-700">Aktif</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox text-red-500" defaultChecked />
                <span className="ml-2 text-red-700">Inaktif</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox text-yellow-500" defaultChecked />
                <span className="ml-2 text-yellow-700">Maintenance</span>
              </label>
            </div>
          </div>

          {/* Map Area */}
          <div className="flex-1 relative">
            <MapContainer
              center={[-1.235, 116.788]}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
              className="rounded-lg"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <GeoJSON data={areaTambang} style={{ color: "#2563eb", fillOpacity: 0.3 }} />
              {trucks.map((truck) => (
                <Marker
                  key={truck.id}
                  position={truck.position}
                  icon={icons[truck.status]}
                >
                  <Popup>
                    <div className="font-bold text-lg mb-2">Detail Truk</div>
                    <div className="mb-1">ID: {truck.id}</div>
                    <div className="mb-1">Status: <span className={
                      truck.status === "Aktif"
                        ? "text-green-600 font-semibold"
                        : truck.status === "Inaktif"
                        ? "text-red-600 font-semibold"
                        : "text-yellow-600 font-semibold"
                    }>{truck.status}</span></div>
                    <div className="mb-1">Lokasi: {truck.position[0]}, {truck.position[1]}</div>
                    <div className="mb-1">Tekanan Ban: {truck.tekananBan.join("psi, ")}psi</div>
                    <div className="mb-1">Speed: {truck.speed} km/h</div>
                    <div className="mb-1">Last Update: {truck.lastUpdate}</div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
