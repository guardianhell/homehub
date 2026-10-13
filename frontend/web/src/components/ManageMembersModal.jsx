import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Users,
  UserPlus,
  Shield,
  Crown,
  User,
  Sparkles,
  Trash2,
  Check,
  AlertCircle,
  Clock,
  Mail,
  ChevronDown,
  Info
} from 'lucide-react';
import api from '../services/api';
import { safeGetJSON, safeSetJSON } from '../utils/safeStorage';
import { useFeatureLimits } from '../utils/featureLimitsHelper';

const ROLE_CONFIGS = {
  OWNER: {
    labelKey: 'members.role_owner',
    defaultLabel: 'Kepala Keluarga (Owner)',
    descKey: 'members.role_desc_owner',
    defaultDesc: 'Pemilik utama dengan akses penuh konfigurasi dan langganan.',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    avatarBg: 'bg-gradient-to-br from-amber-400 to-amber-600 text-white',
    icon: Crown,
  },
  ADMIN: {
    labelKey: 'members.role_admin',
    defaultLabel: 'Pengelola (Admin)',
    descKey: 'members.role_desc_admin',
    defaultDesc: 'Dapat mengelola tagihan, belanja, aset, keuangan, dan anggota.',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    avatarBg: 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white',
    icon: Shield,
  },
  MEMBER: {
    labelKey: 'members.role_member',
    defaultLabel: 'Anggota (Member)',
    descKey: 'members.role_desc_member',
    defaultDesc: 'Dapat melihat data, checklist belanja, dan mencatat agenda.',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    avatarBg: 'bg-gradient-to-br from-slate-500 to-slate-700 text-white',
    icon: User,
  },
  HELPER: {
    labelKey: 'members.role_helper',
    defaultLabel: 'Asisten / Staf (Helper)',
    descKey: 'members.role_desc_helper',
    defaultDesc: 'Khusus menangani daftar kebutuhan belanja dan perawatan rumah.',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    avatarBg: 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white',
    icon: Sparkles,
  },
};

// Default rich demo members for offline/instant mode
const getDefaultDemoMembers = (householdId, currentUserName, currentUserEmail) => {
  if (householdId === 'villa_pro') {
    return [
      {
        id: 'mem_v1',
        user_id: 'u_budi',
        name: currentUserName || 'Budi Santoso',
        email: currentUserEmail || 'budi.santoso@example.com',
        role: 'OWNER',
        joined_at: '2026-08-01T08:00:00Z',
      },
      {
        id: 'mem_v2',
        user_id: 'u_joko',
        name: 'Pak Joko',
        email: 'joko.villa@example.com',
        role: 'ADMIN',
        joined_at: '2026-08-15T10:30:00Z',
      },
    ];
  }

  return [
    {
      id: 'mem_1',
      user_id: 'u_budi',
      name: currentUserName || 'Budi Santoso',
      email: currentUserEmail || 'budi.santoso@example.com',
      role: 'OWNER',
      joined_at: '2026-06-01T08:00:00Z',
    },
    {
      id: 'mem_2',
      user_id: 'u_siti',
      name: 'Siti Aminah',
      email: 'siti.aminah@example.com',
      role: 'ADMIN',
      joined_at: '2026-06-02T09:15:00Z',
    },
    {
      id: 'mem_3',
      user_id: 'u_nathan',
      name: 'Nathan Santoso',
      email: 'nathan@example.com',
      role: 'MEMBER',
      joined_at: '2026-07-10T14:20:00Z',
    },
    {
      id: 'mem_4',
      user_id: 'u_sri',
      name: 'Mbak Sri',
      email: 'sri.art@example.com',
      role: 'HELPER',
      joined_at: '2026-07-15T11:00:00Z',
    },
  ];
};

