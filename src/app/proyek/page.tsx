import { getProyek, tambahProyek } from '@/lib/actions/index'
import { formatTanggal } from '@/lib/utils'
import ProyekForm from '@/components/forms/ProyekForm'

export const revalidate = 0

export default async function ProyekPage() {
  const { data: proyekList } = await getProyek()

  const statusConfig = {
    aktif:      { label: 'Aktif',      bg: 'bg-green-50',  text: 'text-green-700'  },
    selesai:    { label: 'Selesai',    bg: 'bg-blue-50',   text: 'text-blue-700'   },
    dibatalkan: { label: 'Dibatalkan', bg: 'bg-gray-100',  text: 'text-gray-500'   },
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Proyek</h1>
        <p className="text-sm text-gray-500 mt-0.5">Lacak keuangan per proyek atau klien</p>
      </div>

      {/* Proyek List */}
      {(proyekList ?? []).length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <div className="text-5xl mb-3">📁</div>
          <p className="text-sm font-medium">Belum ada proyek</p>
          <p className="text-xs mt-1">Tambahkan proyek untuk melacak keuangan per klien</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-50">
            {(proyekList ?? []).map(p => {
              const sc = statusConfig[p.status]
              return (
                <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl flex-shrink-0">📁</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      <p className="text-sm font-bold text-gray-800">{p.nama}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.nama_client && <span className="mr-2">👤 {p.nama_client}</span>}
                      {p.tgl_mulai && <span>📅 {formatTanggal(p.tgl_mulai)}</span>}
                      {p.tgl_selesai && <span> – {formatTanggal(p.tgl_selesai)}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a href={`/transaksi?proyek_id=${p.id}`} className="btn-secondary text-xs py-1.5 px-3">
                      Transaksi
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Form Tambah Proyek */}
      <div className="card p-6">
        <h2 className="text-base font-bold mb-4">Buat Proyek Baru</h2>
        <ProyekForm />
      </div>
    </div>
  )
}
