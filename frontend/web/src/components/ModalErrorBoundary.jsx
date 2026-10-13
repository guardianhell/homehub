import React from 'react';

export default class ModalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ModalErrorBoundary in ${this.props.name || 'Modal'} Caught]:`, error, errorInfo);
    this.setState({ errorInfo });
    try {
      window.__HOMEHUB_LAST_ERROR__ = {
        component: this.props.name || 'Modal',
        message: error?.message || String(error),
        stack: error?.stack,
        componentStack: errorInfo?.componentStack
      };
    } catch (_) {}
  }

  handleClose = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 sm:p-7 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center text-xl font-bold ring-2 ring-red-500/10">
                ⚠️
              </div>
              <div className="flex-1">
                <h3 className="font-black text-white text-base tracking-tight">
                  Kendala Membuka Formulir {this.props.title || this.props.name || ''}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Terjadi kendala pada formulir ini. Halaman utama aplikasi tetap aman dan berfungsi.
                </p>
              </div>
              <button
                type="button"
                onClick={this.handleClose}
                className="text-slate-400 hover:text-white p-1 rounded-xl transition cursor-pointer text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {this.state.error && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-red-400">Pesan Error:</p>
                <div className="p-3 bg-slate-950 rounded-2xl border border-red-500/25 text-left font-mono text-[11px] text-red-300 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {this.state.error.toString()}
                  {this.state.error.stack && (
                    <div className="mt-2 pt-2 border-t border-red-500/15 text-[10px] text-slate-400 font-mono">
                      {this.state.error.stack}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={this.handleClose}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-2xl border border-slate-700 transition cursor-pointer"
              >
                Tutup Formulir & Kembali
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
