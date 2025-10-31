# Fix untuk Masalah Redirect ke Login

## Masalah

Halaman terus diarahkan ke login setiap kali dibuka.

## Penyebab

1. Tidak ada token autentikasi di localStorage
2. Backend belum siap / tidak terkoneksi
3. Sedang dalam mode development

## Solusi

### Opsi 1: Bypass Authentication (Untuk Development)

**Langkah:**

1. Buat atau edit file `.env` di root project:

```bash
# Tambahkan baris ini untuk bypass auth di development
VITE_BYPASS_AUTH=true

# Backend URLs (sesuaikan dengan backend Anda)
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000/ws
VITE_TRACKING_API_BASE_URL=http://localhost:8080
VITE_TRACKING_WS_URL=ws://localhost:8080/ws
```

2. Restart dev server:

```powershell
# Stop server (Ctrl+C)
npm run dev
```

3. Sekarang Anda bisa akses dashboard tanpa login!

### Opsi 2: Login Normal (Untuk Production)

**Langkah:**

1. Pastikan backend API sudah running
2. Set `.env` tanpa `VITE_BYPASS_AUTH`:

```bash
VITE_API_BASE_URL=http://your-backend-url/api
VITE_WS_URL=ws://your-backend-url/ws
```

3. Akses `/login` dan login dengan credentials yang valid
4. Token akan disimpan di localStorage
5. Anda akan otomatis masuk di reload berikutnya

### Opsi 3: Manual Set Token (Untuk Testing)

Buka Browser Console (F12) dan jalankan:

```javascript
// Set dummy token untuk testing
localStorage.setItem('authToken', 'dummy-token-for-testing');
localStorage.setItem(
  'user',
  JSON.stringify({
    id: 1,
    username: 'testuser',
    name: 'Test User',
    role: 'admin',
  })
);

// Reload page
location.reload();
```

## Debugging

Cek status authentication di Browser Console:

```javascript
// Cek token
console.log('Token:', localStorage.getItem('authToken'));

// Cek user data
console.log('User:', localStorage.getItem('user'));

// Clear auth (logout manual)
localStorage.removeItem('authToken');
localStorage.removeItem('user');
location.reload();
```

## Catatan

- **DEV_MODE** hanya aktif jika `VITE_BYPASS_AUTH=true` di `.env`
- Untuk production, hapus atau set `VITE_BYPASS_AUTH=false`
- Token disimpan di `localStorage` browser
- Refresh page tidak akan logout jika token masih valid

## Troubleshooting

### Browser masih redirect ke login setelah set `.env`

- Pastikan file `.env` ada di root project (sejajar dengan `package.json`)
- Restart dev server (Ctrl+C lalu `npm run dev`)
- Clear browser cache & localStorage (F12 → Application → Clear Storage)

### Login berhasil tapi langsung logout

- Cek response dari API login di Network tab (F12)
- Pastikan API return `{ success: true, data: { token, user } }`
- Cek console log untuk error message

### Token ada tapi masih redirect

- Token mungkin expired atau invalid
- Cek API interceptor di `src/services/api2/config.js`
- Clear localStorage dan login ulang