export default function ManageMembersModal({
  isOpen,
  onClose,
  household,
  currentUser,
  onMembersUpdated,
}) {
  const { t } = useTranslation();

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add'

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [editingMemberId, setEditingMemberId] = useState(null);

  const householdId = household?.id || 'tebet_free';
  const tier = household?.tier || household?.subscription_tier || 'FREE';
  const isPro = tier === 'PRO';
  const { getFreeLimit } = useFeatureLimits(api);
  const freeLimit = getFreeLimit('MAX_MEMBERS');
  const maxQuota = isPro ? Infinity : freeLimit;

  const currentRole = household?.role || 'OWNER';
  const canManage = currentRole === 'OWNER' || currentRole === 'ADMIN';

  // Load members
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setFeedback(null);

    const loadData = async () => {
      const storageKey = `homehub_members_${householdId}`;
      const cached = safeGetJSON(storageKey);

      try {
        // Fetch from API
        const res = await api.get(`/auth/households/${householdId}/members`);
        const data = res.data?.data || res.data;
        if (Array.isArray(data) && data.length > 0) {
          if (isMounted) {
            setMembers(data);
            safeSetJSON(storageKey, data);
            if (onMembersUpdated) onMembersUpdated(data);
          }
          return;
        }
      } catch (err) {
        // Fallback to cache or rich demo defaults
        console.warn('API fetch members fallback to storage:', err.message);
      }

      if (isMounted) {
        if (cached && Array.isArray(cached) && cached.length > 0) {
          setMembers(cached);
          if (onMembersUpdated) onMembersUpdated(cached);
        } else {
          const initial = getDefaultDemoMembers(householdId, currentUser?.name, currentUser?.email);
          setMembers(initial);
          safeSetJSON(storageKey, initial);
          if (onMembersUpdated) onMembersUpdated(initial);
        }
      }
    };

    loadData().finally(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, householdId]);

  if (!isOpen) return null;

  // Handle Add Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    setFeedback(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      setFeedback({
        type: 'error',
        message: 'Nama dan email anggota wajib diisi.',
      });
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setFeedback({
        type: 'error',
        message: 'Format alamat email tidak valid.',
      });
      return;
    }

    // Check duplicate email
    const duplicate = members.find(
      (m) => (m.email || '').toLowerCase() === trimmedEmail
    );
    if (duplicate) {
      setFeedback({
        type: 'error',
        message: 'Pengguna dengan email ini sudah terdaftar sebagai anggota rumah tangga ini.',
      });
      return;
    }

    // Check quota for Free tier
    if (!isPro && members.length >= maxQuota) {
      setFeedback({
        type: 'error',
        message: t(
          'members.free_quota_note',
          `Paket Free terbatas maksimal ${maxQuota} anggota. Upgrade ke PRO untuk mengundang anggota tanpa batas.`
        ),
      });
      return;
    }

    setIsSubmitting(true);

    const newMemberObj = {
      id: `mem_${Date.now()}`,
      user_id: `u_${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      role: role,
      joined_at: new Date().toISOString(),
    };

    try {
      // Call backend API if available
      const res = await api.post(`/auth/households/${householdId}/members`, {
        name: trimmedName,
        email: trimmedEmail,
        role: role,
      });
      const data = res.data?.data || res.data;
      if (data && data.id) {
        newMemberObj.id = data.id;
        newMemberObj.user_id = data.user_id || data.userId || newMemberObj.user_id;
      }
    } catch (err) {
      console.warn('API add member offline fallback:', err.message);
      if (err.response?.data?.message) {
        setFeedback({
          type: 'error',
          message: err.response.data.message,
        });
        setIsSubmitting(false);
        return;
      }
    }

    const updated = [...members, newMemberObj];
    setMembers(updated);
    safeSetJSON(`homehub_members_${householdId}`, updated);
    if (onMembersUpdated) onMembersUpdated(updated);

    setName('');
    setEmail('');
    setRole('MEMBER');
    setIsSubmitting(false);
    setFeedback({
      type: 'success',
      message: t('members.success_add', 'Anggota keluarga baru berhasil ditambahkan!'),
    });
    setActiveTab('list');
  };

  // Handle Update Role
  const handleUpdateRole = async (memberId, newRole) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    if (target.role === 'OWNER') return;

    try {
      await api.put(`/auth/households/${householdId}/members/${memberId}`, {
        role: newRole,
      });
    } catch (err) {
      console.warn('API update role offline fallback:', err.message);
    }

    const updated = members.map((m) =>
      m.id === memberId ? { ...m, role: newRole } : m
    );
    setMembers(updated);
    safeSetJSON(`homehub_members_${householdId}`, updated);
    if (onMembersUpdated) onMembersUpdated(updated);
    setEditingMemberId(null);
    setFeedback({
      type: 'success',
      message: t('members.success_update', 'Peran anggota berhasil diperbarui!'),
    });
  };

  // Handle Remove Member
  const handleRemoveMember = async (memberId, memberName) => {
    const confirmMsg = t(
      'members.remove_confirm',
      'Apakah Anda yakin ingin mengeluarkan {{name}} dari pengelolaan rumah ini?',
      { name: memberName }
    );
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/auth/households/${householdId}/members/${memberId}`);
    } catch (err) {
      console.warn('API remove member offline fallback:', err.message);
    }

    const updated = members.filter((m) => m.id !== memberId);
    setMembers(updated);
    safeSetJSON(`homehub_members_${householdId}`, updated);
    if (onMembersUpdated) onMembersUpdated(updated);
    setFeedback({
      type: 'success',
      message: t('members.success_remove', 'Anggota berhasil dikeluarkan dari rumah tangga.'),
    });
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return 'U';
    const parts = nameStr.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-members-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="manage-members-title" className="text-lg font-bold">
                  {t('members.title', 'Kelola Anggota Rumah')}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isPro
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                      : 'bg-slate-700/60 text-slate-300 border-slate-600'
                  }`}
                >
                  {isPro ? 'PRO UNLIMITED' : `FREE (MAKS ${maxQuota})`}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {household?.name || 'Rumah Utama Keluarga'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Quota Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('list');
                setFeedback(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t('members.active_members', 'Anggota Aktif')} ({members.length})</span>
            </button>

            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('add');
                  setFeedback(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'add'
                    ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t('members.invite_btn', 'Undang Anggota')}</span>
              </button>
            )}
          </div>

          {/* Quota indicator */}
          <div className="text-[11px] text-slate-600 font-medium hidden sm:block">
            {isPro ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                {t('members.pro_unlimited_note', 'Paket PRO: Anggota Tanpa Batas')}
              </span>
            ) : (
              <span>
                Kapasitas:{' '}
                <strong className={members.length >= maxQuota ? 'text-rose-600' : 'text-indigo-600'}>
                  {members.length}
                </strong>{' '}
                / {maxQuota} Anggota
              </span>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center gap-2 border-b shrink-0 ${
              feedback.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Daftar orang yang memiliki hak akses untuk mengelola rumah tangga ini.</span>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-slate-600 text-sm">
                  {t('common.loading', 'Memuat daftar anggota...')}
                </div>
              ) : members.length === 0 ? (
                <div className="py-12 text-center text-slate-600 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Users className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p>{t('members.no_members', 'Belum ada anggota terdaftar.')}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {members.map((member) => {
                    const roleCfg = ROLE_CONFIGS[member.role] || ROLE_CONFIGS.MEMBER;
                    const RoleIcon = roleCfg.icon;
                    const isSelf =
                      currentUser &&
                      ((member.email && member.email.toLowerCase() === currentUser.email?.toLowerCase()) ||
                        (member.user_id && member.user_id === currentUser.id));

                    return (
                      <div
                        key={member.id}
                        className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition flex items-center justify-between gap-3 shadow-2xs"
                      >
                        {/* Member Avatar & Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${roleCfg.avatarBg}`}
                          >
                            {getInitials(member.name)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 truncate">
                                {member.name}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
                              <span className="truncate">{member.email}</span>
                              {member.joined_at && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[11px] text-slate-600 shrink-0">
                                    Bergabung{' '}
                                    {new Date(member.joined_at).toLocaleDateString('id-ID', {
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Role Badge & Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {editingMemberId === member.id && canManage && member.role !== 'OWNER' ? (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={member.role}
                                onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                className="text-xs font-semibold px-2 py-1 bg-white border border-indigo-300 rounded-lg text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                              >
                                <option value="ADMIN">{t('members.role_admin', 'Admin')}</option>
                                <option value="MEMBER">{t('members.role_member', 'Anggota')}</option>
                                <option value="HELPER">{t('members.role_helper', 'Asisten')}</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => setEditingMemberId(null)}
                                className="p-1 text-slate-600 hover:text-slate-900"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (canManage && member.role !== 'OWNER') {
                                  setEditingMemberId(member.id);
                                }
                              }}
                              disabled={!canManage || member.role === 'OWNER'}
                              className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition ${
                                roleCfg.badgeClass
                              } ${
                                canManage && member.role !== 'OWNER'
                                  ? 'cursor-pointer hover:opacity-90'
                                  : 'cursor-default'
                              }`}
                              title={t(roleCfg.descKey, roleCfg.defaultDesc)}
                            >
                              <RoleIcon className="w-3 h-3" />
                              <span>{t(roleCfg.labelKey, roleCfg.defaultLabel)}</span>
                              {canManage && member.role !== 'OWNER' && (
                                <ChevronDown className="w-3 h-3 text-current opacity-70" />
                              )}
                            </button>
                          )}

                          {/* Delete Member Button */}
                          {canManage && member.role !== 'OWNER' && !isSelf && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.id, member.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title={t('members.remove_member', 'Keluarkan Anggota')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Role Matrix Explanation */}
              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Panduan Hak Akses Anggota</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <strong className="text-amber-800 font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Kepala Keluarga (Owner)
                    </strong>
                    <p className="mt-0.5 text-slate-600">
                      Pemilik rumah tangga, mengelola paket langganan, dan berhak mengangkat/menghapus admin.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <strong className="text-indigo-800 font-bold flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Pengelola (Admin)
                    </strong>
                    <p className="mt-0.5 text-slate-600">
                      Dapat menambah dan mengedit tagihan, belanja dapur, aset servis, transaksi, serta mengundang anggota.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <strong className="text-slate-800 font-bold flex items-center gap-1">
                      <User className="w-3 h-3" /> Anggota (Member)
                    </strong>
                    <p className="mt-0.5 text-slate-600">
                      Dapat memantau ringkasan rumah, menandai checklist belanjaan yang sudah dibeli, dan mencatat agenda.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <strong className="text-emerald-800 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Asisten / Staf (Helper)
                    </strong>
                    <p className="mt-0.5 text-slate-600">
                      Akses terfokus ke checklist belanjaan pasar/supermarket dan daftar perawatan berkala.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'add' && (
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('members.name_label', 'Nama Lengkap')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('members.name_placeholder', 'misal: Siti Aminah, Nathan')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('members.email_label', 'Alamat Email')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('members.email_placeholder', 'misal: siti@keluarga.com')}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Anggota akan dapat masuk menggunakan email ini dan langsung terhubung dengan rumah tangga Anda.
                </p>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {t('members.role_label', 'Peran & Hak Akses')}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* ADMIN */}
                  <label
                    className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                      role === 'ADMIN'
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                        <Shield className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Admin</span>
                      </div>
                      <input
                        type="radio"
                        name="memberRole"
                        value="ADMIN"
                        checked={role === 'ADMIN'}
                        onChange={() => setRole('ADMIN')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Kelola penuh tagihan, belanja, aset, uang, dan anggota.
                    </p>
                  </label>

                  {/* MEMBER */}
                  <label
                    className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                      role === 'MEMBER'
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <User className="w-3.5 h-3.5 text-slate-600" />
                        <span>Anggota</span>
                      </div>
                      <input
                        type="radio"
                        name="memberRole"
                        value="MEMBER"
                        checked={role === 'MEMBER'}
                        onChange={() => setRole('MEMBER')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Melihat ringkasan, checklist belanja, dan agenda.
                    </p>
                  </label>

                  {/* HELPER */}
                  <label
                    className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                      role === 'HELPER'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Asisten</span>
                      </div>
                      <input
                        type="radio"
                        name="memberRole"
                        value="HELPER"
                        checked={role === 'HELPER'}
                        onChange={() => setRole('HELPER')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Akses daftar belanjaan dapur & checklist tugas rumah.
                    </p>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  {t('common.cancel', 'Batal')}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? t('common.loading', 'Menyimpan...')
                      : t('members.submit_invite', 'Kirim Undangan / Tambah')}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Data rumah tangga terenkripsi dan terlindungi multi-akses.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {t('common.close', 'Tutup')}
          </button>
        </div>
      </div>
    </div>
  );
}
