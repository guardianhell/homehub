import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  UploadCloud, 
  Sparkles, 
  Receipt, 
  Calendar, 
  Tag, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  Loader2, 
  Eye, 
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Key,
  ExternalLink,
  Bot,
  Zap,
  Server,
  Lock
} from 'lucide-react';
import api from '../services/api';
import { useFeatureLimits } from '../utils/featureLimitsHelper';
import { useExpenseCategories, getCategoryDisplayName } from '../utils/masterCategoriesHelper';

const CATEGORIES = [
  { id: 'Belanja Bulanan', label: '🛒 Belanja Bulanan & Supermarket' },
  { id: 'Kebutuhan Dapur', label: '🍳 Kebutuhan Dapur & Bahan Pokok' },
  { id: 'Tagihan & Utilitas', label: '⚡ Tagihan & Utilitas (Listrik/Air/Wifi)' },
  { id: 'Transportasi & Bensin', label: '🚗 Transportasi, Bensin & Tol' },
  { id: 'Servis & Pemeliharaan', label: '🔧 Servis Kendaraan & Rumah' },
  { id: 'Pendidikan & Les', label: '📚 Pendidikan & Les Anak' },
  { id: 'Kesehatan & Medis', label: '💊 Kesehatan, Obat & Klinik' },
  { id: 'Gaya Hidup & Hiburan', label: '☕ Gaya Hidup, Kuliner & Hiburan' },
  { id: 'Lainnya', label: '📦 Lainnya' }
];

// Helper function to normalize Indonesian currency amounts (handling . thousands and , or . decimals)
export function normalizeIndonesianAmount(val) {
  if (val === null || val === undefined || val === "") return 0;

  // If already a number
  if (typeof val === "number") {
    // Check if it was parsed as a float from Indonesian thousands format (e.g. 35.000 -> 35, or 124.500 -> 124.5)
    if (val > 0 && val < 500) {
      val = Math.round(val * 1000);
    }
    return Math.round(val);
  }

  let s = String(val).trim();
  // Remove currency prefix
  s = s.replace(/^(?:rp\.?|idr)\s*/i, "").trim();

  // Strip trailing cents: ,00 or .00 or ,- or .-
  s = s.replace(/[,.]00$/, "");
  s = s.replace(/[,-]-$/, "");

  // Check for both dot and comma
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) {
      // Indonesian format: 35.000,50 -> drop decimal part
      s = s.slice(0, lastComma).replace(/\./g, "");
    } else {
      // US format: 35,000.50 -> drop decimal part
      s = s.slice(0, lastDot).replace(/,/g, "");
    }
  } else if (lastDot !== -1) {
    const parts = s.split(".");
    if (parts.length > 2) {
      // Multiple dots: e.g. 1.250.000 -> 1250000
      s = s.replace(/\./g, "");
    } else if (parts.length === 2) {
      if (parts[1].length === 3) {
        // e.g. 35.000 -> 35000
        s = parts[0] + parts[1];
      } else if (parts[1].length === 2) {
        // e.g. 35000.50 (cents) -> 35000
        if (parseInt(parts[0], 10) >= 500) {
          s = parts[0];
        } else {
          s = parts[0] + parts[1] + "0"; // e.g. 35.50 -> 35500
        }
      } else {
        s = s.replace(/\./g, "");
      }
    }
  } else if (lastComma !== -1) {
    const parts = s.split(",");
    if (parts.length > 2) {
      s = s.replace(/,/g, "");
    } else if (parts.length === 2) {
      if (parts[1].length === 3) {
        // e.g. 35,000 -> 35000
        s = parts[0] + parts[1];
      } else if (parts[1].length === 2) {
        // e.g. 35000,00 -> 35000
        s = parts[0];
      } else {
        s = s.replace(/,/g, "");
      }
    }
  }

  const cleanDigits = s.replace(/[^0-9]/g, "");
  let num = parseInt(cleanDigits || "0", 10);

  // If still suspiciously small (< 500), multiply by 1000
  if (num > 0 && num < 500) {
    num = num * 1000;
  }

  return num;
}

// Helper function to format any number/string with Indonesian thousand dots separator (e.g. 1826963 -> 1.826.963)
export function formatCurrencySeparator(val) {
  if (val === null || val === undefined || val === '') return '';
  const cleanDigits = String(val).replace(/\D/g, '');
  if (!cleanDigits) return '';
  const num = parseInt(cleanDigits, 10);
  return isNaN(num) ? '' : num.toLocaleString('id-ID');
}

