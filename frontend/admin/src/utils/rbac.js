/**
 * Role-Based Access Control (RBAC) Definition for HomeHub Admin BackOffice
 */

export const ADMIN_ROLES = {
  SUPERADMIN: {
    id: 'SUPERADMIN',
    label: 'Super Admin',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: '👑',
    description: 'Akses tanpa batas ke seluruh data, aktivasi pembayaran, tenant, kontrol RBAC, dan audit trail.',
    permissions: {
      view_overview: true,
      view_members: true,
      edit_members: true, // Suspend, Unsuspend, Reset status
      view_tenants: true,
      edit_tenants: true,
      activate_pro_manual: true, // Troubleshooting & bypass payment
      downgrade_pro: true,
      view_finance: true, // MRR, revenue, transaction history
      export_data: true,
      view_analytics: true,
      manage_rbac: true, // Kelola admin lain & izin
      view_audit_logs: true,
      view_vouchers: true,
      manage_vouchers: true, // Generate voucher, atur kuota diskon & cetak
      manage_limits: true, // Mengatur batas kuota Free & PRO dinamis
      view_categories: true,
      manage_categories: true, // Kelola master kategori & utilitas
    }
  },
  HELPDESK: {
    id: 'HELPDESK',
    label: 'Help Desk / Support',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: '🎧',
    description: 'Troubleshooting akun pengguna, asistensi aktivasi PRO darurat, dan pengecekan status membership.',
    permissions: {
      view_overview: true,
      view_members: true,
      edit_members: true,
      view_tenants: true,
      edit_tenants: false,
      activate_pro_manual: true, // Boleh bantu aktivasi kendala pelanggan
      downgrade_pro: false,
      view_finance: false, // Tidak berhak melihat total pendapatan perusahaan
      export_data: false,
      view_analytics: false,
      manage_rbac: false,
      view_audit_logs: true,
      view_vouchers: true,
      manage_vouchers: false, // Read-only voucher check
      manage_limits: false,
      view_categories: true,
      manage_categories: false,
    }
  },
  FINANCE: {
    id: 'FINANCE',
    label: 'Finance & Billing',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: '💳',
    description: 'Verifikasi pembayaran manual, pemantauan omset/MRR, rekonsiliasi transaksi, dan pembatalan langganan.',
    permissions: {
      view_overview: true,
      view_members: true,
      edit_members: false,
      view_tenants: true,
      edit_tenants: false,
      activate_pro_manual: true, // Verifikasi konfirmasi transfer bank
      downgrade_pro: true, // Refund / pembatalan
      view_finance: true,
      export_data: true,
      view_analytics: true,
      manage_rbac: false,
      view_audit_logs: true,
      view_vouchers: true,
      manage_vouchers: true, // Boleh terbitkan promo voucher diskon
      manage_limits: false,
      view_categories: true,
      manage_categories: false,
    }
  },
  MARKETING: {
    id: 'MARKETING',
    label: 'Growth & Marketing',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    icon: '📈',
    description: 'Analisis rasio konversi Free ke PRO, statistik pertumbuhan tenant, dan tren retensi pengguna.',
    permissions: {
      view_overview: true,
      view_members: true, // Kontak sensitif disamarkan
      edit_members: false,
      view_tenants: true,
      edit_tenants: false,
      activate_pro_manual: false,
      downgrade_pro: false,
      view_finance: false,
      export_data: true,
      view_analytics: true,
      manage_rbac: false,
      view_audit_logs: false,
      view_vouchers: true,
      manage_vouchers: true, // Pembuat kampanye promosi voucher utama
      manage_limits: false,
      view_categories: true,
      manage_categories: false,
    }
  },
  CONTACT_CENTER: {
    id: 'CONTACT_CENTER',
    label: 'Contact Center (CS)',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: '📞',
    description: 'Pencarian cepat nomor HP/email anggota dan pengecekan masa aktif paket saat menerima telepon customer.',
    permissions: {
      view_overview: true,
      view_members: true, // Read-only
      edit_members: false,
      view_tenants: true, // Read-only
      edit_tenants: false,
      activate_pro_manual: false,
      downgrade_pro: false,
      view_finance: false,
      export_data: false,
      view_analytics: false,
      manage_rbac: false,
      view_audit_logs: false,
      view_vouchers: true,
      manage_vouchers: false, // Read-only check
      manage_limits: false,
      view_categories: true,
      manage_categories: false,
    }
  }
};

/**
 * Check if a role has a specific permission (Fail-Secure)
 */
export function hasPermission(roleId, permissionKey) {
  const role = ADMIN_ROLES[roleId];
  if (!role || !role.permissions) return false;
  return Boolean(role.permissions[permissionKey]);
}
