import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '../api';

export function MedicationsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['medications'], queryFn: ownerApi.medications });
  const [form, setForm] = useState({ name: '', defaultUnit: 'mg', description: '' });
  const create = useMutation({
    mutationFn: () => ownerApi.createMedication(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medications'] });
      setForm({ name: '', defaultUnit: 'mg', description: '' });
    },
  });
  const remove = useMutation({
    mutationFn: ownerApi.deleteMedication,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medications'] }),
  });

  return (
    <>
      <h2>İlaç Kütüphanesi</h2>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Yeni İlaç</h3>
        <div className="row">
          <div className="field" style={{ flex: 2 }}>
            <label>Ad</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Birim</label>
            <input value={form.defaultUnit} onChange={(e) => setForm({ ...form, defaultUnit: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>Açıklama (opsiyonel)</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button
          className="btn primary"
          onClick={() => form.name && form.defaultUnit && create.mutate()}
        >
          Ekle
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>İlaç</th>
              <th>Birim</th>
              <th>Açıklama</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((m: any) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.defaultUnit}</td>
                <td>{m.description}</td>
                <td><button className="btn danger" onClick={() => remove.mutate(m.id)}>Sil</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
