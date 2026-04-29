import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '../api';

export function PendingDoctorsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>('PENDING');
  const { data, isLoading } = useQuery({
    queryKey: ['doctors', filter],
    queryFn: () => ownerApi.doctors(filter || undefined),
  });

  const approve = useMutation({
    mutationFn: (id: string) => ownerApi.approveDoctor(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => ownerApi.rejectDoctor(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  });

  return (
    <>
      <h2>Doktor Onayları</h2>
      <div className="card">
        <div className="row">
          <label>Durum:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Tümü</option>
            <option value="PENDING">Beklemede</option>
            <option value="APPROVED">Onaylanmış</option>
            <option value="REJECTED">Reddedilmiş</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <p style={{ padding: 16 }}>Yükleniyor...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>E-posta</th>
                <th>Diploma No</th>
                <th>Unvan / Uzmanlık</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((d: any) => (
                <DoctorRow
                  key={d.userId}
                  doctor={d}
                  onApprove={() => approve.mutate(d.userId)}
                  onReject={(reason) => reject.mutate({ id: d.userId, reason })}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function DoctorRow({
  doctor,
  onApprove,
  onReject,
}: {
  doctor: any;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  return (
    <tr>
      <td>{doctor.fullName}</td>
      <td>{doctor.user.email}</td>
      <td>{doctor.diplomaNumber}</td>
      <td>{doctor.title} / {doctor.specialty}</td>
      <td><span className={`badge ${doctor.status}`}>{doctor.status}</span></td>
      <td>
        {doctor.status === 'PENDING' ? (
          <div className="row">
            <button className="btn success" onClick={onApprove}>Onayla</button>
            <button className="btn danger" onClick={() => setShowReject((s) => !s)}>
              Reddet
            </button>
            {showReject ? (
              <>
                <input
                  type="text"
                  placeholder="Red sebebi"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <button
                  className="btn ghost"
                  onClick={() => {
                    if (reason.length < 3) return;
                    onReject(reason);
                    setShowReject(false);
                    setReason('');
                  }}
                >
                  Gönder
                </button>
              </>
            ) : null}
          </div>
        ) : doctor.status === 'REJECTED' ? (
          <span style={{ color: '#7f1d1d' }}>{doctor.rejectionReason}</span>
        ) : (
          '—'
        )}
      </td>
    </tr>
  );
}
