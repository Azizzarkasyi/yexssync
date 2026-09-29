/**
 * End-to-End Test Suite for HadirYuk Application
 * Tests Backend, Database, Leaflet Geofencing, and Face Recognition Biometrics.
 */
const BASE_URL = process.env.API_URL || process.env.BASE_URL || 'http://localhost:3000';

async function request(path: string, options: any = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 MEMULAI PENGUJIAN END-TO-END APLIKASI YEXSSYNC');
  console.log('================================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(name: string, condition: boolean, details?: any) {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`, details || '');
      failedCount++;
    }
  }

  // TEST 1: Health Check
  console.log('--- 1. UJI SERVER HEALTH & STATUS ---');
  const healthRes = await request('/');
  assert('Server responsif (HTTP 200) & API Multi-Tenant aktif', healthRes.status === 200 && healthRes.data?.success === true, healthRes);

  // TEST 2: Super Admin Login
  console.log('\n--- 2. UJI SUPER ADMIN AUTHENTICATION ---');
  const superAdminRes = await request('/api/super-admin/login', {
    method: 'POST',
    body: {
      email: 'azizsework@gmail.com',
      password: 'Aziz30112002',
    },
  });
  assert('Super Admin login berhasil (JWT Token diperoleh)', superAdminRes.status === 200 && !!superAdminRes.data?.data?.token, superAdminRes.data);
  const superAdminToken = superAdminRes.data?.data?.token;

  // TEST 3: Tenant Discovery or Creation
  console.log('\n--- 3. UJI MANAJEMEN TENANT & MULTI-TENANT ISOLATION ---');
  let tenantsRes = await request('/api/super-admin/tenants', { token: superAdminToken });
  let tenantList = tenantsRes.data?.data || [];
  let testTenant = tenantList[0];

  if (!testTenant) {
    console.log('  ℹ️ Membuat tenant demo baru: PT HadirYuk Nusantara...');
    const createTenantRes = await request('/api/super-admin/tenants', {
      method: 'POST',
      token: superAdminToken,
      body: {
        name: 'PT HadirYuk Nusantara',
        adminName: 'Budi Santoso',
        adminEmail: 'admin@hadiryuk.id',
        adminPassword: 'Password123!',
      },
    });
    assert('Pembuatan Tenant & Schema Tenant Baru Berhasil', createTenantRes.status === 201, createTenantRes.data);
    testTenant = createTenantRes.data?.data;
  } else {
    assert('Tenant ditemukan di sistem multi-tenant', true, testTenant.name);
  }

  // TEST 4: Tenant Admin Login via Auto-Login
  console.log('\n--- 4. UJI LOGIN TENANT ADMIN (AUTO-LOOKUP) ---');
  const adminLoginRes = await request('/api/auth/auto-login', {
    method: 'POST',
    body: {
      email: 'admin@hadiryuk.id',
      password: 'Password123!',
    },
  });
  assert('Tenant Admin login berhasil via Auto-Login', adminLoginRes.status === 200 && !!adminLoginRes.data?.data?.token, adminLoginRes.data);
  const adminToken = adminLoginRes.data?.data?.token;

  // TEST 5: Create Employee with Leaflet Geofence Coordinates & Custom Database Fields
  console.log('\n--- 5. UJI TAMBAH PEGAWAI DENGAN PETA LEAFLET GEOFENCING & FITUR DATABASE BARU ---');
  const employeeEmail = `pegawai.${Date.now()}@hadiryuk.id`;
  const employeePayload = {
    name: 'Dimas Prasetyo',
    nik: '3171012908950002',
    email: employeeEmail,
    password: 'Password123!',
    phone: '081234567890',
    address: 'Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan',
    department: 'IT & Engineering',
    position: 'Fullstack Engineer',
    jobType: 'Full Time (Tetap)',
    salaryType: 'MONTHLY',
    salary: 9500000,
    overrideLocation: true,
    locationName: 'Kantor Pusat SCBD',
    workLatitude: -6.208800,
    workLongitude: 106.845600,
    workRadius: 75,
  };

  const createEmpRes = await request('/api/users', {
    method: 'POST',
    token: adminToken,
    body: employeePayload,
  });

  assert(
    'Pegawai berhasil dibuat dengan NIK, Alamat, Tipe Pekerjaan & Geofence Leaflet',
    createEmpRes.status === 201 && !!createEmpRes.data?.data?.id,
    createEmpRes.data
  );

  const createdUser = createEmpRes.data?.data;
  assert('Field NIK tersimpan akurat di database', createdUser?.nik === employeePayload.nik);
  assert('Field Alamat tersimpan akurat di database', createdUser?.address === employeePayload.address);
  assert('Field Tipe Pekerjaan tersimpan akurat', createdUser?.jobType === employeePayload.jobType);
  assert('Koordinat Peta Leaflet (Latitude/Longitude/Radius) tersimpan akurat',
    createdUser?.workLatitude === employeePayload.workLatitude &&
    createdUser?.workLongitude === employeePayload.workLongitude &&
    createdUser?.workRadius === employeePayload.workRadius
  );

  // TEST 6: Employee Login
  console.log('\n--- 6. UJI LOGIN PEGAWAI ---');
  const empLoginRes = await request('/api/auth/auto-login', {
    method: 'POST',
    body: {
      email: employeeEmail,
      password: 'Password123!',
    },
  });
  assert('Pegawai baru berhasil login', empLoginRes.status === 200 && !!empLoginRes.data?.data?.token, empLoginRes.data);
  const empToken = empLoginRes.data?.data?.token;

  // TEST 7: Biometric Face Registration
  console.log('\n--- 7. UJI PENDAFTARAN BIOMETRIK WAJAH (FACE RECOGNITION REGISTRATION) ---');
  // 128-dimensional biometric descriptor vector
  const mockDescriptor = Array.from({ length: 128 }, (_, i) => parseFloat((0.2 + (i % 10) * 0.05).toFixed(4)));

  const faceRegRes = await request('/api/face/register', {
    method: 'POST',
    token: empToken,
    body: {
      faceDescriptor: mockDescriptor,
    },
  });
  assert('Biometrik wajah 128-d berhasil didaftarkan di database', faceRegRes.status === 200 && faceRegRes.data?.data?.faceRegistered === true, faceRegRes.data);

  // TEST 8: Face Status
  console.log('\n--- 8. UJI STATUS BIOMETRIK WAJAH ---');
  const faceStatusRes = await request('/api/face/status', { token: empToken });
  assert('Status wajah terdaftar = TRUE', faceStatusRes.status === 200 && faceStatusRes.data?.data?.faceRegistered === true, faceStatusRes.data);

  // TEST 9: Face Verification (Match and Non-Match)
  console.log('\n--- 9. UJI VERIFIKASI WAJAH (EUCLIDEAN DISTANCE MATCHING) ---');
  // Test Match (same descriptor)
  const verifyMatchRes = await request('/api/face/verify', {
    method: 'POST',
    token: empToken,
    body: {
      faceDescriptor: mockDescriptor,
    },
  });
  assert('Verifikasi Wajah Cocok (Verified: TRUE, Distance < 0.6)',
    verifyMatchRes.status === 200 && verifyMatchRes.data?.data?.verified === true,
    verifyMatchRes.data
  );

  // Test Non-Match (different descriptor)
  const differentDescriptor = Array.from({ length: 128 }, () => 0.95);
  const verifyMismatchRes = await request('/api/face/verify', {
    method: 'POST',
    token: empToken,
    body: {
      faceDescriptor: differentDescriptor,
    },
  });
  assert('Verifikasi Wajah Beda Ditolak (Verified: FALSE)',
    verifyMismatchRes.status === 200 && verifyMismatchRes.data?.data?.verified === false,
    verifyMismatchRes.data
  );

  // TEST 10: Attendance Clock-In with Geofence & Face Verification
  console.log('\n--- 10. UJI PRESENSI MASUK (CLOCK-IN) DENGAN VALIDASI GEOFENCE & FACE RECOGNITION ---');
  // Case A: Missing face verification should fail
  const clockInNoFace = await request('/api/attendance/clock-in', {
    method: 'POST',
    token: empToken,
    body: {
      status: 'PRESENT',
      latitude: -6.208800,
      longitude: 106.845600,
      faceVerified: false,
    },
  });
  assert('Clock-in ditolak jika verifikasi wajah belum dipenuhi', clockInNoFace.status === 400, clockInNoFace.data);

  // Case B: Outside Geofence should fail
  const clockInOutsideGeofence = await request('/api/attendance/clock-in', {
    method: 'POST',
    token: empToken,
    body: {
      status: 'PRESENT',
      latitude: -6.300000, // Outside SCBD radius
      longitude: 106.900000,
      faceVerified: true,
    },
  });
  assert('Clock-in ditolak jika berada di luar radius geofence Leaflet', clockInOutsideGeofence.status === 400, clockInOutsideGeofence.data);

  // Case C: Valid Clock-in with Geofence and Face Verified
  const validClockIn = await request('/api/attendance/clock-in', {
    method: 'POST',
    token: empToken,
    body: {
      status: 'PRESENT',
      latitude: -6.208800, // Exactly inside geofence
      longitude: 106.845600,
      faceVerified: true,
    },
  });
  assert('Clock-in BERHASIL saat verifikasi wajah dan lokasi geofence valid', validClockIn.status === 201 || (validClockIn.status === 200 && validClockIn.data?.success), validClockIn.data);

  // TEST 11: Request Leave with New Database Fields (leaveType, leaveDuration, leaveDocument)
  console.log('\n--- 11. UJI PENGAJUAN IZIN / CUTI DENGAN KOLOM DATABASE BARU ---');
  // Calculate tomorrow's date to avoid collision with today's attendance
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const leavePayload = {
    status: 'LEAVE',
    date: tomorrowStr,
    leaveType: 'Cuti Tahunan',
    leaveDuration: 3,
    description: 'Cuti tahunan libur keluarga',
    leaveDocument: 'surat-izin-cuti-2026.pdf',
  };

  const leaveRes = await request('/api/attendance/leave', {
    method: 'POST',
    token: empToken,
    body: leavePayload,
  });
  assert('Pengajuan cuti berhasil tersimpan di database dengan leaveType & leaveDuration',
    leaveRes.status === 201 && leaveRes.data?.data?.leaveType === 'Cuti Tahunan',
    leaveRes.data
  );

  // TEST 12: Admin Review Leave Requests
  console.log('\n--- 12. UJI ADMIN REVIEW & APPROVAL CUTI ---');
  const getLeavesRes = await request('/api/attendance/admin/leaves?status=PENDING', { token: adminToken });
  assert('Admin berhasil mengambil daftar cuti pending', getLeavesRes.status === 200 && Array.isArray(getLeavesRes.data?.data), getLeavesRes.data);

  const pendingItem = getLeavesRes.data?.data?.find((l: any) => l.userId === createdUser?.id);
  if (pendingItem) {
    const approveRes = await request(`/api/attendance/admin/leaves/${pendingItem.id}`, {
      method: 'PUT',
      token: adminToken,
      body: {
        action: 'APPROVE',
        note: 'Disetujui oleh HRD Admin',
      },
    });
    assert('Admin berhasil menyetujui pengajuan cuti pegawai', approveRes.status === 200 && approveRes.data?.success === true, approveRes.data);
  }

  // TEST 13: Company Configuration (Admin Profile Settings)
  console.log('\n--- 13. UJI PENGATURAN PERUSAHAAN (COMPANY CONFIG) ---');
  const configUpdateRes = await request('/api/config', {
    method: 'PUT',
    token: adminToken,
    body: {
      companyName: 'PT HadirYuk Digital Solusi',
      companyEmail: 'kontak@hadiryuk.id',
      companyPhone: '+62 21-5550-1234',
      companyAddress: 'Jl. Jend. Sudirman Kav. 52-53, SCBD, Jakarta Selatan',
      companyWebsite: 'https://hadiryuk.id',
      workStartTime: '08:00',
      workEndTime: '17:00',
      workDays: '6',
      requireGps: true,
      requireSelfie: true,
      rejectOutsideShift: false,
      allowedRadiusMeters: 50,
      officeLatitude: -6.208800,
      officeLongitude: 106.845600,
    },
  });
  assert('Pengaturan profil perusahaan & aturan absensi berhasil diperbarui di database',
    configUpdateRes.status === 200 && configUpdateRes.data?.data?.companyEmail === 'kontak@hadiryuk.id',
    configUpdateRes.data
  );

  // TEST 14: Attendance Clock-Out
  console.log('\n--- 14. UJI PRESENSI PULANG (CLOCK-OUT) ---');
  const validClockOut = await request('/api/attendance/clock-out', {
    method: 'POST',
    token: empToken,
    body: {
      latitude: -6.208800,
      longitude: 106.845600,
      faceVerified: true,
    },
  });
  assert('Clock-out BERHASIL dengan verifikasi wajah biometrik', validClockOut.status === 200 && validClockOut.data?.success === true, validClockOut.data);

  // FINAL SUMMARY
  console.log('\n================================================================');
  console.log(`📊 RINGKASAN HASIL PENGUJIAN:`);
  console.log(`   Total Pengujian : ${passedCount + failedCount}`);
  console.log(`   Berhasil (Pass) : ${passedCount}`);
  console.log(`   Gagal (Fail)    : ${failedCount}`);
  console.log('================================================================\n');

  if (failedCount === 0) {
    console.log('🎉 SEMUA PENGUJIAN BERHASIL 100%! Aplikasi siap digunakan.');
  } else {
    console.log('⚠️ Terdapat pengujian yang perlu dicek.');
  }
}

runTests().catch(console.error);
