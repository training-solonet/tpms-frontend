# Monitoring Pages

Folder ini berisi halaman monitoring dengan desain yang konsisten dengan halaman **All Vehicles**.

## 📁 File yang Tersedia

### 1. TirePressureMonitoring.jsx
- **Route**: `/monitoring/tires`
- **Fungsi**: Real-time monitoring tekanan ban (TPMS)
- **Fitur**:
  - Stats cards: Total Tires, Normal, Warnings, Critical
  - Filter: Search, Truck, Status, Per Page
  - Table: Truck info, Location, Serial Number, Pressure, Temperature, Battery, Status
  - Pagination dengan navigation
  - Auto-refresh setiap 60 detik

### 2. TemperatureMonitoring.jsx
- **Route**: `/monitoring/temperature`
- **Fungsi**: Real-time monitoring suhu sensor
- **Fitur**:
  - Stats cards: Total Sensors, Normal, Warnings, Critical
  - Filter: Search, Truck, Status, Per Page
  - Table: Truck info, Sensor ID, Location, Temperature, Thresholds, Status
  - Color-coded temperature display (hijau/kuning/merah)
  - Auto-refresh setiap 60 detik

### 3. FuelMonitoring.jsx
- **Route**: `/monitoring/fuel`
- **Fungsi**: Real-time monitoring level bahan bakar
- **Fitur**:
  - Stats cards: Total Trucks, Good Level, Low Fuel, Average Fuel
  - Filter: Search, Truck, Status, Per Page
  - Table: Truck info, Fuel Level, Capacity, Percentage, Consumption, Efficiency, Status
  - Progress bar untuk fuel percentage
  - Auto-refresh setiap 60 detik

## 🎨 Design Pattern

Semua halaman mengikuti design pattern dari **All Vehicles**:

### Layout
```jsx
<TailwindLayout>
  <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
    {/* Content */}
  </div>
</TailwindLayout>
```

### Stats Cards
- 4 cards dengan icon, title, dan count
- Warna background: Blue, Green, Yellow, Red/Purple
- Icon dari Heroicons

### Table Card
- White background dengan shadow
- Border-bottom di header untuk filters
- Filters: Search (magnifying glass), Dropdowns (custom chevron), Per Page, Results Count

### Table
- Gray-50 background di thead
- Hover effect di tbody rows
- Status badges dengan warna semantik
- Responsive dengan overflow-x-auto

### Pagination
- Desktop: Previous/Next buttons dengan page counter
- Mobile: Simple Previous/Next
- Disabled state untuk first/last page

## 🔄 Perbedaan dengan Telemetry Lama

| Aspek | Telemetry (Old) | Monitoring (New) |
|-------|----------------|------------------|
| **Route** | `/telemetry/*` | `/monitoring/*` |
| **Design** | Custom gradient background | Consistent All Vehicles design |
| **Stats** | ❌ Tidak ada | ✅ 4 stats cards |
| **Filters** | Basic | Advanced dengan search, truck, status filter |
| **Pagination** | Basic | Full pagination dengan page counter |
| **Layout** | Berbeda-beda | Konsisten di semua halaman |

## 🚀 Cara Menggunakan

### 1. Akses melalui Sidebar
Di sidebar, pilih **Monitoring** → pilih salah satu:
- Tire Pressure
- Temperature
- Fuel Level

### 2. Filter Data
- **Search**: Ketik truck code, name, atau sensor ID
- **Truck Dropdown**: Filter berdasarkan truck tertentu
- **Status Dropdown**: Filter berdasarkan status (Normal, Warning, Critical, dll)
- **Per Page**: Pilih jumlah data per halaman (10/25/50/100)

### 3. Lihat Data Real-time
- Data otomatis refresh setiap 60 detik
- Status badge menunjukkan kondisi sensor
- Color-coded values untuk quick identification

## 🔧 Teknologi

- **React 18**: Hooks (useState, useEffect, useMemo)
- **TailwindCSS**: Utility-first styling
- **React Router**: Navigation
- **API Backend 2**: trucksApi.getAll()
- **TailwindLayout**: Header & Sidebar wrapper

## 📝 Catatan

1. **File telemetry lama masih ada** di `/pages/TelemetryTiresForm.jsx`, `/pages/TelemetryTemperatureForm.jsx`, `/pages/TelemetryFuelForm.jsx`
2. **Route telemetry lama masih aktif** di `/telemetry/*`
3. **Monitoring baru** ada di `/monitoring/*` dengan desain konsisten
4. Anda bisa pilih menggunakan salah satu atau keduanya tergantung kebutuhan

## ✅ Keuntungan Monitoring Baru

1. ✅ **Konsistensi Design** - Sama dengan All Vehicles
2. ✅ **Lebih Informatif** - Stats cards memberikan overview cepat
3. ✅ **Better UX** - Advanced filters dan pagination
4. ✅ **Maintainable** - Code terstruktur dengan baik
5. ✅ **Responsive** - Mobile-friendly design
6. ✅ **Safe** - Tidak mengubah file lama, menghindari breaking changes
