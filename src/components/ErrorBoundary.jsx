import React from 'react';

/**
 * Production error boundary.
 *
 * Without this, a render error anywhere in the tree unmounts the whole React
 * root and leaves a blank white page - the visitor sees a broken site and the
 * operator sees nothing in the console. This catches the error, shows a
 * recoverable screen and offers a retry that remounts the tree.
 *
 * Development keeps React's default overlay behaviour instead, so the error is
 * visible where you are working.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Always log: in production this is the only record of the failure.
    // eslint-disable-next-line no-console
    console.error('[superui] Unhandled render error:', error, info?.componentStack);
  }

  handleReset() {
    this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (import.meta.env.DEV) {
      return (
        <pre style={{ padding: 24, color: '#b91c1c', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
          {error.stack || String(error)}
        </pre>
      );
    }

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          color: '#111111',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#000000' }}>
          Something went wrong
        </h1>
        <p style={{ margin: 0, maxWidth: '460px', fontSize: '14px', color: '#111111', lineHeight: 1.6 }}>
          This page could not be displayed. Please reload, and if the problem continues email us and we will
          fix it.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#FF5E00',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: '1px solid #EDEDED',
              color: '#111111',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none'
            }}
          >
            Back to home
          </a>
        </div>
      </div>
    );
  }
}