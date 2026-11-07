import { getPublicPrisma } from '../prisma/tenant-prisma';

export interface TenantSubscriptionStatus {
  isBlocked: boolean;
  hasUnpaidBilling: boolean;
  isInGracePeriod: boolean;
  daysLeftInGrace: number;
  daysOverdue: number;
  effectiveGracePeriod: number;
  dueDate: string | null;
  deadlineDate: string | null;
  billingId: number | null;
  amount: number;
  month: number | null;
  year: number | null;
  message: string;
}

/**
 * Memeriksa status langganan tenant:
 * 1. Jika tidak ada tagihan PENDING: aman (tidak diblokir).
 * 2. Jika ada tagihan PENDING:
 *    - Hitung tanggal jatuh tempo (dueDate)
 *    - Hitung batas akhir masa tenggat (deadlineDate = dueDate + gracePeriodDays)
 *    - Jika masih dalam masa tenggat (now <= deadlineDate): tidak diblokir, isInGracePeriod = true.
 *    - Jika melewati masa tenggat (now > deadlineDate): isBlocked = true (karyawan tidak bisa absen).
 */
export async function getTenantSubscriptionStatus(tenantId: number): Promise<TenantSubscriptionStatus> {
  const publicPrisma = getPublicPrisma();

  try {
    const [superAdmin, tenant, unpaidBilling] = await Promise.all([
      publicPrisma.superAdmin.findFirst(),
      publicPrisma.tenant.findUnique({
        where: { id: tenantId },
      }),
      publicPrisma.subscriptionBilling.findFirst({
        where: {
          tenantId,
          status: 'PENDING',
        },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      }),
    ]);

    const defaultGracePeriod = superAdmin?.defaultGracePeriodDays ?? 3;
    const defaultDueDay = superAdmin?.billingDueDay ?? 1;
    const shouldBlockOnOverdue = superAdmin?.blockAttendanceOnOverdue !== false;

    // Tidak ada tagihan pending: akun lunas & aktif
    if (!unpaidBilling) {
      return {
        isBlocked: false,
        hasUnpaidBilling: false,
        isInGracePeriod: false,
        daysLeftInGrace: 0,
        daysOverdue: 0,
        effectiveGracePeriod: tenant?.customGracePeriodDays ?? defaultGracePeriod,
        dueDate: null,
        deadlineDate: null,
        billingId: null,
        amount: 0,
        month: null,
        year: null,
        message: 'Layanan aktif dan tagihan lunas.',
      };
    }

    // Tentukan masa tenggat yang berlaku (Prioritas: custom per-tenant -> per-billing -> default global)
    const effectiveGracePeriod =
      tenant?.customGracePeriodDays ??
      unpaidBilling.gracePeriodDays ??
      defaultGracePeriod;

    // Tentukan tanggal jatuh tempo (dueDate)
    let dueDateTime: Date;
    if (unpaidBilling.dueDate) {
      dueDateTime = new Date(unpaidBilling.dueDate);
    } else {
      // Default: Tanggal billingDueDay pada bulan dan tahun tagihan
      dueDateTime = new Date(
        Date.UTC(unpaidBilling.year, unpaidBilling.month - 1, defaultDueDay, 0, 0, 0)
      );
      // Jika createdAt lebih baru dari tanggal 1, gunakan createdAt sebagai awal jatuh tempo
      if (unpaidBilling.createdAt && unpaidBilling.createdAt.getTime() > dueDateTime.getTime()) {
        dueDateTime = new Date(unpaidBilling.createdAt);
      }
    }

    // Batas akhir masa tenggat (deadlineDate = dueDateTime + effectiveGracePeriod hari)
    const deadlineDateTime = new Date(dueDateTime.getTime() + effectiveGracePeriod * 24 * 60 * 60 * 1000);
    // Set deadline ke akhir hari 23:59:59 lokal/UTC
    deadlineDateTime.setUTCHours(23, 59, 59, 999);

    const now = new Date();
    const diffMs = deadlineDateTime.getTime() - now.getTime();

    if (diffMs >= 0) {
      // Masih dalam masa tenggat (Grace Period)
      const daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      return {
        isBlocked: false,
        hasUnpaidBilling: true,
        isInGracePeriod: true,
        daysLeftInGrace: daysLeft,
        daysOverdue: 0,
        effectiveGracePeriod,
        dueDate: dueDateTime.toISOString(),
        deadlineDate: deadlineDateTime.toISOString(),
        billingId: unpaidBilling.id,
        amount: unpaidBilling.amount,
        month: unpaidBilling.month,
        year: unpaidBilling.year,
        message: `Tagihan periode ${unpaidBilling.month}/${unpaidBilling.year} (Rp ${Math.round(unpaidBilling.amount).toLocaleString('id-ID')}) menunggu pembayaran. Masa tenggat tersisa ${daysLeft} hari.`,
      };
    } else {
      // Lewat masa tenggat (Overdue / Expired)
      const daysOverdue = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24)) + 1;
      const isBlocked = shouldBlockOnOverdue;

      return {
        isBlocked,
        hasUnpaidBilling: true,
        isInGracePeriod: false,
        daysLeftInGrace: 0,
        daysOverdue,
        effectiveGracePeriod,
        dueDate: dueDateTime.toISOString(),
        deadlineDate: deadlineDateTime.toISOString(),
        billingId: unpaidBilling.id,
        amount: unpaidBilling.amount,
        month: unpaidBilling.month,
        year: unpaidBilling.year,
        message: isBlocked
          ? `Layanan absensi ditangguhkan: Tagihan periode ${unpaidBilling.month}/${unpaidBilling.year} telah melewati masa tenggat pembayaran selama ${daysOverdue} hari (Masa tenggat: ${effectiveGracePeriod} hari). Harap hubungi Admin perusahaan untuk menyelesaikan pembayaran langganan.`
          : `Tagihan periode ${unpaidBilling.month}/${unpaidBilling.year} telah melewati masa tenggat ${daysOverdue} hari. Harap segera lakukan pembayaran.`,
      };
    }
  } catch (error) {
    console.error('Error checking tenant subscription status:', error);
    // Fail-safe: jika ada error database pada pengecekan billing, jangan blokir pengguna
    return {
      isBlocked: false,
      hasUnpaidBilling: false,
      isInGracePeriod: false,
      daysLeftInGrace: 0,
      daysOverdue: 0,
      effectiveGracePeriod: 3,
      dueDate: null,
      deadlineDate: null,
      billingId: null,
      amount: 0,
      month: null,
      year: null,
      message: 'Sistem aktif',
    };
  }
}

