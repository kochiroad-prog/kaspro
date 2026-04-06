import { getCoa, seedCoaDefault } from '@/lib/actions/akuntansi'
import CoAForm from '@/components/forms/CoAForm'
import type { ChartOfAccounts } from '@/types'

export const revalidate = 0

const KLASIFIKASI_LABEL: Record<number, string> = {
  1: 'ASET',
  2: 'KEWAJIBAN',
  3: 'EKUITAS',
  4: 'PENDAPATAN',
  5: 'HPP',
  6: 'BEBAN OPERASIONAL',
  7: 'PENDAPATAN LAIN',
  8: 'BEBAN LAIN',
  9: 'PAJAK',
}

const KLASIFIKASI_COLOR: Record<number, string> = {
  1: 'var(--brand)',
  2: 'var(--exp)',
  3: 'var(--inc)',
  4: 'var(--inc)',
  5: 'var(--exp)',
  6: 'var(--exp)',
  7: 'var(--inc)',
  8: 'var(--exp)',
  9: 'var(--text-muted)',
}

function TipeAkunBadge({ tipe }: { tipe: string }) {
  const label = { header: 'Header', sub_header: 'Sub Header', detail: 'Detail' }[tipe] || tipe
  const bg = {
    header: 'rgba(59,130,246,0.1)',
    sub_header: 'rgba(139,92,246,0.1)',
    detail: 'rgba(107,114,128,0.08)',
  }[tipe] || 'rgba(107,114,128,0.08)'
  const color = {
    header: '#3b82f6',
    sub_header: '#8b5cf6',
    detail: 'var(--text-muted)',
  }[tipe] || 'var(--text-muted)'

  return (
    <span
      className="inline-block px-2 py-0.5 text-xs font-semibold rounded"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  )
}

function getIndentPl(tipe: string): string {
  if (tipe === 'detail') return 'pl-8'
  if (tipe === 'sub_header') return 'pl-4'
  return ''
}

function CoATable({ accounts }: { accounts: ChartOfAccounts[] }) {
  const grouped = accounts.reduce((acc, a) => {
    const k = a.klasifikasi
    if (!acc[k]) acc[k] = []
    acc[k].push(a)
    return acc
  }, {} as Record<number, ChartOfAccounts[]>)

  const sortedKeys = Object.keys(grouped).map(Number).sort((a, b) => a - b)

  return (
    <div className="space-y-5">
      {sortedKeys.map(klas => (
        <div key={klas} className="card overflow-hidden">
          {/* Klasifikasi Header */}
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{
              borderBottom: `2px solid ${KLASIFIKASI_COLOR[klas]}`,
            }}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: KLASIFIKASI_COLOR[klas] }}>
              {klas}. {KLASIFIKASI_LABEL[klas]}
            </h3>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {grouped[klas].length} akun
            </span>
          </div>

          {/* Account Rows */}
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {grouped[klas].map(akun => (
              <div
                key={akun.id}
                className={`flex items-center gap-3 px-5 py-3 ${getIndentPl(akun.tipe_akun)} ${akun.tipe_akun === 'header' ? 'font-bold' : akun.tipe_akun === 'sub_header' ? 'font-semibold' : ''}`}
                style={{ color: 'var(--text)' }}
              >
                {/* Kode */}
                <span
                  className="text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ background: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  {akun.kode}
                </span>

                {/* Nama */}
                <span className="text-sm flex-1 truncate">{akun.nama}</span>

                {/* Tipe Badge */}
                <TipeAkunBadge tipe={akun.tipe_akun} />

                {/* Saldo Normal */}
                <span className="text-xs font-mono w-12 text-center" style={{ color: 'var(--text-muted)' }}>
                  {akun.saldo_normal === 'debit' ? 'D' : 'K'}
                </span>

                {/* Kas indicator */}
                {akun.is_kas ? (
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold flex-shrink-0"
                    style={{ background: 'rgba(22,163,106,0.1)', color: '#16a34a' }}
                  >
                    K
                  </span>
                ) : (
                  <span className="w-5 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function CoAPage() {
  const { data: accounts, error } = await getCoa()
  const isEmpty = !accounts || accounts.length === 0

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            Chart of Accounts
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Daftar Kode Akun Standar 7-Digit (X.X.XX.XXX)
          </p>
        </div>
        {!isEmpty && (
          <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            {accounts?.length ?? 0} akun
          </span>
        )}
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

      {/* Empty State + Seed */}
      {isEmpty && !error && (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>
            Belum ada Chart of Accounts
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Inisialisasi data default untuk memulai mengelola kode akun
          </p>
          <form action={seedCoaDefault}>
            <button type="submit" className="btn-primary">
              Buat CoA Default Sekarang
            </button>
          </form>
        </div>
      )}

      {/* Add Form */}
      {!isEmpty && (
        <div className="card p-5">
          <div className="section-header">
            <h3 className="section-title">Tambah Akun Baru</h3>
          </div>
          <div className="mt-3">
            <CoAForm />
          </div>
        </div>
      )}

      {/* Account Table */}
      {!isEmpty && accounts && <CoATable accounts={accounts} />}
    </div>
  )
}
