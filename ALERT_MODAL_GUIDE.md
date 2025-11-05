# Alert Modal Component - Usage Guide

## 📦 Komponen Alert Modern untuk CRUD

Alert Modal ini adalah komponen popup yang beautiful dan modern untuk menampilkan notifikasi dan konfirmasi dalam operasi CRUD (Create, Read, Update, Delete).

---

## 🎨 4 Tipe Alert

### 1. Success Alert (Hijau) ✅

Digunakan untuk notifikasi operasi berhasil.

**Kapan digunakan:**

- Data berhasil disimpan
- Data berhasil diupdate
- Operasi selesai dengan sukses

**Contoh:**

```jsx
showAlert.success('Device has been created successfully!', 'Success!');
```

---

### 2. Error Alert (Merah) ❌

Digunakan untuk notifikasi error atau gagal.

**Kapan digunakan:**

- Gagal menyimpan data
- Error dari server
- Validasi gagal

**Contoh:**

```jsx
showAlert.error('Failed to connect to server. Please try again.', 'Oooops!');
```

---

### 3. Warning Alert (Orange) ⚠️

Digunakan untuk peringatan atau informasi penting.

**Kapan digunakan:**

- Validasi form
- Peringatan sebelum action
- Informasi yang memerlukan perhatian

**Contoh:**

```jsx
showAlert.warning('Please fill in all required fields.', 'Warning!');
```

---

### 4. Confirmation Alert (Orange dengan 2 tombol) 🗑️

Digunakan untuk konfirmasi sebelum melakukan action destructive.

**Kapan digunakan:**

- Konfirmasi hapus data
- Konfirmasi action yang tidak bisa di-undo
- Konfirmasi perubahan penting

**Contoh:**

```jsx
showAlert.confirm('Are you sure you want to delete this item?', () => {
  // Handle delete action
  deleteItem();
});

// atau khusus untuk delete:
showAlert.delete('Device ABC-123', () => {
  // Handle delete
});
```

---

## 🚀 Cara Penggunaan

### 1. Import Dependencies

```jsx
import AlertModal from '../../components/common/AlertModal';
import { useAlert } from '../../hooks/useAlert';
```

### 2. Setup Hook dalam Component

```jsx
function MyComponent() {
  const { showAlert, alertState, closeAlert } = useAlert();

  // ... your component code
}
```

### 3. Tambahkan AlertModal di Return

```jsx
return (
  <div>
    {/* Your component content */}

    {/* Alert Modal - Letakkan di akhir */}
    <AlertModal
      isOpen={alertState.isOpen}
      type={alertState.type}
      title={alertState.title}
      message={alertState.message}
      onConfirm={alertState.onConfirm}
      onCancel={alertState.onCancel}
      confirmText={alertState.confirmText}
      cancelText={alertState.cancelText}
      showCancel={alertState.showCancel}
    />
  </div>
);
```

### 4. Panggil Alert saat Diperlukan

```jsx
// Success
const handleSave = async () => {
  try {
    await saveData();
    showAlert.success('Data saved successfully!', 'Success!', () => {
      // Optional: callback setelah user klik OK
      navigate('/list');
    });
  } catch (error) {
    showAlert.error(error.message, 'Save Failed');
  }
};

// Delete Confirmation
const handleDelete = (item) => {
  showAlert.delete(item.name, async () => {
    try {
      await deleteItem(item.id);
      showAlert.success('Item deleted successfully!');
    } catch (error) {
      showAlert.error('Failed to delete item.');
    }
  });
};

// Warning
const handleSubmit = () => {
  if (!form.name) {
    showAlert.warning('Please enter a name.');
    return;
  }
  // proceed...
};
```

---

## 📚 API Reference

### Hook: `useAlert()`

Returns:

- `showAlert` - Object dengan methods untuk menampilkan alert
- `alertState` - State current alert (untuk pass ke AlertModal)
- `closeAlert` - Function untuk close alert secara manual

### Methods `showAlert`:

#### `showAlert.success(message, title?, onConfirm?)`

Menampilkan success alert (hijau).

**Parameters:**

- `message` (string, required): Pesan yang ditampilkan
- `title` (string, optional): Judul alert. Default: "Success!"
- `onConfirm` (function, optional): Callback saat user klik tombol Continue

**Example:**

```jsx
showAlert.success('Data saved!');
showAlert.success('Data saved!', 'Great!');
showAlert.success('Data saved!', 'Great!', () => navigate('/home'));
```

---

#### `showAlert.error(message, title?, onConfirm?)`

Menampilkan error alert (merah).

**Parameters:**

- `message` (string, required): Pesan error
- `title` (string, optional): Judul. Default: "Oooops!"
- `onConfirm` (function, optional): Callback saat user klik Try Again

**Example:**

```jsx
showAlert.error('Connection failed.');
showAlert.error('Connection failed.', 'Network Error');
```

---

#### `showAlert.warning(message, title?, onConfirm?)`

Menampilkan warning alert (orange).

**Parameters:**

- `message` (string, required): Pesan warning
- `title` (string, optional): Judul. Default: "Warning!"
- `onConfirm` (function, optional): Callback saat user klik OK

**Example:**

```jsx
showAlert.warning('Please fill all fields.');
```

---

#### `showAlert.info(message, title?, onConfirm?)`

Menampilkan info alert (biru).

**Parameters:**

- `message` (string, required): Pesan informasi
- `title` (string, optional): Judul. Default: "Information"
- `onConfirm` (function, optional): Callback saat user klik OK

**Example:**

