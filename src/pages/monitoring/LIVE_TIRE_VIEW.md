# Live Tire View - Visual Real-Time Monitoring

## 🎯 Overview

**Live Tire View** adalah halaman monitoring visual yang menampilkan kondisi ban truck secara **real-time** dengan **representasi grafis** yang intuitif.

## ✨ Fitur Utama

### 1. Visual Truck Layout
- **Top-view truck** dengan posisi ban yang akurat
- **6 ban per truck**: Front Left/Right, Rear Left/Right 1&2
- **Color-coded status** untuk identifikasi cepat

### 2. Real-Time Data
- **Auto-refresh setiap 5 detik**
- Live update tanpa reload halaman
- Animasi pulse pada status indicator

### 3. Interactive Display
- **Hover tooltip** untuk detail lengkap
- Data ditampilkan: Pressure (PSI), Temperature (°C), Battery (%)
- Serial number sensor

### 4. Status Color System
| Warna | Status | Kondisi |
|-------|--------|---------|
| 🟢 **Hijau** | Normal | Semua parameter dalam range normal |
| 🟡 **Kuning** | Low Pressure | Tekanan < 80 PSI |
| 🟠 **Orange** | Low Battery | Battery < 20% |
| 🔴 **Merah** | Critical | High Pressure (>120 PSI) atau High Temp (>80°C) |
| ⚫ **Abu-abu** | No Signal | Sensor lost/disconnected |

## 📊 Layout Display

```
┌────────────────────────────────────────────────────┐
│                    ▲ FRONT                         │
│  ┌──────┐                           ┌──────┐      │
│  │  95  │       [Truck Icon]        │  98  │      │
│  │ PSI  │                            │ PSI  │      │
│  │ 45°C │                            │ 47°C │      │
│  └──────┘                           └──────┘      │
│  Front L                            Front R       │
│                                                    │
│  ┌──────┐                           ┌──────┐      │
│  │ 102  │                            │ 99   │      │
│  │ PSI  │                            │ PSI  │      │
│  │ 52°C │                            │ 48°C │      │
│  └──────┘                           └──────┘      │
│  Rear L1                            Rear R1       │
│                                                    │
│  ┌──────┐                           ┌──────┐      │
│  │  96  │                            │ 103  │      │
│  │ PSI  │                            │ PSI  │      │
│  │ 50°C │                            │ 55°C │      │
│  └──────┘                           └──────┘      │
│  Rear L2                            Rear R2       │
│                    ▼ REAR                          │
└────────────────────────────────────────────────────┘

Legend:
🟢 Normal  🟡 Low Pressure  🟠 Low Battery  🔴 Critical  ⚫ No Signal
```

## 🎨 Component Structure

### TireDisplay Component
```jsx
<TireDisplay tire={tireData} position="Front Left" />
```

**Props:**
- `tire`: Object dengan data tire (pressure, temp, battery, etc)
- `position`: String posisi ban ("Front Left", "Rear Right 1", etc)

**Visual Elements:**
- Rounded rectangle dengan border 4px
- Background color sesuai status
- Pressure value (bold, large)
- Temperature value (below pressure)
- Status indicator (pulsing dot)
- Hover tooltip dengan detail lengkap

### TruckCard Component
```jsx
<TruckCard truck={truckData} />
```

**Props:**
- `truck`: Object dengan data truck dan array tires

**Sections:**
1. **Header**: Truck code, name, status, live update indicator
2. **Visual Layout**: Top-view truck dengan 6 tire positions
3. **Legend**: Color-coded status explanation
4. **Alert Summary**: List ban yang bermasalah

## 🔄 Data Flow

### 1. Load Data
```javascript
trucksApi.getAll()
  ↓
Transform to truck objects
  ↓
Organize tires by position
  ↓
Set state with trucksWithTires
```

### 2. Auto-Refresh
```javascript
setInterval(loadData, 5000) // Every 5 seconds
```

