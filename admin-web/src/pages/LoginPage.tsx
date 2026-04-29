import React, { useState } from 'react';
import { auth } from '../api';

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('owner@limitlesscare.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await auth.login(email, password);
      onLogin();
    } catch (e: any) {
      setError(e?.message ?? 'Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <form onSubmit={submit}>
        <h2 style={{ marginTop: 0 }}>Owner Girişi</h2>
        {error ? <div className="error">{error}</div> : null}
        <div className="field">
          <label htmlFor="email">E-posta</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="pw">Şifre</label>
          <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn primary" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  );
}
