/* =========================================================
   KONFIGURASI FIREBASE
   ---------------------------------------------------------
   Isi nilai di bawah dengan config milik project Anda:

   1. Buka https://console.firebase.google.com  →  Add project
   2. Setelah project jadi, klik ikon Web  </>  untuk menambah aplikasi web
   3. Salin isi objek `firebaseConfig` yang ditampilkan ke sini
   4. Di menu kiri pilih Build → Firestore Database → Create database
      (pilih mode production, lokasi asia-southeast2 / Jakarta)
   5. Buka tab Rules, tempelkan isi berkas `firestore.rules`, lalu Publish

   Selama nilai di bawah masih kosong, undangan tetap berjalan normal —
   ucapan hanya tersimpan di browser tamu masing-masing (localStorage).

   Catatan: apiKey Firebase memang bersifat publik dan aman dilihat orang.
   Yang melindungi data Anda adalah Rules di langkah 5, bukan kunci ini.
   ========================================================= */

window.FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
};

/* Nama koleksi tempat ucapan disimpan. Biarkan apa adanya kecuali perlu. */
window.FIREBASE_COLLECTION = 'wishes';
