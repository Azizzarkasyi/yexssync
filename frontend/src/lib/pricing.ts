export interface SubscriptionCalculation {
  userCount: number;
  tierQuota: number;
  isMicro: boolean;
  packageName: string;
  ratePerUser: number;
  totalAmountMonthly: number;
  totalAmountYearly: number;
}

/**
 * Kalkulasi Harga Langganan Aplikasi:
 * 1. Kurang dari 10 karyawan (< 10): Rp 10.000 / karyawan / bulan.
 * 2. 10 karyawan atau lebih: Kuota dihitung berdasarkan kelipatan 10 (10, 20, 30, 40, 50, dst.).
 *    Jika jumlah karyawan tidak pas di kelipatan 10 (misal 14 atau 25 karyawan),
 *    dibulatkan ke kuota kelipatan 10 di atasnya (14 -> 20 karyawan; 25 -> 30 karyawan).
 * 3. Skema tarif kelipatan 10:
 *    - 10 karyawan: Rp 100.000 / bulan
 *    - >= 20 karyawan: (tierQuota / 10) * Rp 90.000 / bulan
 *      Contoh:
 *      - 20 karyawan: Rp 180.000 / bulan
 *      - 30 karyawan: Rp 270.000 / bulan
 *      - 40 karyawan: Rp 360.000 / bulan
 *      - 50 karyawan: Rp 450.000 / bulan
 *      - 100 karyawan: Rp 900.000 / bulan
 * 4. Pembayaran tahunan: Diskon 20% (Hemat 2 bulan).
 */
export function calculateSubscriptionPrice(
  userCount: number,
  billingCycle: 'monthly' | 'yearly' = 'monthly'
): SubscriptionCalculation {
  const count = Math.max(0, Math.floor(userCount));

  if (count === 0) {
    return {
      userCount: 0,
      tierQuota: 0,
      isMicro: true,
      packageName: 'Paket Bebas (0 Karyawan)',
      ratePerUser: 0,
      totalAmountMonthly: 0,
      totalAmountYearly: 0,
    };
  }

  // Kurang dari 10 karyawan (< 10): Rp 10.000 per karyawan
  if (count < 10) {
    const totalMonthly = count * 10000;
    const totalYearly = Math.round(totalMonthly * 0.8);
    return {
      userCount: count,
      tierQuota: count,
      isMicro: true,
      packageName: `Paket Starter (${count} Karyawan)`,
      ratePerUser: 10000,
      totalAmountMonthly: totalMonthly,
      totalAmountYearly: totalYearly,
    };
  }

  // 10 ke atas: Dibulatkan ke kuota kelipatan 10 di atasnya
  const tierQuota = Math.ceil(count / 10) * 10;

  let totalMonthly = 0;
  if (tierQuota === 10) {
    totalMonthly = 100000;
  } else {
    totalMonthly = (tierQuota / 10) * 90000;
  }
  const totalYearly = Math.round(totalMonthly * 0.8);

  return {
    userCount: count,
    tierQuota,
    isMicro: false,
    packageName: `Paket ${tierQuota} Karyawan`,
    ratePerUser: Math.round(totalMonthly / tierQuota),
    totalAmountMonthly: totalMonthly,
    totalAmountYearly: totalYearly,
  };
}

export function formatRupiah(amount: number): string {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

