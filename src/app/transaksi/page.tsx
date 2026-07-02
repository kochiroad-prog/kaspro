import { getTransaksi, getSaldoAwalKas } from '@/lib/actions/transaksi'
import { getKas, getKategori, getTransfer } from '@/lib/actions/index'
import { getUser } from '@/lib/actions/auth'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import AddTxButton from '@/components/forms/AddTxButton'
import ExportPanel from '@/components/transaksi/ExportPanel'
import TransaksiTable from '@/components/transaksi/TransaksiTable'

export const revalidate = 0

export default async function TransaksiPage({
  searchParams,
}: {
  searchParams: Promise<{ tipe?: string; kas_id?: string; kategori_id?: string; dari?: string; sampai?: string; sort?: string; limit?: string; q?: string }>
}) {
  const sp = await searchParams
  // Kas spesifik dipilih (bukan "Semua Kas") & tanpa filter lain yg bisa bikin rekonsiliasi saldo tidak relevan
  const kasFilterAktif = !!sp.kas_id && !sp.tipe && !sp.kategori_id && !sp.dari && !sp.sampai

  const [txResult, kasResult, katResult, user, transferResult, saldoAwalResult] = await Promise.all([
    getTransaksi({
      tipe: sp.tipe as any,
      kas_id: sp.kas_id,
      kategori_id: sp.kategori_id,
      dari_tanggal: sp.dari,
      sampai_tanggal: sp.sampai,
      // Saat 1 kas spesifik dipilih (mode rekonsiliasi saldo), jangan dibatasi 100 —
      // supaya "Total Masuk/Keluar" & Saldo Awal yang dihitung selalu cocok dgn saldo kas.
      limit: sp.limit ? parseInt(sp.limit) : (kasFilterAktif ? undefined : 100),
    }),
    getKas(),
    getKategori(),
    getUser(),
    kasFilterAktif ? getTransfer(sp.kas_id) : Promise.resolve({ data: [], error: null }),
    kasFilterAktif ? getSaldoAwalKas(sp.kas_id!) : Promise.resolve({ saldo: 0, error: null }),
  ])

  const txList = txResult.data ?? []
  const transferList = transferResult.data ?? []
  const saldoAwal = saldoAwalResult.saldo ?? 0
  const kasDipilih = kasFilterAktif ? (kasResult.data ?? []).find(k => k.id === sp.kas_id) : null

  // Total pemasukan/pengeluaran murni dari transaksi (utk kartu ringkasan seperti semula)
  const totalMasuk = txList.filter(t => t.tipe === 'pemasukan').reduce((s, t) => s + t.jumlah, 0)
  const totalKeluar = txList.filter(t => t.tipe === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0)

  // Termasuk transfer, dipakai utk rekonsiliasi saldo saat 1 kas dipilih
  const transferMasuk = transferList.filter(t => t.ke_kas_id === sp.kas_id).reduce((s, t) => s + t.jumlah, 0)
  const transferKeluar = transferList.filter(t => t.dari_kas_id === sp.kas_id).reduce((s, t) => s + t.jumlah, 0)
  const saldoAkhirHitung = saldoAwal + totalMasuk - totalKeluar + transferMasuk - transferKeluar

  const exportData = txList.map(tx => ({
    tanggal: formatTanggal(tx.tanggal),
    kategori: tx.kategori?.nama ?? 'Lainnya',
    keterangan: tx.catatan || '',
    unit: [tx.unit_bisnis?.nama, tx.proyek?.nama].filter(Boolean).join(' / '),
    kas: tx.kas?.nama ?? '—',
    tipe: tx.tipe,
    jumlah: tx.jumlah,
  }))

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Transaksi</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{txList.length} transaksi ditemukan</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ExportPanel
            data={exportData}
            userName={user?.profile?.nama ?? user?.email ?? 'Pengguna'}
            userEmail={user?.email ?? ''}
          />
          <AddTxButton />
        </div>
      </div>

      {sp.q && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
          <span>🤖</span>
          <span>Hasil untuk: <strong>"{sp.q}"</strong></span>
          <a href="/transaksi" className="ml-auto text-xs underline opacity-70">Reset</a>
        </div>
      )}
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-label">Total Uang Masuk</div>
          <div className="stat-value" style={{ color: 'var(--inc)' }}>{formatRupiah(totalMasuk)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Uang Keluar</div>
          <div className="stat-value" style={{ color: 'var(--exp)' }}>{formatRupiah(totalKeluar)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Selisih / Keuntungan</div>
          <div className="stat-value" style={{ color: totalMasuk - totalKeluar >= 0 ? 'var(--inc)' : 'var(--exp)' }}>
            {formatRupiah(totalMasuk - totalKeluar)}
          </div>
        </div>
      </div>

      {/* Rekonsiliasi saldo — hanya muncul saat 1 kas spesifik dipilih tanpa filter lain.
          Menjawab "kenapa nominal di kartu kas beda dgn total di riwayat transaksi":
          kartu = Saldo Awal + transaksi + transfer, sedangkan tabel di bawah cuma transaksi. */}
      {kasFilterAktif && kasDipilih && (
        <div className="card p-4" style={{ background: 'var(--brand-light)' }}>
          <p className="text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>
            Rekonsiliasi Saldo — {kasDipilih.nama}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span>Saldo Awal <strong style={{ color: 'var(--text)' }}>{formatRupiah(saldoAwal)}</strong></span>
            <span>+</span>
            <span>Masuk (termasuk transfer) <strong style={{ color: 'var(--inc)' }}>{formatRupiah(totalMasuk + transferMasuk)}</strong></span>
            <span>−</span>
            <span>Keluar (termasuk transfer) <strong style={{ color: 'var(--exp)' }}>{formatRupiah(totalKeluar + transferKeluar)}</strong></span>
            <span>=</span>
            <span>Saldo Akhir <strong style={{ color: 'var(--text)' }}>{formatRupiah(saldoAkhirHitung)}</strong></span>
          </div>
          {saldoAkhirHitung !== kasDipilih.saldo && (
            <p className="text-xs mt-2 font-semibold" style={{ color: 'var(--exp)' }}>
              ⚠ Hasil hitung ({formatRupiah(saldoAkhirHitung)}) tidak sama dengan saldo di kartu kas ({formatRupiah(kasDipilih.saldo)}) — kemungkinan ada transaksi/transfer yg belum tercatat lengkap.
            </p>
          )}
        </div>
      )}

      {/* Filter */}
      <form method="GET" className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Tipe</label>
          <select name="tipe" defaultValue={sp.tipe ?? ''} className="input w-36 py-2 text-sm">
            <option value="">Semua</option>
            <option value="pemasukan">Uang Masuk</option>
            <option value="pengeluaran">Uang Keluar</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Kas</label>
          <select name="kas_id" defaultValue={sp.kas_id ?? ''} className="input w-40 py-2 text-sm">
            <option value="">Semua Kas</option>
            {(kasResult.data ?? []).map(k => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Kategori</label>
          <select name="kategori_id" defaultValue={sp.kategori_id ?? ''} className="input w-44 py-2 text-sm">
            <option value="">Semua Kategori</option>
            {(katResult.data ?? []).map(k => (
              <option key={k.id} value={k.id}>{k.ikon} {k.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Dari</label>
          <input type="date" name="dari" defaultValue={sp.dari ?? ''} className="input w-36 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Sampai</label>
          <input type="date" name="sampai" defaultValue={sp.sampai ?? ''} className="input w-36 py-2 text-sm" />
        </div>
        <button type="submit" className="btn-primary py-2 text-sm">Filter</button>
        <a href="/transaksi" className="btn-secondary py-2 text-sm">Reset</a>
      </form>

      {/* Tabel Transaksi */}
      <TransaksiTable
        txList={txList}
        transferList={kasFilterAktif ? transferList : []}
        kasIdFilter={kasFilterAktif ? sp.kas_id : undefined}
        saldoAwal={kasFilterAktif ? saldoAwal : undefined}
      />
    </div>
  )
}
