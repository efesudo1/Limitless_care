import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '../api';

const CATEGORIES = ['MENTAL_DEVELOPMENTAL', 'MENTAL_HEALTH', 'NEURO_PHYSICAL', 'SENSORY', 'CHRONIC'];

export function DiseasesPage() {
  const qc = useQueryClient();
  const { data: diseases } = useQuery({ queryKey: ['diseases'], queryFn: ownerApi.diseases });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = diseases ?? [];
  const selected = filtered.find((d: any) => d.id === selectedId);

  const createDisease = useMutation({
    mutationFn: ownerApi.createDisease,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diseases'] }),
    onError: (e: any) => setError(e?.message ?? 'Eklenemedi'),
  });
  const deleteDisease = useMutation({
    mutationFn: ownerApi.deleteDisease,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diseases'] });
      setSelectedId(null);
    },
    onError: (e: any) => setError(e?.message ?? 'Silinemedi'),
  });

  return (
    <>
      <h2>Hastalık Kataloğu</h2>
      {error ? <div className="error">{error}</div> : null}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <div>
          <DiseaseForm onSubmit={(body) => createDisease.mutate(body)} />
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>Hastalık</th>
                  <th>Kategori</th>
                  <th>Semp.</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d: any) => (
                  <tr
                    key={d.id}
                    style={{
                      cursor: 'pointer',
                      background: selectedId === d.id ? '#e0f2fe' : 'transparent',
                    }}
                    onClick={() => setSelectedId(d.id)}
                  >
                    <td>{d.name}</td>
                    <td><small>{d.category}</small></td>
                    <td>{d._count?.symptoms ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          {selected ? (
            <SymptomEditor
              disease={selected}
              onDeleteDisease={() => deleteDisease.mutate(selected.id)}
            />
          ) : (
            <div className="card">Detay için soldan bir hastalık seçin.</div>
          )}
        </div>
      </div>
    </>
  );
}

function DiseaseForm({ onSubmit }: { onSubmit: (body: any) => void }) {
  const [form, setForm] = useState({
    name: '',
    category: 'CHRONIC',
    description: '',
  });
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Yeni Hastalık</h3>
      <div className="field">
        <label>Ad</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="field">
        <label>Kategori</label>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Açıklama</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <button
        className="btn primary"
        onClick={() => {
          if (!form.name || !form.description) return;
          onSubmit(form);
          setForm({ name: '', category: 'CHRONIC', description: '' });
        }}
      >
        Ekle
      </button>
    </div>
  );
}

function SymptomEditor({ disease, onDeleteDisease }: { disease: any; onDeleteDisease: () => void }) {
  const qc = useQueryClient();
  const { data: symptoms } = useQuery({
    queryKey: ['symptoms', disease.id],
    queryFn: () => ownerApi.diseaseSymptoms(disease.id),
  });
  const [form, setForm] = useState({ name: '', description: '' });
  const create = useMutation({
    mutationFn: () => ownerApi.createSymptom({ diseaseId: disease.id, ...form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['symptoms', disease.id] });
      qc.invalidateQueries({ queryKey: ['diseases'] });
      setForm({ name: '', description: '' });
    },
  });
  const remove = useMutation({
    mutationFn: ownerApi.deleteSymptom,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['symptoms', disease.id] });
      qc.invalidateQueries({ queryKey: ['diseases'] });
    },
  });

  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0 }}>{disease.name}</h3>
            <small>{disease.category}</small>
          </div>
          <button className="btn danger" onClick={onDeleteDisease}>
            Hastalığı Sil
          </button>
        </div>
        <p>{disease.description}</p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Yeni Semptom</h3>
        <div className="field">
          <label>Ad</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Açıklama</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <button className="btn primary" onClick={() => form.name && form.description && create.mutate()}>
          Semptom Ekle
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Semptom</th>
              <th>Açıklama</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(symptoms ?? []).map((s: any) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.description}</td>
                <td>
                  <button className="btn danger" onClick={() => remove.mutate(s.id)}>Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