export interface SubscriptionCalculation {
  userCount: number;
  tierQuota: number;
  isMicro: boolean;
  packageName: string;
  ratePerUser: number;
  totalAmount: number;
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
 *      - 20 karyawan: Rp 180.000
 *      - 30 karyawan: Rp 270.000
 *      - 40 karyawan: Rp 360.000
 *      - 50 karyawan: Rp 450.000
 *      - 100 karyawan: Rp 900.000
 */
export function calculateSubscriptionPrice(userCount: number): SubscriptionCalculation {
  const count = Math.max(0, Math.floor(userCount));

  if (count === 0) {
    return {
      userCount: 0,
      tierQuota: 0,
      isMicro: true,
      packageName: 'Paket Bebas (0 Karyawan)',
      ratePerUser: 0,
      totalAmount: 0,
    };
  }

  // Kurang dari 10 karyawan (< 10): Rp 10.000 per karyawan
  if (count < 10) {
    const total = count * 10000;
    return {
      userCount: count,
      tierQuota: count,
      isMicro: true,
      packageName: `Paket Starter (${count} Karyawan)`,
      ratePerUser: 10000,
      totalAmount: total,
    };
  }

  // 10 ke atas: Dibulatkan ke kuota kelipatan 10 di atasnya
  const tierQuota = Math.ceil(count / 10) * 10;

  // Harga untuk kelipatan 10:
  // 10 karyawan: Rp 100.000
  // >= 20 karyawan: (tierQuota / 10) * 90.000
  let totalAmount = 0;
  if (tierQuota === 10) {
    totalAmount = 100000;
  } else {
    totalAmount = (tierQuota / 10) * 90000;
  }

  return {
    userCount: count,
    tierQuota,
    isMicro: false,
    packageName: `Paket ${tierQuota} Karyawan`,
    ratePerUser: Math.round(totalAmount / tierQuota),
    totalAmount,
  };
}