```jsx
showAlert.info('This feature is coming soon.');
```

---

#### `showAlert.confirm(message, onConfirm, title?)`

Menampilkan confirmation dialog dengan 2 tombol.

**Parameters:**

- `message` (string, required): Pertanyaan konfirmasi
- `onConfirm` (function, required): Callback jika user klik Yes/Confirm
- `title` (string, optional): Judul. Default: "Are you sure?"

**Example:**

```jsx
showAlert.confirm('This action cannot be undone.', () => {
  // User clicked Yes
  performAction();
});
```

---

#### `showAlert.delete(itemName, onConfirm)`

Shortcut khusus untuk delete confirmation.

**Parameters:**

- `itemName` (string, required): Nama item yang akan dihapus
- `onConfirm` (function, required): Callback jika user konfirmasi delete

**Example:**

```jsx
showAlert.delete('Device ABC-123', async () => {
  await deleteDevice(id);
  showAlert.success('Device deleted!');
});
```

---

## 🎭 Contoh Lengkap

### Form Component dengan Semua Tipe Alert

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertModal from '../../components/common/AlertModal';
import { useAlert } from '../../hooks/useAlert';

function DeviceForm() {
  const navigate = useNavigate();
  const { showAlert, alertState } = useAlert();
  const [form, setForm] = useState({ name: '', code: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // Validation warning
    if (!form.name) {
      showAlert.warning('Please enter device name.', 'Validation Error');
      return;
    }
    if (!form.code) {
      showAlert.warning('Please enter device code.', 'Validation Error');
      return;
    }

    setSaving(true);
    try {
      const response = await api.createDevice(form);

      // Success alert
      showAlert.success('Device has been created successfully!', 'Success!', () => {
        // Navigate after user clicks Continue
        navigate('/devices');
      });
    } catch (error) {
      // Error alert
      showAlert.error(error.message || 'Failed to create device.', 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1>Create Device</h1>

      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Device Name"
      />

      <input
        value={form.code}
        onChange={(e) => setForm({ ...form, code: e.target.value })}
        placeholder="Device Code"
      />

      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        showCancel={alertState.showCancel}
      />
    </div>
  );
}
```

### List Component dengan Delete Confirmation

```jsx
import React, { useState, useEffect } from 'react';
import AlertModal from '../../components/common/AlertModal';
import { useAlert } from '../../hooks/useAlert';

function DeviceList() {
  const { showAlert, alertState } = useAlert();
  const [devices, setDevices] = useState([]);

  const handleDelete = (device) => {
    // Delete confirmation
    showAlert.delete(device.name, async () => {
      try {
        await api.deleteDevice(device.id);

        // Remove from list
        setDevices((prev) => prev.filter((d) => d.id !== device.id));

        // Success notification
        showAlert.success('Device has been deleted successfully.', 'Deleted!');
      } catch (error) {
        // Error notification
        showAlert.error(`Failed to delete device: ${error.message}`, 'Delete Failed');
      }
    });
  };

  return (
    <div>
      <h1>Devices</h1>

      <table>
        <tbody>
          {devices.map((device) => (
            <tr key={device.id}>
              <td>{device.name}</td>
              <td>
                <button onClick={() => handleDelete(device)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        showCancel={alertState.showCancel}
      />
    </div>
  );
}
```

---

## 🎨 Customization

### Mengubah Teks Tombol

```jsx
// Default button texts:
// - Success: "Continue"
// - Error: "Try Again"
// - Warning: "OK"
// - Confirm: "Yes, Delete" & "Cancel"

// Untuk custom:
setAlertState({
  isOpen: true,
  type: 'warning',
  title: 'Custom Title',
  message: 'Custom message',
  confirmText: 'Got it!', // Custom button text
  showCancel: false,
  onConfirm: () => closeAlert(),
});
```

### Styling

Alert menggunakan Tailwind CSS. Untuk customize warna dan styling, edit file `AlertModal.jsx` pada bagian `configs` object.

---

## ✨ Features

- ✅ **4 Tipe Alert**: Success, Error, Warning, Info
- ✅ **Delete Confirmation**: Built-in delete confirmation dialog
- ✅ **Animated**: Smooth fade-in animation
- ✅ **Responsive**: Works on all screen sizes
- ✅ **Backdrop Blur**: Modern backdrop blur effect
- ✅ **Customizable**: Easy to customize colors and text
- ✅ **Icon Based**: Beautiful SVG icons for each type
- ✅ **Wave Background**: Decorative wave pattern
- ✅ **Callback Support**: Run code after user confirms

---

## 🎯 Best Practices

1. **Jangan gunakan `alert()` native** - Selalu gunakan AlertModal untuk konsistensi UI
2. **Berikan pesan yang jelas** - Jelaskan apa yang terjadi dan apa yang harus dilakukan user
3. **Gunakan callback** - Untuk navigate atau refresh data setelah success
4. **Validasi di warning** - Gunakan warning alert untuk validation errors
5. **Delete confirmation** - Selalu konfirmasi sebelum delete (gunakan `showAlert.delete()`)

---

## 📝 Notes

- Alert Modal menggunakan Portal API (fixed position) jadi tidak terpengaruh parent container
- Backdrop dapat diklik untuk close alert (sama dengan tombol OK)
- Alert state disimpan di custom hook jadi tidak perlu manage state sendiri
- Support keyboard navigation (ESC untuk close - bisa ditambahkan jika perlu)

---

**Created**: November 3, 2025  
**Version**: 1.0  
**Author**: Development Team
