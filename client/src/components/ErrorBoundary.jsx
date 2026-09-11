// src/components/ErrorBoundary.jsx
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Biar errornya juga kelihatan di console (dan di remote debugging kalau perlu)
    console.error('App crashed:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'sans-serif',
          textAlign: 'center',
          background: '#fef2f2',
        }}>
          <h2 style={{ color: '#be123c', marginBottom: 8 }}>Ups, ada yang error 😬</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16, maxWidth: 480 }}>
            Aplikasi mengalami error saat menampilkan halaman ini. Detail teknisnya:
          </p>
          <pre style={{
            background: '#1e293b',
            color: '#f87171',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '11px',
            maxWidth: '90vw',
            overflow: 'auto',
            textAlign: 'left',
          }}>
            {String(this.state.error && (this.state.error.stack || this.state.error.message || this.state.error))}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              padding: '10px 24px',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}