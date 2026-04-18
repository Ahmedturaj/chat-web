import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login, register } from '../utils/api';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;

      if (isLogin) {
        res = await login({
          email: form.email,
          password: form.password,
        });
      } else {
        const fullName = form.name.trim();

        let firstName = '';
        let lastName = 'N/A';

        if (fullName.includes(' ')) {
          const parts = fullName.split(' ');
          firstName = parts[0];
          lastName = parts.slice(1).join(' ') || 'N/A';
        } else {
          firstName = fullName;
        }

        res = await register({
          firstName,
          lastName,
          email: form.email,
          password: form.password,
        });
      }

      const d = res.data.data || res.data;

      const token = d.token || d.accessToken;

      const user = d.user || {
        name: `${d.firstName || ''} ${d.lastName || ''}`.trim(),
        email: d.email,
        _id: d._id,
      };

      loginUser(user, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#2563eb"/>
              <path d="M7 9h14M7 14h10M7 19h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={styles.brand}>ChatSphere</h1>
          <p style={styles.sub}>Real-time group messaging</p>
        </div>

        <div style={styles.tabs}>
          <button style={isLogin ? styles.tabActive : styles.tab} onClick={() => setIsLogin(true)}>Sign In</button>
          <button style={!isLogin ? styles.tabActive : styles.tab} onClick={() => setIsLogin(false)}>Register</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.input}
                placeholder="John Doe"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={loading ? styles.btnDisabled : styles.btn} disabled={loading}>
            {loading ? <span style={styles.spinner} /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)',
    padding: '16px',
  },
  card: {
    background: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 420,
    boxShadow: '0 20px 60px rgba(37,99,235,0.15)',
    animation: 'fadeIn 0.3s ease',
  },
  header: { textAlign: 'center', marginBottom: 32 },
  logo: {
    width: 52, height: 52, borderRadius: 14, background: '#eff6ff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 12px', boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
  },
  brand: { fontSize: 26, fontWeight: 700, color: '#1e3a8a', letterSpacing: '-0.5px' },
  sub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  tabs: {
    display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 24,
  },
  tab: {
    flex: 1, padding: '9px 0', border: 'none', background: 'transparent',
    borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500,
    color: '#64748b', fontFamily: 'var(--font)',
    transition: 'all 0.2s',
  },
  tabActive: {
    flex: 1, padding: '9px 0', border: 'none', background: '#fff',
    borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
    color: '#2563eb', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    fontFamily: 'var(--font)', transition: 'all 0.2s',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#334155' },
  input: {
    padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
    fontSize: 14, color: '#1e293b', outline: 'none', fontFamily: 'var(--font)',
    transition: 'border-color 0.2s',
    background: '#fafcff',
  },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
    padding: '10px 14px', fontSize: 13, color: '#dc2626',
  },
  btn: {
    padding: '13px', background: '#2563eb', color: '#fff', border: 'none',
    borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font)', marginTop: 4,
    transition: 'background 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: {
    padding: '13px', background: '#93c5fd', color: '#fff', border: 'none',
    borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'not-allowed',
    fontFamily: 'var(--font)', marginTop: 4,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  spinner: {
    width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)',
    borderTop: '2px solid #fff', borderRadius: '50%',
    display: 'inline-block', animation: 'spin 0.7s linear infinite',
  },
};