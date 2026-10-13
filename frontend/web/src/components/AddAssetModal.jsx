import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  Calendar,
  DollarSign,
  Tag,
  Shield,
  Phone,
  MapPin,
  Car,
  Tv,
  HelpCircle,
  Paperclip,
  Trash2,
  Edit3
} from 'lucide-react';
import { toInputDateFormat } from '../utils/warrantyHelper';
import { formatThousands, parseThousands } from '../utils/numberFormatHelper';
import { useAssetCategories, getCategoryDisplayName } from '../utils/masterCategoriesHelper';

export default function AddAssetModal({ isOpen, onClose, onSaveAsset, assetToEdit = null }) {
  const { t, i18n } = useTranslation();
  const { activeCategories: assetTypes } = useAssetCategories();

  const defaultType = assetTypes[0]?.code || 'ELECTRONIC';
  const defaultCategory = assetTypes[0]?.subcategories?.[0] || 'AC';

  const [formData, setFormData] = useState({
    asset_type: defaultType,
    category: defaultCategory,
    name: '',
    brand: '',
    model_type: '',
    serial_or_plate_number: '',
    location_room: '',
    purchase_date: '',
    purchase_price: '',
    warranty_expiry_date: '',
    service_center_contact: '',
    invoice_file_name: '',
    invoice_file_url: null,
    current_odometer: ''
  });

  const [invoicePreview, setInvoicePreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Populate data if editing an existing asset
  useEffect(() => {
    if (assetToEdit) {
      setFormData({
        asset_type: assetToEdit.asset_type || (assetToEdit.type === 'VEHICLE' ? 'VEHICLE' : 'ELECTRONIC'),
        category: assetToEdit.category || '',
        name: assetToEdit.name || '',
        brand: assetToEdit.brand && assetToEdit.brand !== '-' ? assetToEdit.brand : '',
        model_type: assetToEdit.model_type && assetToEdit.model_type !== '-' ? assetToEdit.model_type : '',
        serial_or_plate_number: assetToEdit.plate || assetToEdit.serial_or_plate_number || '',
        location_room: assetToEdit.room || assetToEdit.location_room || '',
        purchase_date: toInputDateFormat(assetToEdit.purchase_date),
        purchase_price: (assetToEdit.purchase_price !== undefined && assetToEdit.purchase_price !== null && assetToEdit.purchase_price !== 0) ? assetToEdit.purchase_price.toString() : '',
        warranty_expiry_date: toInputDateFormat(assetToEdit.warranty || assetToEdit.warranty_expiry_date),
        service_center_contact: assetToEdit.service_center_contact || '',
        invoice_file_name: assetToEdit.invoice_name || '',
        invoice_file_url: assetToEdit.invoice_url || null,
        current_odometer: (assetToEdit.odo !== undefined && assetToEdit.odo !== null) 
          ? assetToEdit.odo.toString() 
          : (assetToEdit.current_odometer ? assetToEdit.current_odometer.toString() : '')
      });

      if (assetToEdit.invoice_name || assetToEdit.invoice_url) {
        setInvoicePreview({
          name: assetToEdit.invoice_name || 'Invoice_Dokumen.pdf',
          size: 'Tersimpan di Cloud'
        });
      } else {
        setInvoicePreview(null);
      }
    } else {
      setFormData({
        asset_type: 'ELECTRONIC',
        category: 'AC',
        name: '',
        brand: '',
        model_type: '',
        serial_or_plate_number: '',
        location_room: '',
        purchase_date: '',
        purchase_price: '',
        warranty_expiry_date: '',
        service_center_contact: '',
        invoice_file_name: '',
        invoice_file_url: null,
        current_odometer: ''
      });
      setInvoicePreview(null);
    }
    setErrorMsg('');
  }, [assetToEdit, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errorMsg) setErrorMsg('');
  };

  // Handle Invoice File Upload (PDF or Image)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(i18n.language === 'id' ? 'Ukuran file melebihi 5MB. Silakan pilih file yang lebih kecil.' : 'File size exceeds 5MB. Please choose a smaller file.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setInvoicePreview({
      name: file.name,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      url: previewUrl
    });

    setFormData((prev) => ({
      ...prev,
      invoice_file_name: file.name,
      invoice_file_url: previewUrl
    }));
    setErrorMsg('');
  };

  const removeInvoice = () => {
    setInvoicePreview(null);
    setFormData((prev) => ({
      ...prev,
      invoice_file_name: '',
      invoice_file_url: null
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Mandatory Field Validations
    const trimmedName = formData.name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg(i18n.language === 'id' ? 'Nama aset wajib diisi (minimal 2 karakter).' : 'Asset name is required (at least 2 characters).');
      return;
    }

    const trimmedCategory = formData.category.trim();
    if (!trimmedCategory) {
      setErrorMsg(i18n.language === 'id' ? 'Kategori aset wajib diisi.' : 'Asset category is required.');
      return;
    }

    // Vehicle Odometer Validation
    let parsedOdo = null;
    if (formData.asset_type === 'VEHICLE') {
      if (formData.current_odometer !== '' && formData.current_odometer !== null) {
        parsedOdo = parseThousands(formData.current_odometer);
        if (parsedOdo === null || parsedOdo < 0) {
          setErrorMsg(i18n.language === 'id' ? 'Odometer tidak boleh bernilai negatif.' : 'Odometer cannot be negative.');
          return;
        }
      }
    }

    // Purchase Price Validation (Optional, but if filled must be valid)
    let parsedPrice = null;
    if (formData.purchase_price !== '' && formData.purchase_price !== null) {
      parsedPrice = parseThousands(formData.purchase_price);
      if (parsedPrice === null || parsedPrice < 0) {
        setErrorMsg(i18n.language === 'id' ? 'Harga pembelian tidak valid.' : 'Invalid purchase price.');
        return;
      }
    }

    const defaultRoom = formData.asset_type === 'VEHICLE' ? 'Garasi' : 'Kamar Utama';
    const finalRoom = formData.location_room.trim() || defaultRoom;

    const normPurchaseDate = toInputDateFormat(formData.purchase_date) || null;
    const normWarranty = toInputDateFormat(formData.warranty_expiry_date) || null;

    const savedAsset = {
      id: assetToEdit ? assetToEdit.id : 'ast_' + Date.now(),
      name: trimmedName,
      type: formData.asset_type,
      asset_type: formData.asset_type,
      category: trimmedCategory,
      brand: formData.brand.trim() || null,
      model_type: formData.model_type.trim() || null,
      plate: formData.asset_type === 'VEHICLE' ? (formData.serial_or_plate_number.trim() || null) : null,
      serial_or_plate_number: formData.serial_or_plate_number.trim() || null,
      room: finalRoom,
      location_room: finalRoom,
      purchase_date: normPurchaseDate,
      purchase_price: parsedPrice, // null if empty, no fake 0 or 5.400.000
      warranty: normWarranty,
      warranty_expiry_date: normWarranty,
      service_center_contact: formData.service_center_contact.trim() || null,
      invoice_name: formData.invoice_file_name || null,
      invoice_url: formData.invoice_file_url || null,
      status: assetToEdit?.status || 'ACTIVE',
      odo: formData.asset_type === 'VEHICLE' ? (parsedOdo !== null ? parsedOdo : (assetToEdit?.odo ?? null)) : null,
      current_odometer: formData.asset_type === 'VEHICLE' ? (parsedOdo !== null ? parsedOdo : (assetToEdit?.current_odometer ?? null)) : null,
      nextService: assetToEdit?.nextService || null,
      nextOdo: assetToEdit?.nextOdo || null
    };

    onSaveAsset(savedAsset, Boolean(assetToEdit));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-emerald-500/20">
              {assetToEdit ? '✏️' : (assetTypes.find(at => at.code === formData.asset_type)?.icon || (formData.asset_type === 'VEHICLE' ? '🚗' : '❄️'))}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {assetToEdit 
                  ? (i18n.language === 'id' ? 'Edit Data Aset & Kendaraan' : 'Edit Asset & Vehicle') 
                  : (i18n.language === 'id' ? 'Tambah Aset & Kendaraan Baru' : 'Add New Asset & Vehicle')}
              </h2>
              <p className="text-xs text-slate-500">
                {assetToEdit
                  ? (i18n.language === 'id' ? 'Perbarui rincian spesifikasi, masa garansi, atau faktur pembelian' : 'Update specifications, warranty period, or purchase invoice')
                  : (i18n.language === 'id' ? 'Lengkapi data teknis, masa garansi, dan faktur invoice pembelian' : 'Complete technical data, warranty period, and purchase invoice')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Row 1: Tipe Aset & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {i18n.language === 'id' ? 'Tipe Aset' : 'Asset Type'} <span className="text-red-500">*</span>
              </label>
              <select
                name="asset_type"
                value={formData.asset_type}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
              >
                {assetTypes.map(at => (
                  <option key={at.code} value={at.code}>
                    {at.icon} {getCategoryDisplayName(at, i18n.language)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('common.category')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder={formData.asset_type === 'VEHICLE' ? (i18n.language === 'id' ? 'misal: Mobil, Sepeda Motor' : 'e.g. Car, Motorcycle') : (i18n.language === 'id' ? 'misal: AC, Kulkas, Smart TV, Mesin Cuci' : 'e.g. AC, Refrigerator, Smart TV, Washing Machine')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                required
              />

              {/* Quick subcategory suggestions from dynamic master data */}
              {(() => {
                const currentType = assetTypes.find(at => at.code === formData.asset_type);
                const subSuggestions = currentType?.subcategories || currentType?.metadata?.subcategories || [];
                if (!subSuggestions || subSuggestions.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {subSuggestions.slice(0, 5).map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: sug }))}
                        className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2 py-0.5 rounded-md transition cursor-pointer"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Row 2: Nama Aset & Merek */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {i18n.language === 'id' ? 'Nama Aset / Seri Kendaraan' : 'Asset / Vehicle Name'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={formData.asset_type === 'VEHICLE' ? (i18n.language === 'id' ? 'misal: Honda CR-V 1.5 Turbo Prestige' : 'e.g. Honda CR-V 1.5 Turbo Prestige') : (i18n.language === 'id' ? 'misal: AC Daikin Inverter Flash 1 PK' : 'e.g. Daikin Inverter AC 1 HP')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {i18n.language === 'id' ? 'Merek / Brand' : 'Brand'}
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="misal: Daikin, Samsung, Honda, LG, Sharp"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {/* Row 3: Plat/Serial & Odometer (untuk kendaraan) / Model (untuk non-kendaraan) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {formData.asset_type === 'VEHICLE' ? (i18n.language === 'id' ? 'Plat Nomor Kendaraan' : 'Vehicle License Plate') : (i18n.language === 'id' ? 'Nomor Seri (Serial Number / S/N)' : 'Serial Number (S/N)')}
              </label>
              <input
                type="text"
                name="serial_or_plate_number"
                value={formData.serial_or_plate_number}
                onChange={handleInputChange}
                placeholder={formData.asset_type === 'VEHICLE' ? (i18n.language === 'id' ? 'misal: B 1234 SK' : 'e.g. B 1234 SK') : (i18n.language === 'id' ? 'misal: DKN-93821-INV' : 'e.g. DKN-93821-INV')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            {formData.asset_type === 'VEHICLE' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>{t('services.current_odometer_input')}</span>
                  <span className="text-[10px] text-indigo-600 font-medium">{i18n.language === 'id' ? 'Patokan Servis' : 'Service Baseline'}</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="current_odometer"
                  value={formatThousands(formData.current_odometer)}
                  onChange={(e) => {
                    const clean = parseThousands(e.target.value);
                    setFormData(prev => ({ ...prev, current_odometer: clean !== null ? clean.toString() : '' }));
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder={t('services.current_odometer_placeholder')}
                  className="w-full bg-slate-50 border border-indigo-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">{t('services.current_odometer_hint')}</p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {i18n.language === 'id' ? 'Tipe Model / Kode Seri' : 'Model Type / Series Code'}
                </label>
                <input
                  type="text"
                  name="model_type"
                  value={formData.model_type}
                  onChange={handleInputChange}
                  placeholder="misal: FTKQ25SVM4 / Gen 5"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            )}
          </div>

          {/* Row 4: Tipe Model (untuk kendaraan) & Lokasi Penempatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formData.asset_type === 'VEHICLE' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {i18n.language === 'id' ? 'Tipe Varian / Seri Kendaraan' : 'Model Variant / Trim'}
                </label>
                <input
                  type="text"
                  name="model_type"
                  value={formData.model_type}
                  onChange={handleInputChange}
                  placeholder="misal: 1.5 Turbo Prestige / ABS 155cc"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {formData.asset_type === 'VEHICLE' 
                  ? (i18n.language === 'id' ? 'Lokasi Parkir / Garasi' : 'Parking / Garage Location') 
                  : (i18n.language === 'id' ? 'Lokasi Ruangan Penempatan' : 'Room / Location')}
              </label>
              <input
                type="text"
                name="location_room"
                value={formData.location_room}
                onChange={handleInputChange}
                placeholder={formData.asset_type === 'VEHICLE' 
                  ? (i18n.language === 'id' ? 'misal: Garasi Depan, Carport Utama' : 'e.g. Front Garage, Carport') 
                  : (i18n.language === 'id' ? 'misal: Kamar Utama, Dapur Bersih' : 'e.g. Master Bedroom, Clean Kitchen')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            {formData.asset_type !== 'VEHICLE' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {i18n.language === 'id' ? 'Kontak Service Center / Teknisi' : 'Service Center / Technician Contact'}
                </label>
                <input
                  type="text"
                  name="service_center_contact"
                  value={formData.service_center_contact}
                  onChange={handleInputChange}
                  placeholder={i18n.language === 'id' ? 'misal: 0812-3456-7890 (Bengkel Resmi)' : 'e.g. +62 812-3456-7890 (Official Workshop)'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            )}
          </div>

          {/* Row 4.5: Kontak Bengkel Resmi jika Kendaraan */}
          {formData.asset_type === 'VEHICLE' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {i18n.language === 'id' ? 'Kontak Bengkel Resmi / Langganan' : 'Authorized Workshop / Mechanic Contact'}
              </label>
              <input
                type="text"
                name="service_center_contact"
                value={formData.service_center_contact}
                onChange={handleInputChange}
                placeholder={i18n.language === 'id' ? 'misal: 021-7654321 (Bengkel Resmi Honda Pondok Indah)' : 'e.g. 021-7654321 (Authorized Honda Workshop)'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          )}

          {/* Row 5: Tanggal Pembelian, Harga Beli, & Tanggal Garansi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('modals.purchase_date')}
              </label>
              <input
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleInputChange}
                onBlur={(e) => {
                  if (e.target.value) {
                    const normalized = toInputDateFormat(e.target.value);
                    if (normalized && normalized !== formData.purchase_date) {
                      setFormData(prev => ({ ...prev, purchase_date: normalized }));
                    }
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('assets.purchase_price')} (Rp)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  name="purchase_price"
                  value={formatThousands(formData.purchase_price)}
                  onChange={(e) => {
                    const clean = parseThousands(e.target.value);
                    setFormData(prev => ({ ...prev, purchase_price: clean !== null ? clean.toString() : '' }));
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder={formData.asset_type === 'VEHICLE' ? 'misal: 450.000.000' : 'misal: 5.400.000'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {i18n.language === 'id' ? 'Habis Masa Garansi' : 'Warranty Expiry Date'}
              </label>
              <input
                type="date"
                name="warranty_expiry_date"
                value={formData.warranty_expiry_date}
                onChange={handleInputChange}
                onBlur={(e) => {
                  if (e.target.value) {
                    const normalized = toInputDateFormat(e.target.value);
                    if (normalized && normalized !== formData.warranty_expiry_date) {
                      setFormData(prev => ({ ...prev, warranty_expiry_date: normalized }));
                    }
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {/* Row 6: Upload Invoice / Nota Pembelian */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              {i18n.language === 'id' ? 'Upload Faktur / Invoice Pembelian' : 'Upload Purchase Invoice / Receipt'}
            </label>
            <p className="text-[11px] text-slate-400">
              {i18n.language === 'id' 
                ? 'Unggah struk atau kuitansi pembelian resmi untuk klaim garansi di kemudian hari (PDF, JPG, atau PNG maks 5MB)'
                : 'Upload official purchase receipt or invoice for future warranty claims (PDF, JPG, or PNG max 5MB)'}
            </p>

            {!invoicePreview ? (
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-emerald-50/30 transition">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-700">
                    {i18n.language === 'id' ? 'Klik untuk memilih file invoice' : 'Click to select invoice file'}
                  </p>
                  <p className="text-[10px] text-slate-400">PDF, PNG, JPG {i18n.language === 'id' ? 'hingga 5MB' : 'up to 5MB'}</p>
                </div>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-sm">
                      {invoicePreview.name}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold">{invoicePreview.size}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeInvoice}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                  title="Hapus Invoice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition transform active:scale-98 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{assetToEdit ? (i18n.language === 'id' ? 'Simpan Perubahan' : 'Save Changes') : (i18n.language === 'id' ? 'Simpan Aset ke Database' : 'Save Asset to Database')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
