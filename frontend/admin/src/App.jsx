import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import RoleSwitcherModal from './components/RoleSwitcherModal';
import ActivateProModal from './components/ActivateProModal';
import MemberDetailModal from './components/MemberDetailModal';
import TenantDetailModal from './components/TenantDetailModal';
import CreateVoucherModal from './components/CreateVoucherModal';
import VoucherDetailModal from './components/VoucherDetailModal';
import MobileBottomNav from './components/MobileBottomNav';

// Views
import OverviewView from './views/OverviewView';
import MembersView from './views/MembersView';
import SubscriptionsView from './views/SubscriptionsView';
import TenantsView from './views/TenantsView';
import TroubleshootingView from './views/TroubleshootingView';
import RbacView from './views/RbacView';
import AuditLogsView from './views/AuditLogsView';
import VouchersView from './views/VouchersView';
import FeatureLimitsView from './views/FeatureLimitsView';
import UtilityCategoriesView from './views/UtilityCategoriesView';
import MasterCategoriesView from './views/MasterCategoriesView';
import AdminLoginPage from './components/AdminLoginPage';

// Services & RBAC
import { adminData } from './services/adminData';
import { ADMIN_ROLES } from './utils/rbac';

export default function App() {
  // Admin authentication token & role
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('homehub_admin_token') || null);
  const [currentRole, setCurrentRole] = useState(() => {
    const savedRoleId = localStorage.getItem('homehub_admin_role_id');
    return ADMIN_ROLES[savedRoleId] || ADMIN_ROLES.SUPERADMIN;
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [headerSearchTerm, setHeaderSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data states loaded from LocalStorage / Seed
  const [members, setMembers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [featureLimits, setFeatureLimits] = useState(() => adminData.getFeatureLimits());
  const [utilityCategories, setUtilityCategories] = useState(() => adminData.getUtilityCategories());
  const [categoriesByModule, setCategoriesByModule] = useState(() => ({
    utility: adminData.getModuleCategories('utility'),
    asset: adminData.getModuleCategories('asset'),
    grocery: adminData.getModuleCategories('grocery'),
    expense: adminData.getModuleCategories('expense'),
    activity: adminData.getModuleCategories('activity')
  }));
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    suspendedMembers: 0,
    proMembers: 0,
    freeMembers: 0,
    conversionRate: '0.0',
    totalTenants: 0,
    proTenants: 0,
    freeTenants: 0,
    totalRevenue: 0,
    mrr: 0,
    recentSubscriptions: [],
  });

  // Modal States
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isActivateProModalOpen, setIsActivateProModalOpen] = useState(false);
  const [isCreateVoucherModalOpen, setIsCreateVoucherModalOpen] = useState(false);
  const [selectedVoucherForDetail, setSelectedVoucherForDetail] = useState(null);
  const [selectedTenantForActivation, setSelectedTenantForActivation] = useState(null);
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState(null);
  const [selectedTenantForDetail, setSelectedTenantForDetail] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Load / Reload Data
  const reloadData = () => {
    setMembers(adminData.getMembers());
    setTenants(adminData.getTenants());
    setSubscriptions(adminData.getSubscriptions());
    setAuditLogs(adminData.getAuditLogs());
    setVouchers(adminData.getVouchers());
    setFeatureLimits(adminData.getFeatureLimits());
    setUtilityCategories(adminData.getUtilityCategories());
    setCategoriesByModule({
      utility: adminData.getModuleCategories('utility'),
      asset: adminData.getModuleCategories('asset'),
      grocery: adminData.getModuleCategories('grocery'),
      expense: adminData.getModuleCategories('expense'),
      activity: adminData.getModuleCategories('activity')
    });
    setStats(adminData.getOverviewStats());
  };

  useEffect(() => {
    reloadData();
    // Load data from backend on initial mount
    adminData.fetchDataFromBackend().then(() => reloadData()).catch(() => {});

    // Refresh on tab focus (e.g. after testing in user app tab)
    const handleFocus = () => {
      adminData.fetchDataFromBackend().then(() => reloadData()).catch(() => {});
    };
    window.addEventListener('focus', handleFocus);

    // Listen on BroadcastChannel if available
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('homehub_live_sync_bus');
        bc.onmessage = (event) => {
          if (
            event?.data?.type === 'VOUCHER_CLAIMED' || 
            event?.data?.type === 'ORDER_CREATED' ||
            event?.data?.type === 'UTILITY_CATEGORIES_UPDATED' ||
            event?.data?.type === 'ASSET_CATEGORIES_UPDATED' ||
            event?.data?.type === 'GROCERY_CATEGORIES_UPDATED' ||
            event?.data?.type === 'EXPENSE_CATEGORIES_UPDATED' ||
            event?.data?.type === 'ACTIVITY_CATEGORIES_UPDATED' ||
            event?.data?.type === 'MASTER_CATEGORIES_UPDATED'
          ) {
            adminData.fetchDataFromBackend().then(() => reloadData()).catch(() => {});
          }
        };
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('focus', handleFocus);
      if (bc) bc.close();
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleSaveLimits = async (newLimits) => {
    try {
      const res = await adminData.updateFeatureLimits({
        limits: newLimits,
        adminName: currentRole.label,
        adminRole: currentRole.id
      });
      setFeatureLimits(res.limits);
      reloadData();
      showToast('Limit fitur Free & PRO berhasil diperbarui!');
    } catch (err) {
      alert(`Gagal menyimpan limit: ${err.message}`);
    }
  };

  const handleResetLimits = async () => {
    try {
      const res = await adminData.resetFeatureLimits({
        adminName: currentRole.label,
        adminRole: currentRole.id
      });
      setFeatureLimits(res.limits);
      reloadData();
      showToast('Limit fitur telah dikembalikan ke default!');
    } catch (err) {
      alert(`Gagal mengembalikan default limit: ${err.message}`);
    }
  };

  const handleCreateCategory = async (module, data) => {
    try {
      await adminData.createModuleCategory(module, {
        ...data,
        adminName: currentRole.label,
        adminRole: currentRole.id
      });
      reloadData();
      showToast(`Kategori "${data.name}" berhasil dibuat!`);
    } catch (err) {
      alert(`Gagal membuat kategori: ${err.message}`);
    }
  };

  const handleUpdateCategory = async (module, id, data) => {
    try {
      await adminData.updateModuleCategory(module, id, {
        ...data,
        adminName: currentRole.label,
        adminRole: currentRole.id
      });
      reloadData();
      showToast('Kategori berhasil diperbarui!');
    } catch (err) {
      alert(`Gagal memperbarui kategori: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (module, id) => {
    try {
      await adminData.deleteModuleCategory(module, id, {
        adminName: currentRole.label,
        adminRole: currentRole.id
      });
      reloadData();
      showToast('Kategori berhasil dihapus!');
    } catch (err) {
      alert(`Gagal menghapus kategori: ${err.message}`);
    }
  };

  const handleToggleCategoryStatus = async (module, id) => {
    try {
      await adminData.toggleModuleCategoryStatus(module, id, {
        adminName: currentRole.label,
        adminRole: currentRole.id
      });
      reloadData();
      showToast('Status kategori diperbarui!');
    } catch (err) {
      alert(`Gagal mengubah status kategori: ${err.message}`);
    }
  };

  const handleCreateUtilityCategory = async (data) => handleCreateCategory('utility', data);
  const handleUpdateUtilityCategory = async (id, data) => handleUpdateCategory('utility', id, data);
  const handleDeleteUtilityCategory = async (id) => handleDeleteCategory('utility', id);
  const handleToggleUtilityCategoryStatus = async (id) => handleToggleCategoryStatus('utility', id);

  // Actions
  const handleRoleChange = (roleId) => {
    const target = ADMIN_ROLES[roleId];
    if (target) {
      setCurrentRole(target);
      showToast(`Mode akses beralih ke: ${target.label}`);
    }
  };

  const handleOpenActivatePro = (tenant = null) => {
    setSelectedTenantForActivation(tenant);
    setIsActivateProModalOpen(true);
  };

  const handleConfirmActivation = (formData) => {
    try {
      const result = adminData.activateProManual({
        ...formData,
        adminName: currentRole.label,
        adminRole: currentRole.id
      });
      reloadData();
      setIsActivateProModalOpen(false);
      showToast(`Berhasil aktivasi PRO untuk ${result.tenant.name}!`);
    } catch (err) {
      alert(`Gagal aktivasi PRO: ${err.message}`);
    }
  };

  const handleDowngradeTenant = (householdId) => {
    try {
      const result = adminData.downgradeHousehold({
        householdId,
        reason: 'Permintaan pelanggan / pembatalan',
        adminName: currentRole.label,
        adminRole: currentRole.id
      });
      reloadData();
      if (selectedTenantForDetail && selectedTenantForDetail.id === householdId) {
        setSelectedTenantForDetail(null);
      }
      showToast(`Paket ${result.tenant.name} berhasil diturunkan ke FREE.`);
    } catch (err) {
      alert(`Gagal downgrade: ${err.message}`);
    }
  };

  const handleToggleUserStatus = (userId, newStatus) => {
    try {
      const result = adminData.toggleUserStatus({
        userId,
        newStatus,
        adminName: currentRole.label,
        adminRole: currentRole.id
      });
      reloadData();
      if (selectedMemberForDetail && selectedMemberForDetail.id === userId) {
        setSelectedMemberForDetail(result.member);
      }
      showToast(`Status pengguna ${result.member.name} diubah menjadi ${newStatus}.`);
    } catch (err) {
      alert(`Gagal mengubah status: ${err.message}`);
    }
  };

  const handleCreateVoucher = (formData) => {
    try {
      const result = adminData.createVoucher({
        ...formData,
        adminName: currentRole.label,
        adminRole: currentRole.id
      });
      reloadData();
      setIsCreateVoucherModalOpen(false);
      showToast(`Voucher ${result.voucher.code} berhasil diterbitkan dengan kuota ${result.voucher.max_quota} klaim!`);
    } catch (err) {
      alert(`Gagal membuat voucher: ${err.message}`);
    }
  };

  const handleClaimVoucher = (formData) => {
    try {
      const result = adminData.claimVoucher({
        ...formData,
        adminName: currentRole.label,
        adminRole: currentRole.id
      });
      reloadData();
      // Keep modal in sync
      setSelectedVoucherForDetail(result.voucher);
      showToast(`Voucher ${result.voucher.code} berhasil diklaim untuk ${formData.userName}! Sisa kuota: ${result.remainingQuota}`);
    } catch (err) {
      alert(`Gagal klaim voucher: ${err.message}`);
    }
  };

  const handleToggleVoucherStatus = (voucherId, newStatus) => {
    try {
      const result = adminData.toggleVoucherStatus({
        voucherId,
        newStatus,
        adminName: currentRole.label,
        adminRole: currentRole.id
      });
      reloadData();
      if (selectedVoucherForDetail && selectedVoucherForDetail.id === voucherId) {
        setSelectedVoucherForDetail(result.voucher);
      }
      showToast(`Status voucher diubah menjadi ${newStatus}.`);
    } catch (err) {
      alert(`Gagal mengubah status voucher: ${err.message}`);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset seluruh data percobaan ke kondisi awal pabrik?')) {
      adminData.resetAllData();
      reloadData();
      showToast('Data berhasil di-reset ke kondisi awal.');
    }
  };

  // Dynamic Page Titles based on Tab
  const pageMeta = useMemo(() => {
    switch (activeTab) {
      case 'overview':
        return { title: 'Dashboard Eksekutif', subtitle: 'Ringkasan operasional dan pertumbuhan ekosistem HomeHub' };
      case 'members':
        return { title: 'Direktori Anggota & Member', subtitle: 'Monitoring status keaktifan dan masa berlaku membership' };
      case 'subscriptions':
        return { title: 'Membership Berbayar & PRO Edition', subtitle: 'Manajemen omset, MRR, dan transaksi pembayaran' };
      case 'vouchers':
        return { title: 'Cetak & Manajemen Voucher Diskon', subtitle: 'Penerbitan kupon promo membership, kontrol kuota klaim, dan rekap pengguna' };
      case 'limits':
        return { title: 'Kontrol Limit & Kuota Fitur', subtitle: 'Atur kuota numerik dan hak akses fitur Free & PRO secara dinamis' };
      case 'categories':
      case 'utility_categories':
        return { title: 'Master Data & Kategori Sistem', subtitle: 'Konfigurasi dinamis untuk Utilitas, Aset, Belanjaan, Pengeluaran, dan Agenda' };
      case 'tenants':
        return { title: 'Tenant & Properti Rumah', subtitle: 'Daftar rumah tangga dan pemakaian kuota fitur' };
      case 'troubleshooting':
        return { title: 'Pusat Troubleshooting & Bantuan', subtitle: 'Penanganan komplain aktivasi dan pemulihan akun' };
      case 'rbac':
        return { title: 'Role-Based Access Control (RBAC)', subtitle: 'Konfigurasi tingkat wewenang staf operasional' };
      case 'audit_logs':
        return { title: 'Rekam Jejak Audit (Audit Trail)', subtitle: 'Pencatatan kepatuhan seluruh aksi admin' };
      default:
        return { title: 'Admin BackOffice', subtitle: 'HomeHub Operations Portal' };
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('homehub_admin_token');
    localStorage.removeItem('homehub_admin_user');
    localStorage.removeItem('homehub_admin_role_id');
    setAdminToken(null);
  };

  if (!adminToken) {
    return (
      <AdminLoginPage
        onLoginSuccess={(token, user, role) => {
          setAdminToken(token);
          setCurrentRole(role);
          reloadData();
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-emerald-400/30">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentRole={currentRole}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentRole={currentRole}
          onRoleChange={handleRoleChange}
          onOpenRoleModal={() => setIsRoleModalOpen(true)}
          onResetData={handleResetData}
          onRefresh={reloadData}
          searchTerm={headerSearchTerm}
          onSearchChange={setHeaderSearchTerm}
          pageTitle={pageMeta.title}
          pageSubtitle={pageMeta.subtitle}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onLogout={handleLogout}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-6">
          {activeTab === 'overview' && (
            <OverviewView
              stats={stats}
              members={members}
              tenants={tenants}
              onSelectMember={setSelectedMemberForDetail}
              onSelectTenant={setSelectedTenantForDetail}
              onOpenActivatePro={handleOpenActivatePro}
              onNavigate={setActiveTab}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'members' && (
            <MembersView
              members={members}
              tenants={tenants}
              searchTerm={headerSearchTerm}
              onSelectMember={setSelectedMemberForDetail}
              onOpenActivatePro={handleOpenActivatePro}
              onToggleStatus={handleToggleUserStatus}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'subscriptions' && (
            <SubscriptionsView
              subscriptions={subscriptions}
              stats={stats}
              searchTerm={headerSearchTerm}
              onOpenActivatePro={handleOpenActivatePro}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'vouchers' && (
            <VouchersView
              vouchers={vouchers}
              members={members}
              tenants={tenants}
              searchTerm={headerSearchTerm}
              onOpenCreateVoucher={() => setIsCreateVoucherModalOpen(true)}
              onSelectVoucher={(v) => setSelectedVoucherForDetail(v)}
              onToggleStatus={handleToggleVoucherStatus}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'limits' && (
            <FeatureLimitsView
              currentRole={currentRole}
              currentLimits={featureLimits}
              onSaveLimits={handleSaveLimits}
              onResetLimits={handleResetLimits}
            />
          )}

          {(activeTab === 'categories' || activeTab === 'utility_categories') && (
            <MasterCategoriesView
              defaultTab="utility"
              categoriesByModule={categoriesByModule}
              onGetCategories={(mod) => categoriesByModule[mod] || []}
              onCreateCategory={handleCreateCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onToggleStatus={handleToggleCategoryStatus}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'tenants' && (
            <TenantsView
              tenants={tenants}
              searchTerm={headerSearchTerm}
              onSelectTenant={setSelectedTenantForDetail}
              onOpenActivatePro={handleOpenActivatePro}
              onDowngradeTenant={handleDowngradeTenant}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'troubleshooting' && (
            <TroubleshootingView
              members={members}
              tenants={tenants}
              onOpenActivatePro={handleOpenActivatePro}
              onSelectMember={setSelectedMemberForDetail}
              onSelectTenant={setSelectedTenantForDetail}
              onToggleUserStatus={handleToggleUserStatus}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'rbac' && (
            <RbacView
              currentRole={currentRole}
              onSelectRole={(r) => {
                setCurrentRole(r);
                showToast(`Role aktif diubah menjadi: ${r.label}`);
              }}
            />
          )}

          {activeTab === 'audit_logs' && (
            <AuditLogsView
              auditLogs={auditLogs}
              searchTerm={headerSearchTerm}
              currentRole={currentRole}
            />
          )}
        </main>
      </div>

      {/* Sleek Mobile Bottom Navigation Bar for Admin */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onToggleMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Modals */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentRole={currentRole}
        onSelectRole={(r) => {
          setCurrentRole(r);
          setIsRoleModalOpen(false);
          showToast(`Mode akses beralih ke: ${r.label}`);
        }}
      />

      <ActivateProModal
        isOpen={isActivateProModalOpen}
        onClose={() => {
          setIsActivateProModalOpen(false);
          setSelectedTenantForActivation(null);
        }}
        tenants={tenants}
        selectedTenant={selectedTenantForActivation}
        onConfirmActivation={handleConfirmActivation}
        currentAdminName={currentRole.label}
        currentAdminRole={currentRole.id}
      />

      <CreateVoucherModal
        isOpen={isCreateVoucherModalOpen}
        onClose={() => setIsCreateVoucherModalOpen(false)}
        onConfirmCreate={handleCreateVoucher}
        currentAdminName={currentRole.label}
        currentAdminRole={currentRole.id}
      />

      <VoucherDetailModal
        isOpen={Boolean(selectedVoucherForDetail)}
        onClose={() => setSelectedVoucherForDetail(null)}
        voucher={selectedVoucherForDetail}
        members={members}
        tenants={tenants}
        onClaimVoucher={handleClaimVoucher}
        onToggleStatus={handleToggleVoucherStatus}
        currentRole={currentRole}
      />

      <MemberDetailModal
        isOpen={Boolean(selectedMemberForDetail)}
        onClose={() => setSelectedMemberForDetail(null)}
        member={selectedMemberForDetail}
        onToggleStatus={handleToggleUserStatus}
        onOpenActivatePro={(m) => {
          setSelectedMemberForDetail(null);
          const userTenant = tenants.find(t => t.owner_id === m.id) || tenants[0];
          handleOpenActivatePro(userTenant);
        }}
        currentRole={currentRole}
      />

      <TenantDetailModal
        isOpen={Boolean(selectedTenantForDetail)}
        onClose={() => setSelectedTenantForDetail(null)}
        tenant={selectedTenantForDetail}
        onOpenActivatePro={(t) => {
          setSelectedTenantForDetail(null);
          handleOpenActivatePro(t);
        }}
        onDowngrade={(householdId) => {
          handleDowngradeTenant(householdId);
        }}
        currentRole={currentRole}
      />

    </div>
  );
}
