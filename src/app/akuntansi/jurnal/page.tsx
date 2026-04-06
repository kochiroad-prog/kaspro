import { getJurnalMemorial, postJurnal, voidJurnal } from '@/lib/actions/akuntansi'
import { formatRupiah, formatTanggal, formatRelative } from '@/lib/utils'
import JurnalMemorialForm from '@/components/forms/JurnalMemorialForm'
import type { JurnalMemorial } from '@/types'

export const revalidate = 0

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    draft: { bg: 'rgba(234,179,8,0.1)', color: '#a16207', label: 'Draft' },
    posted: { bg: 'rgba(22,163,106,0.1)', color: '#16a34a', label: 'Posted' },
    void: { bg: 'rgba(220,38,38,0.1)', color: '#dc2626', label: 'Void' },
  }[status] ?? { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: status }

  return (
    <span
      className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

function BalanceBadge({ balanced }: { balanced: boolean }) {
  return (
    <span className={`text-xs font-semibold ${balanced ? 'text-green-700' : 'text-red-600'}`}>
      {balanced ? '✓' : '✗'}
    </span>
  )
}

export default async function JurnalMemorialPage() {
  const { data: journals, error } = await getJurnalMemorial()

  const totalJournals = journals?.length ?? 0
  const totalPosted = journals?.filter(j => j.status === 'posted').length ?? 0
  const totalDraft = journals?.filter(j => j.status === 'draft').length ?? 0
  const totalVoid = journals?.filter(j => j.status === 'void').length ?? 0

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
          Jurnal Memorial
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Pencatatan Double-Entry (Debit / Kredit)
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4" style={{ borderLeft: '4px solid var(--brand)' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Jurnal</p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: 'var(--brand)' }}>{totalJournals}</p>
        </div>
        <div className="card p-4" style={{ borderLeft: '4px solid #16a34a' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Posted</p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: '#16a34a' }}>{totalPosted}</p>
        </div>
        <div className="card p-4" style={{ borderLeft: '4px solid #a16207' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Draft</p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: '#a16207' }}>{totalDraft}</p>
        </div>
        <div className="card p-4" style={{ borderLeft: '4px solid var(--exp)' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Void</p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: 'var(--exp)' }}>{totalVoid}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="p-4 rounded-lg text-sm"
          style={{ background: 'rgba(220,38,38,0.06)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)' }}
        >
          {error}
        </div>
      )}

      {/* Form: Tambah Jurnal */}
      <div className="card p-5">
        <div className="section-header">
          <h3 className="section-title">Tambah Jurnal Baru</h3>
        </div>
        <div className="mt-4">
          <JurnalMemorialForm />
        </div>
      </div>

      {/* Journal List */}
      <div className="card p-5">
        <div className="section-header">
          <h3 className="section-title">Daftar Jurnal</h3>
        </div>

        {(!journals || journals.length === 0) ? (
          <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
            <div className="text-4xl mb-3">📔</div>
            <p className="text-sm">Belum ada jurnal memorial</p>
            <p className="text-xs mt-1">Gunakan form di atas untuk membuat jurnal baru</p>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th className="px-3 py-2.5 text-left font-bold" style={{ color: 'var(--text-muted)' }}>Nomor</th>
                  <th className="px-3 py-2.5 text-left font-bold" style={{ color: 'var(--text-muted)' }}>Tanggal</th>
                  <th className="px-3 py-2.5 text-left font-bold" style={{ color: 'var(--text-muted)' }}>Keterangan</th>
                  <th className="px-3 py-2.5 text-left font-bold" style={{ color: 'var(--text-muted)' }}>Reff</th>
                  <th className="px-3 py-2.5 text-right font-bold" style={{ color: 'var(--text-muted)' }}>Debit</th>
                  <th className="px-3 py-2.5 text-right font-bold" style={{ color: 'var(--text-muted)' }}>Kredit</th>
                  <th className="px-3 py-2.5 text-center font-bold" style={{ color: 'var(--text-muted)' }}>Bal</th>
                  <th className="px-3 py-2.5 text-center font-bold" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="px-3 py-2.5 text-center font-bold" style={{ color: 'var(--text-muted)' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {journals.map(j => (
                  <tr key={j.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-3 py-3 font-mono font-semibold" style={{ color: 'var(--text)' }}>{j.nomor}</td>
                    <td className="px-3 py-3">
                      <div className="font-semibold" style={{ color: 'var(--text)' }}>{formatTanggal(j.tanggal)}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatRelative(j.tanggal)}</div>
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--text)' }}>{j.keterangan || '-'}</td>
                    <td className="px-3 py-3" style={{ color: 'var(--text-muted)' }}>{j.reff || '-'}</td>
                    <td className="px-3 py-3 text-right font-semibold font-mono" style={{ color: 'var(--text)' }}>
                      {formatRupiah(j.total_debit)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold font-mono" style={{ color: 'var(--text)' }}>
                      {formatRupiah(j.total_kredit)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <BalanceBadge balanced={j.is_balanced} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <StatusBadge status={j.status} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        {j.status === 'draft' && (
                          <form action={async () => {
                            'use server'
                            await postJurnal(j.id)
                          }}>
                            <button
                              type="submit"
                              className="px-2.5 py-1 text-xs font-semibold rounded"
                              style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}
                            >
                              Post
                            </button>
                          </form>
                        )}
                        {j.status === 'posted' && (
                          <form action={async () => {
                            'use server'
                            await voidJurnal(j.id)
                          }}>
                            <button
                              type="submit"
                              className="px-2.5 py-1 text-xs font-semibold rounded"
                              style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626' }}
                            >
                              Void
                            </button>
                          </form>
                        )}
                        {j.status === 'void' && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Dibatalkan</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
