import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[HomeHub ErrorBoundary Caught]:', error, errorInfo);
    this.setState({ errorInfo });
    if (import.meta.env.DEV) {
      try {
        window.__HOMEHUB_LAST_ERROR__ = {
          message: error?.message || String(error),
          stack: error?.stack,
          componentStack: errorInfo?.componentStack
        };
      } catch (_) {}
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('homehub_token');
      localStorage.removeItem('homehub_user');
      localStorage.removeItem('homehub_active_household_id');
      localStorage.removeItem('homehub_households');
    } catch (e) {
      console.warn('Failed clearing localStorage:', e);
    }
    window.location.href = '/';
  };

  handleCopyError = () => {
    const errorDetails = `[Error]: ${this.state.error?.toString()}\n\n[Stack]:\n${this.state.error?.stack || '-'}\n\n[Component Stack]:\n${this.state.errorInfo?.componentStack || '-'}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(errorDetails).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
      }).catch(() => {});
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 text-3xl mb-1 ring-4 ring-red-500/10">
              ⚠️
            </div>
            
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Terjadi Kesalahan Tampilan
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aplikasi mendeteksi kendala pada antarmuka. Anda dapat memuat ulang halaman atau menyalin rincian error untuk pelacakan.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-red-400 font-mono">
                    Rincian Teknis:
                  </span>
                  <button
                    type="button"
                    onClick={this.handleCopyError}
                    className="text-[10px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg border border-slate-700 transition cursor-pointer"
                  >
                    {this.state.copied ? '✅ Tersalin!' : '📋 Salin Error'}
                  </button>
                </div>
                <div className="p-3.5 bg-black/80 rounded-2xl border border-red-500/30 font-mono text-[11px] text-red-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {this.state.error.toString()}
                  {this.state.error.stack && (
                    <div className="mt-2 pt-2 border-t border-red-500/20 text-[10px] text-slate-400">
                      {this.state.error.stack}
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs py-3 rounded-2xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                🔄 Muat Ulang Halaman
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs py-3 rounded-2xl border border-slate-700 transition cursor-pointer"
              >
                🧹 Pulihkan Sesi & Demo
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