### 3. Filter & Display
```javascript
Filter by search term
  ↓
Filter by selected truck
  ↓
Map to TruckCard components
```

## 🎯 Use Cases

### 1. **Control Room Dashboard**
- Display di monitor besar
- Multiple trucks visible
- Quick status overview
- Real-time monitoring

### 2. **Maintenance Planning**
- Identify problematic tires
- See which truck needs attention
- Plan maintenance schedule
- Track tire health trends

### 3. **Emergency Response**
- Quick identification of critical issues
- Visual alert system
- Immediate action guidance
- Location-specific problem tracking

## 🚀 Advantages vs Table View

| Aspect | Table View | Live Tire View |
|--------|-----------|----------------|
| **Visual Speed** | Need to read rows | Instant visual recognition |
| **Spatial Context** | No position info | Clear tire location |
| **Status Identification** | Read badges | See colors immediately |
| **User Experience** | Data-heavy | Intuitive & friendly |
| **Best For** | Detailed analysis | Quick monitoring |

## 📱 Responsive Design

- **Desktop**: Full truck layout with all details
- **Tablet**: Responsive grid, maintained proportions
- **Mobile**: Stacked layout, touch-friendly

## 🔧 Technical Details

### Performance
- **Refresh Rate**: 5 seconds
- **API Calls**: Efficient batch loading
- **Re-renders**: Optimized with proper state management
- **Memory**: Minimal footprint

### Browser Compatibility
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## 📊 Data Requirements

### Minimum Data Structure:
```javascript
truck: {
  id: "truck-001",
  unit_code: "HD785-7",
  truck_number: "Dump Truck #05",
  status: "active",
  tpms: [
    {
      tire_location: "Front Left",
      serial_number: "TPMS-001",
      tire_pressure: 95.5,
      tire_temperature: 45.2,
      battery: 80,
      ex_type: "",
      timestamp: "2025-10-30T14:23:45Z"
    },
    // ... 5 more tires
  ]
}
```

## 🎯 Future Enhancements

1. **Historical Trends**
   - Mini sparkline charts per tire
   - Trend indicators (↑ rising, ↓ falling)

2. **Predictive Alerts**
   - ML-based anomaly detection
   - Predicted failure warnings

3. **Maintenance Integration**
   - One-click maintenance ticket
   - Automated work order generation

4. **Multi-view Support**
   - Grid view (multiple trucks)
   - Side-by-side comparison
   - Fullscreen mode

5. **Export & Reports**
   - Screenshot capture
   - PDF report generation
   - Share via email/WhatsApp

## 🔐 Access Control

- Route: `/monitoring/live-view`
- Protected: ✅ Requires authentication
- Permission: Standard user (can view)

## 📝 Usage Instructions

1. **Access Page**: Sidebar → Monitoring → Live Tire View
2. **Select Truck**: Use dropdown or search
3. **View Status**: Check tire colors
4. **Hover for Details**: Mouse over any tire
5. **Monitor Alerts**: Check summary at bottom
6. **Auto-refresh**: Wait 5s for updates

## ⚠️ Important Notes

- **Real-time dependency**: Requires active IoT sensors
- **Network requirement**: Stable internet connection
- **Data accuracy**: Only as good as sensor quality
- **Update frequency**: 5s refresh = recent, not instant

## 🏆 Best Practice

✅ **DO:**
- Monitor continuously during operations
- Act on critical alerts immediately
- Regular sensor maintenance
- Calibrate sensors periodically

❌ **DON'T:**
- Ignore persistent warnings
- Rely solely on visual without checking values
- Disable auto-refresh during active operations
- Neglect "No Signal" status

---

## 🎉 Summary

**Live Tire View** transforms complex TPMS data into an **intuitive visual dashboard** that enables:
- ⚡ Faster decision making
- 👁️ Better situational awareness  
- 🎯 Proactive maintenance
- 💰 Cost savings through prevention

Perfect for **control rooms**, **maintenance teams**, and **fleet managers** who need **quick visual insights** without diving into detailed tables! 🚛✨