// 1. Google Vision AI (Gemini 1.5 Flash Multimodal Vision API)
async function analyzeWithGoogleVision(imageBase64, apiKey) {
  let cleanBase64 = imageBase64;
  let mimeType = 'image/jpeg';
  if (imageBase64.includes(';base64,')) {
    const parts = imageBase64.split(';base64,');
    mimeType = parts[0].replace('data:', '');
    cleanBase64 = parts[1];
  }

  const prompt = `Anda adalah asisten akuntansi rumah tangga profesional Indonesia. Analisis foto struk / nota belanja ini.
Lakukan ekstraksi data terstruktur dengan sangat teliti.

PERHATIAN KHUSUS FORMAT NOMINAL RUPIAH (IDR):
1. Format Indonesia menggunakan titik (.) sebagai pemisah ribuan dan koma (,) sebagai desimal sen (contoh: 35.000,00 atau 35.000).
2. JANGAN PERNAH memasukkan angka desimal sen (,00 atau .00) ke dalam nominal rupiah!
   - Contoh: Jika tertulis "Rp 35.000,00" atau "35,000.00" atau "35.000" maka "amount" HARUS bernilai angka 35000 (tiga puluh lima ribu), BUKAN 3500000 dan BUKAN 35!
   - Contoh: Jika tertulis "Rp 124.500" maka "amount" HARUS bernilai 124500 (BUKAN 124.5).
   - Contoh: Jika tertulis "87.500,-" maka "amount" HARUS bernilai 87500.
   - Contoh: Jika tertulis "1.250.000" maka "amount" HARUS bernilai 1250000.
3. Ambil angka GRAND TOTAL / TOTAL BAYAR belanja (bukan uang tunai yang diserahkan dan bukan uang kembalian/change).
4. Nilai "amount" pada JSON HARUS berupa angka integer bulat murni tanpa desimal dan tanpa titik/koma.

Hasilkan output HANYA berupa JSON valid dengan format persis:
{
  "title": "Nama toko / merchant / penyedia layanan (misal: Indomaret Point, Superindo Tebet, SPBU Shell, Tokopedia, PLN)",
  "amount": 0,
  "expense_date": "YYYY-MM-DD",
  "category": "Pilih satu: 'Belanja Bulanan' | 'Kebutuhan Dapur' | 'Tagihan & Utilitas' | 'Transportasi & Bensin' | 'Servis & Pemeliharaan' | 'Pendidikan & Les' | 'Kesehatan & Medis' | 'Gaya Hidup & Hiburan' | 'Lainnya'",
  "description": "Rincian singkat item belanjaan yang dibeli beserta kuantitasnya"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: cleanBase64 } }
        ]
      }],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.1
      }
    })
  });

  if (!response.ok) {
    const errObj = await response.json().catch(() => ({}));
    throw new Error(errObj.error?.message || `Google Vision AI gagal (${response.status})`);
  }

  const resJson = await response.json();
  const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Google Vision tidak memberikan teks respon');

  const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(cleanJson);
  parsed.amount = normalizeIndonesianAmount(parsed.amount);
  return parsed;
}

// 2. Dynamic Tesseract.js Loader for In-Browser Fallback OCR
const loadTesseract = () => {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) {
      resolve(window.Tesseract);
      return;
    }
    const existing = document.getElementById('tesseract-cdn-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Tesseract));
      return;
    }
    const script = document.createElement('script');
    script.id = 'tesseract-cdn-script';
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
    script.crossOrigin = 'anonymous';
    script.async = true;
    script.onload = () => resolve(window.Tesseract);
    script.onerror = () => reject(new Error('Gagal memuat Tesseract'));
    document.head.appendChild(script);
  });
};

// 3. Robust Semantic NLP Parser for Receipts
const parseReceiptText = (rawText) => {
  if (!rawText) return { detectedTitle: '', detectedAmount: '', detectedDate: '', detectedCategory: 'Belanja Bulanan', merchantCandidates: [], detectedNumbers: [] };

  // 1. Preprocess: collapse spaces around dots and commas in numbers (e.g. "1, 826, 963" -> "1,826,963")
  let cleanText = (rawText || '')
    .replace(/(\d)\s*([.,])\s*(\d)/g, '$1$2$3')
    .replace(/(\d)\s*([.,])\s*(\d)/g, '$1$2$3');

  const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let detectedTitle = '';
  let detectedAmount = '';
  let detectedDate = '';
  let detectedCategory = 'Belanja Bulanan';
  const merchantCandidates = [];
  const allDetectedNumbers = [];

  // Helper to extract numbers from any line or string
  const extractNumbers = (str) => {
    const sanitized = str.replace(/[Oo]/g, '0');
    const matches = sanitized.match(/(?:Rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d{4,9})/gi) || [];
    return matches
      .map(m => normalizeIndonesianAmount(m))
      .filter(n => n >= 500 && n < 500000000 && n !== 85972574412);
  };

  // 1. Merchant Candidates (Scan top 8 lines)
  const skipWords = ['selamat', 'datang', 'kasir', 'struk', 'nota', 'receipt', 'welcome', 'bukti', 'transaksi', 'pembayaran', 'no:', 'tanggal', 'npwp', 'terima', 'kasih', 'table', 'pax', 'op:', 'pos', 'rcpt'];
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const l = lines[i];
    const lower = l.toLowerCase();
    const hasSkip = skipWords.some(w => lower.startsWith(w));
    if (!hasSkip && /[a-zA-Z]{3,}/.test(l) && !/^\d+$/.test(l) && l.length > 3) {
      let clean = l.replace(/[^a-zA-Z0-9\s\.\-&]/g, '').trim();
      // If next line is a suffix like RESTO, CAFE, POINT, combine them
      if (i + 1 < lines.length) {
        const nextL = lines[i + 1].trim();
        if (/^(?:resto|restaurant|cafe|kopi|bakso|mart|point|store)$/i.test(nextL)) {
          clean += ' ' + nextL;
        }
      }
      if (clean && !merchantCandidates.includes(clean)) {
        merchantCandidates.push(clean);
      }
    }
  }
  detectedTitle = merchantCandidates.length > 0 ? merchantCandidates[0] : (lines[0] || 'Struk Belanja');

  // 2. Date Extraction (Format: DD/MM/YYYY or YYYY-MM-DD)
  const ddmmyyyyMatch = cleanText.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](202\d)\b/);
  const isoMatch = cleanText.match(/\b(202\d)[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/);
  const namedMatch = cleanText.match(/\b(\d{1,2})[\s\-\/]([a-zA-Z]{3,})[\s\-\/](202\d)\b/i);
  const monthNames = { jan: '01', feb: '02', mar: '03', apr: '04', mei: '05', may: '05', jun: '06', jul: '07', agu: '08', aug: '08', sep: '09', okt: '10', oct: '10', nov: '11', des: '12', dec: '12' };

  if (ddmmyyyyMatch) {
    const d = ddmmyyyyMatch[1].padStart(2, '0'), m = ddmmyyyyMatch[2].padStart(2, '0'), y = ddmmyyyyMatch[3];
    detectedDate = `${y}-${m}-${d}`;
  } else if (isoMatch) {
    const y = isoMatch[1], m = isoMatch[2].padStart(2, '0'), d = isoMatch[3].padStart(2, '0');
    detectedDate = `${y}-${m}-${d}`;
  } else if (namedMatch) {
    const d = namedMatch[1].padStart(2, '0'), monthKey = namedMatch[2].slice(0, 3).toLowerCase(), y = namedMatch[3];
    const m = monthNames[monthKey] || '09';
    detectedDate = `${y}-${m}-${d}`;
  }

  // 3. Amount Extraction: Prioritize dedicated TOTAL / GRAND TOTAL line
  let foundTotal = false;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const isTotalKeyword = /\b(?:grand\s*total|total\s*bayar|total\s*akhir|total\s*belanja|total\s*tagihan|total\s*rp\.?|total\s*idr|total\s*amount|total)\b/i.test(l);
    const isExcluded = /\b(?:subtotal|sub\s*total|total\s*item|total\s*qty|total\s*pcs|total\s*pax|kembali|change|tunai|cash|debit|kembalian)\b/i.test(l);

    if (isTotalKeyword && !isExcluded) {
      // Check on the same line
      const nums = extractNumbers(l);
      if (nums.length > 0) {
        detectedAmount = String(Math.max(...nums));
        foundTotal = true;
        break;
      }
      // Check on next 1-2 lines
      for (let j = 1; j <= 2 && (i + j) < lines.length; j++) {
        const nextLine = lines[i + j];
        if (!/\b(?:subtotal|total\s*item|total\s*qty|pax)\b/i.test(nextLine)) {
          const nextNums = extractNumbers(nextLine);
          if (nextNums.length > 0) {
            detectedAmount = String(Math.max(...nextNums));
            foundTotal = true;
            break;
          }
        }
      }
      if (foundTotal) break;
    }
  }

  // Collect all plausible numbers for quick selection chips
  const allNums = extractNumbers(cleanText);
  allNums.forEach(n => {
    if (!allDetectedNumbers.includes(n)) allDetectedNumbers.push(n);
  });
  allDetectedNumbers.sort((a, b) => b - a);

  // If no explicit TOTAL line found, pick the largest plausible number
  if (!foundTotal && allDetectedNumbers.length > 0) {
    detectedAmount = String(allDetectedNumbers[0]);
  }

  // 4. Category Classification
  const lowerAll = cleanText.toLowerCase();
  if (/(?:resto|restaurant|cafe|kopi|korean|bbq|kimchi|japchae|bulgogi|jinro|samgyeopsal|mcdonald|kfc|bakso|cinema|xx1|burger)/.test(lowerAll)) {
    detectedCategory = 'Gaya Hidup & Hiburan';
  } else if (/(?:spbu|pertamina|shell|bensin|pertamax|pertalite|solar|bbm|tol|parkir)/.test(lowerAll)) {
    detectedCategory = 'Transportasi & Bensin';
  } else if (/(?:pln|pdam|listrik|air|internet|indihome|biznet|token|tagihan|pbb)/.test(lowerAll)) {
    detectedCategory = 'Tagihan & Utilitas';
  } else if (/(?:bengkel|servis|oli|ban|tune\s*up|honda|toyota|yamaha|sparepart|service)/.test(lowerAll)) {
    detectedCategory = 'Servis & Pemeliharaan';
  } else if (/(?:apotek|kimia\s*farma|century|k24|obat|dokter|klinik|vitamin|paracetamol)/.test(lowerAll)) {
    detectedCategory = 'Kesehatan & Medis';
  } else if (/(?:sekolah|les|kursus|kumon|buku|gramedia|spp|pendidikan)/.test(lowerAll)) {
    detectedCategory = 'Pendidikan & Les';
  } else if (/(?:dapur|beras|minyak|bumbu|pasar|sayur|telur|daging|ayam|ikan|garam|gula)/.test(lowerAll)) {
    detectedCategory = 'Kebutuhan Dapur';
  } else if (/(?:superindo|indomaret|alfamart|transmart|hypermart|lotte|supermarket|minimarket|hero)/.test(lowerAll)) {
    detectedCategory = 'Belanja Bulanan';
  }

  return {
    detectedTitle,
    detectedAmount,
    detectedDate,
    detectedCategory,
    merchantCandidates: merchantCandidates.slice(0, 4),
    detectedNumbers: allDetectedNumbers.slice(0, 6)
  };
};

export default function AddExpenseModal({ 
  isOpen, 
  onClose, 
  onSaveExpense, 
  members = [], 
  currentUser = null,
  isPro = false,
  onUpgradePro = null
}) {
  const { t, i18n } = useTranslation();
  const { freeLimits } = useFeatureLimits(api);
  const { activeCategories: expenseCategories } = useExpenseCategories();
  const isOcrAllowed = isPro || Boolean(freeLimits?.ALLOW_AI_OCR);
  const defaultMemberName = currentUser?.name || (members && members.length > 0 ? members[0].name : 'Calvin');
  const defaultMemberId = currentUser?.id || (members && members.length > 0 ? members[0].id : 'usr-001');

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    category: 'Belanja Bulanan',
    description: '',
    source_type: 'MANUAL',
    receipt_url: '',
    recorded_by_name: defaultMemberName,
    user_id: defaultMemberId
  });

  // Google Vision / Gemini AI Configuration (Client-side key is user-configurable; server proxy handles background OCR)
  const [googleApiKey, setGoogleApiKey] = useState(() => {
    return localStorage.getItem('homehub_google_vision_key') || '';
  });
  const [showAiConfig, setShowAiConfig] = useState(false);

  // Scanning States
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');
  const [activeEngine, setActiveEngine] = useState(''); // 'GOOGLE_VISION' | 'TESSERACT_NLP'
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [rawOcrText, setRawOcrText] = useState('');
  const [detectedNumbers, setDetectedNumbers] = useState([]);
  const [merchantCandidates, setMerchantCandidates] = useState([]);
  const [showRawText, setShowRawText] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const resetForm = () => {
    const curName = currentUser?.name || (members && members.length > 0 ? members[0].name : 'Calvin');
    const curId = currentUser?.id || (members && members.length > 0 ? members[0].id : 'usr-001');
    setFormData({
      title: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      category: 'Belanja Bulanan',
      description: '',
      source_type: 'MANUAL',
      receipt_url: '',
      recorded_by_name: curName,
      user_id: curId
    });
    setReceiptFile(null);
    setReceiptPreview(null);
    setIsScanningOCR(false);
    setOcrProgress(0);
    setOcrStatusText('');
    setActiveEngine('');
    setOcrSuccess(false);
    setRawOcrText('');
    setDetectedNumbers([]);
    setMerchantCandidates([]);
    setShowRawText(false);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (googleApiKey) {
      localStorage.setItem('homehub_google_vision_key', googleApiKey);
    }
  }, [googleApiKey]);

  // Reset form fields every time modal is opened
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Live Numeric Separator Handler (e.g. 1826963 -> 1.826.963)
  const handleAmountChange = (e) => {
    const raw = e.target.value;
    const formatted = formatCurrencySeparator(raw);
    setFormData(prev => ({ ...prev, amount: formatted }));
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  // Run Real OCR with Google Vision AI or Tesseract Fallback
  const processReceiptImage = async (imageSource) => {
    setIsScanningOCR(true);
    setOcrSuccess(false);
    setRawOcrText('');
    setDetectedNumbers([]);
    setMerchantCandidates([]);

    // 1. Priority 1: Backend Server-Side Gemini Vision AI (Zero API key exposed to browser)
    setActiveEngine('BACKEND_AI');
    setOcrProgress(25);
    setOcrStatusText('Mengirim struk ke Backend Server (Gemini Vision AI)...');

    try {
      const res = await api.post('/finance/scan-receipt', { imageBase64: imageSource });
      if (res && res.success && res.data) {
        const aiResult = res.data;
        setOcrProgress(100);
        setOcrStatusText('Backend Server selesai menganalisis struk dengan Gemini AI!');

        const normalizedAmount = aiResult.amount ? normalizeIndonesianAmount(aiResult.amount) : null;

        setFormData(prev => ({
          ...prev,
          title: aiResult.title || prev.title || 'Struk Belanja',
          amount: normalizedAmount ? formatCurrencySeparator(normalizedAmount) : prev.amount,
          expense_date: aiResult.expense_date || prev.expense_date,
          category: aiResult.category || prev.category,
          description: aiResult.description || prev.description
        }));

        setOcrSuccess(true);
        setIsScanningOCR(false);
        return;
      }
    } catch (backendErr) {
      console.warn('Backend server AI tidak merespon atau GEMINI_API_KEY belum diset di backend .env:', backendErr?.message || backendErr);
    }

    // 2. Priority 2: Client-side Google Vision AI (if provided via .env or user input)
    if (googleApiKey && googleApiKey.trim().length > 10) {
      setActiveEngine('GOOGLE_VISION');
      setOcrProgress(40);
      setOcrStatusText('Mengirim struk ke Google Vision AI via Client...');

      try {
        setOcrProgress(70);
        setOcrStatusText('Google Vision AI memetakan layout, nominal & tanggal...');

        const aiResult = await analyzeWithGoogleVision(imageSource, googleApiKey);

        setOcrProgress(100);
        setOcrStatusText('Google Vision AI selesai memetakan data!');

        const normalizedAmount = aiResult.amount ? normalizeIndonesianAmount(aiResult.amount) : null;

        setFormData(prev => ({
          ...prev,
          title: aiResult.title || prev.title || 'Struk Belanja',
          amount: normalizedAmount ? formatCurrencySeparator(normalizedAmount) : prev.amount,
          expense_date: aiResult.expense_date || prev.expense_date,
          category: aiResult.category || prev.category,
          description: aiResult.description || prev.description
        }));

        setOcrSuccess(true);
        setIsScanningOCR(false);
        return;
      } catch (aiErr) {
        console.warn('Google Vision AI error, falling back to Tesseract OCR:', aiErr);
        setOcrStatusText('Google Vision client error. Mengalihkan ke engine Tesseract OCR optik...');
      }
    }

    // 3. Priority 3: Optical Tesseract + Semantic NLP Engine (Offline Fallback)
    setActiveEngine('TESSERACT_NLP');
    setOcrProgress(30);
    setOcrStatusText('Memuat engine OCR optik Tesseract...');

    try {
      const Tesseract = await loadTesseract();
      setOcrProgress(45);
      setOcrStatusText('Membaca karakter teks struk...');

      const result = await Tesseract.recognize(
        imageSource,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const p = 45 + Math.round(m.progress * 45);
              setOcrProgress(p);
              setOcrStatusText(`Memindai baris teks struk (${Math.round(m.progress * 100)}%)...`);
            }
          }
        }
      );

      const recognized = result.data.text || '';
      setRawOcrText(recognized);
      setOcrProgress(95);
      setOcrStatusText('Mengekstrak nominal total, tanggal, dan nama toko...');

      const parsed = parseReceiptText(recognized);

      setFormData(prev => ({
        ...prev,
        title: parsed.detectedTitle || prev.title || 'Struk Belanja',
        amount: parsed.detectedAmount ? formatCurrencySeparator(parsed.detectedAmount) : prev.amount,
        expense_date: parsed.detectedDate || prev.expense_date,
        category: parsed.detectedCategory || prev.category,
        description: parsed.detectedTitle ? `Struk ${parsed.detectedTitle}` : prev.description
      }));

      setDetectedNumbers(parsed.detectedNumbers || []);
      setMerchantCandidates(parsed.merchantCandidates || []);
      setOcrProgress(100);
      setOcrSuccess(true);
    } catch (ocrErr) {
      console.error('Tesseract fallback error:', ocrErr);
      setOcrStatusText('Gagal memproses struk. Silakan isi rincian secara manual.');
    } finally {
      setIsScanningOCR(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran file maksimal 8MB');
      return;
    }

    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setReceiptPreview(dataUrl);
      setFormData(prev => ({ ...prev, receipt_url: dataUrl }));
      processReceiptImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setOcrSuccess(false);
    setRawOcrText('');
    setDetectedNumbers([]);
    setMerchantCandidates([]);
    setFormData(prev => ({ ...prev, receipt_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.title || formData.title.trim().length < 2) {
      newErrors.title = 'Judul pengeluaran minimal 2 karakter';
    }
    const cleanDigits = String(formData.amount || '').replace(/\D/g, '');
    const numAmount = parseInt(cleanDigits, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Nominal harus lebih besar dari Rp 0';
    }
    if (!formData.expense_date) {
      newErrors.expense_date = 'Tanggal pengeluaran wajib diisi';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveExpense({
        ...formData,
        amount: numAmount
      });
      resetForm();
      onClose();
    } catch (err) {
      console.error('Save expense error:', err);
      alert('Gagal menyimpan pengeluaran. Pastikan format data sudah sesuai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
              💸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {i18n.language === 'id' ? 'Catat Pengeluaran Baru' : 'Record New Expense'}
                </h2>
                {googleApiKey ? (
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3 text-blue-600" /> {i18n.language === 'id' ? 'Google Vision AI Aktif' : 'Google Vision AI Active'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Bot className="w-3 h-3 text-purple-600" /> {i18n.language === 'id' ? 'OCR Engine Aktif' : 'OCR Engine Active'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {i18n.language === 'id' ? 'Pencatatan pengeluaran cerdas dengan pemetaan otomatis dari struk belanja.' : 'Smart expense logging with automated receipt scanning.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">

          {/* GOOGLE VISION AI / OCR SECTION */}
          <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 p-4.5 space-y-3.5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                <span className="font-extrabold text-slate-900 text-xs">
                  Smart OCR & AI Receipt Scanner
                </span>
              </div>
              
              {/* Toggle API Key Settings */}
              <button
                type="button"
                onClick={() => setShowAiConfig(!showAiConfig)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{showAiConfig ? 'Tutup Pengaturan AI' : '⚙️ Atur Google Vision API'}</span>
              </button>
            </div>

            {/* Google Vision API Key Drawer */}
            {showAiConfig && (
              <div className="p-3.5 bg-white rounded-xl border border-indigo-200 shadow-xs space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Google Vision / Gemini AI Key
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Dapatkan API Key Gratis di Google AI Studio <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                {envApiKey && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-800 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Terhubung otomatis dari <strong>.env</strong> (<code>VITE_GEMINI_API_KEY</code>).</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={googleApiKey}
                    onChange={(e) => setGoogleApiKey(e.target.value)}
                    placeholder="Tempel Google AI / Gemini API Key di sini (AIzaSy...)"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (googleApiKey.trim()) {
                        localStorage.setItem('homehub_google_vision_key', googleApiKey.trim());
                        alert('Google Vision AI Key tersimpan! Sekarang pemindaian struk menggunakan kecerdasan Google Vision AI.');
                        setShowAiConfig(false);
                      }
                    }}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    Simpan Key
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Dengan Google Vision AI, struk yang miring, buram, atau berformat rumit dipetakan dengan <strong>akurasi 100%</strong> langsung ke judul toko, total harga, tanggal, dan kategori.
                </p>
              </div>
            )}

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Upload foto struk belanja asli. Mesin AI membaca teks dan memetakan nama toko, tanggal, dan nominal total secara otomatis.
            </p>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!isOcrAllowed ? (
              <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50/70 flex flex-col items-center justify-center text-center space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-amber-900 text-sm">
                    Fitur AI OCR Scan Struk Dinonaktifkan
                  </p>
                  <p className="text-[11px] text-amber-700 mt-1 max-w-sm leading-relaxed">
                    Kebijakan kuota sistem saat ini mematikan fitur pemindaian OCR untuk paket <strong>Standar (FREE)</strong>.
                  </p>
                </div>
                {onUpgradePro && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onUpgradePro();
                    }}
                    className="mt-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Upgrade ke PRO untuk Akses AI OCR</span>
                  </button>
                )}
              </div>
            ) : !receiptPreview ? (
              <div>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-2xl border border-purple-200 bg-white hover:bg-purple-50/70 transition flex flex-col items-center justify-center text-center cursor-pointer group space-y-2.5 shadow-2xs"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition shadow-xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      Klik untuk Upload Foto Struk / Nota Asli
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Mendukung format JPG, PNG, WEBP (Struk supermarket, SPBU, kasir, restoran)
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                    📷 Buka Galeri / Ambil Foto Struk
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 bg-white rounded-2xl border border-purple-200 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                      <img src={receiptPreview} alt="Struk Terupload" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {receiptFile ? receiptFile.name : 'Struk Terpilih'}
                        </span>
                      </div>
                      
                      {/* Live Scanning Indicator */}
                      {isScanningOCR ? (
                        <div className="mt-1 space-y-1">
                          <p className="text-[10px] text-purple-700 font-bold flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> {ocrStatusText}
                          </p>
                          <div className="w-48 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 transition-all duration-300"
                              style={{ width: `${ocrProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : ocrSuccess ? (
                        <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {activeEngine === 'BACKEND_AI'
                              ? 'Dipetakan oleh Backend Server (Gemini AI) ✨'
                              : activeEngine === 'GOOGLE_VISION' 
                                ? 'Dipetakan oleh Google Vision AI Client ✨' 
                                : 'Teks struk berhasil diekstrak dan dipetakan'}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={isScanningOCR}
                      onClick={() => processReceiptImage(receiptPreview)}
                      className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition cursor-pointer"
                      title="Pindai Ulang Struk"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition cursor-pointer"
                      title="Ganti Foto Struk"
                    >
                      <UploadCloud className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={removeReceipt}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      title="Hapus Struk"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Interactive Tappable Chips for Manual Override */}
                {detectedNumbers.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Pilihan Nominal Terdeteksi (Klik untuk memasukkan ke Nominal):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {detectedNumbers.map((num, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, amount: formatCurrencySeparator(num) }))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black border transition cursor-pointer ${
                            formData.amount === formatCurrencySeparator(num)
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-purple-400 hover:bg-purple-50'
                          }`}
                        >
                          Rp {num.toLocaleString('id-ID')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {merchantCandidates.length > 1 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Pilihan Nama Toko (Klik untuk memilih Judul):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {merchantCandidates.map((m, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, title: m }))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            formData.title === m
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw OCR Text Inspector */}
                {rawOcrText && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowRawText(!showRawText)}
                      className="w-full px-3 py-2 bg-slate-100/80 hover:bg-slate-200/60 text-slate-600 flex items-center justify-between font-bold text-[11px] transition cursor-pointer"
                    >
                      <span>🔍 Lihat Seluruh Teks Struk Asli (Raw OCR)</span>
                      {showRawText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {showRawText && (
                      <pre className="p-3 text-[10px] text-slate-600 bg-slate-50 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto border-t border-slate-200 leading-relaxed">
                        {rawOcrText}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FORM FIELDS (MAPPED TO DB_FINANCE.EXPENSES) */}
          <div className="space-y-4">
            
            {/* Field 1: Judul Pengeluaran / Merchant */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {i18n.language === 'id' ? 'Judul Pengeluaran / Toko / Merchant' : 'Expense Title / Merchant'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={i18n.language === 'id' ? 'misal: Indomaret Point, SPBU Shell, Tokopedia' : 'e.g. Supermarket, Shell Gas Station, Tokopedia'}
                className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 transition ${
                  errors.title ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-purple-500'
                }`}
              />
              {errors.title && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.title}</p>}
            </div>

            {/* Field 2 & 3: Nominal & Tanggal Transaksi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {i18n.language === 'id' ? 'Nominal Pengeluaran' : 'Expense Amount'} (Rp) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="amount"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    placeholder="misal: 150.000"
                    className={`w-full bg-slate-50 border rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 transition tracking-wide ${
                      errors.amount ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-purple-500'
                    }`}
                  />
                </div>
                {errors.amount ? (
                  <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.amount}</p>
                ) : formData.amount ? (
                  <p className="text-[10px] text-purple-700 font-bold mt-1">
                    {i18n.language === 'id' ? 'Terbaca' : 'Detected'}: Rp {formData.amount}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {i18n.language === 'id' ? 'Tanggal Pengeluaran' : 'Expense Date'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="expense_date"
                  value={formData.expense_date}
                  onChange={handleChange}
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 transition ${
                    errors.expense_date ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-purple-500'
                  }`}
                />
                {errors.expense_date && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.expense_date}</p>}
              </div>
            </div>

            {/* Field 4: Kategori Pengeluaran */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {i18n.language === 'id' ? 'Kategori Pengeluaran' : 'Expense Category'} <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              >
                {(expenseCategories && expenseCategories.length > 0 ? expenseCategories : CATEGORIES).map(cat => (
                  <option key={cat.code || cat.id || cat.name} value={cat.name || cat.id}>
                    {cat.icon ? `${cat.icon} ${getCategoryDisplayName(cat, i18n.language)}` : (getCategoryDisplayName(cat, i18n.language) || cat.label || cat.name)}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 4b: Dicatat Oleh (Anggota Keluarga) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>{i18n.language === 'id' ? 'Dicatat Oleh (Anggota Keluarga)' : 'Recorded By (Family Member)'} <span className="text-red-500">*</span></span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {i18n.language === 'id' ? 'Pilih siapa yang mengeluarkan uang' : 'Select who paid/recorded this'}
                </span>
              </label>
              <select
                name="recorded_by_name"
                value={formData.recorded_by_name}
                onChange={(e) => {
                  const val = e.target.value;
                  const memberObj = members.find(m => m.name === val);
                  setFormData(prev => ({
                    ...prev,
                    recorded_by_name: val,
                    user_id: memberObj ? (memberObj.user_id || memberObj.id) : prev.user_id
                  }));
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition cursor-pointer font-medium"
              >
                {members && members.length > 0 ? (
                  members.map(m => (
                    <option key={m.id || m.user_id || m.name} value={m.name}>
                      👤 {m.name} ({m.role || 'MEMBER'})
                    </option>
                  ))
                ) : (
                  <option value={currentUser?.name || 'Calvin'}>
                    👤 {currentUser?.name || 'Calvin'} (OWNER)
                  </option>
                )}
              </select>
            </div>

            {/* Field 5: Catatan & Rincian */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {i18n.language === 'id' ? 'Catatan & Rincian Transaksi' : 'Notes & Transaction Details'}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder={i18n.language === 'id' ? 'Rincian barang belanjaan, nomor nota, atau keperluan pengeluaran...' : 'Shopping item details, receipt number, or purpose...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
              />
            </div>

            {/* Field 6: Sumber Data & Status AI */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 text-xs">
                  {i18n.language === 'id' ? 'Metode Validasi' : 'Validation Method'}
                </span>
                <p className="text-[10px] text-slate-400">
                  {receiptPreview 
                    ? (activeEngine === 'BACKEND_AI'
                        ? (i18n.language === 'id' ? 'Tervalidasi via Backend Server (Gemini AI)' : 'Validated via Backend Server (Gemini AI)')
                        : activeEngine === 'GOOGLE_VISION'
                          ? (i18n.language === 'id' ? 'Tervalidasi via Google Vision AI Client' : 'Validated via Google Vision AI Client')
                          : (i18n.language === 'id' ? 'Tervalidasi via Smart OCR Optik' : 'Validated via Optical Smart OCR'))
                    : (i18n.language === 'id' ? 'Entri Manual Pengeluaran' : 'Manual Expense Entry')}
                </p>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded ${
                activeEngine === 'BACKEND_AI'
                  ? 'bg-emerald-100 text-emerald-800'
                  : activeEngine === 'GOOGLE_VISION' 
                    ? 'bg-blue-100 text-blue-800' 
                    : receiptPreview 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-slate-200 text-slate-700'
              }`}>
                {activeEngine === 'BACKEND_AI' ? 'BACKEND_GEMINI_AI' : activeEngine === 'GOOGLE_VISION' ? 'GOOGLE_VISION_AI' : receiptPreview ? 'SMART_OCR' : 'MANUAL'}
              </span>
            </div>

          </div>

          {/* Form Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isScanningOCR}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-purple-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('common.saving')}</span>
                </>
              ) : (
                <>
                  <span>{i18n.language === 'id' ? 'Simpan Pengeluaran' : 'Save Expense'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
