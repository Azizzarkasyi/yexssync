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
