export default function ProdukPage() {
  const produk = [
    {
      id: 1,
      nama: 'FABRIKA',
      deskripsi: 'Platform manajemen produksi & manufaktur',
      ikon: '🏗️',
      url: 'https://fabrika.io',
      gradientFrom: 'from-[var(--brand)]',
      gradientTo: 'to-[var(--brand-2)]',
    },
    {
      id: 2,
      nama: 'WINNER',
      deskripsi: 'Sistem point of sale & retail management',
      ikon: '🏆',
      url: 'https://winner.io',
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-purple-600',
    },
    {
      id: 3,
      nama: 'PRAECOX',
      deskripsi: 'Business automation ecosystem (aplikasi ini)',
      ikon: '⚡',
      url: '#',
      gradientFrom: 'from-cyan-400',
      gradientTo: 'to-cyan-600',
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>Produk Unggulan Praecox</h1>
        <p className="text-base" style={{ color: 'var(--text-muted)' }}>Ekosistem bisnis terintegrasi untuk kemudahan operasional Anda</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {produk.map(p => (
          <a
            key={p.id}
            href={p.url}
            target={p.url !== '#' ? '_blank' : undefined}
            rel={p.url !== '#' ? 'noopener noreferrer' : undefined}
            className={`rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow overflow-hidden relative group bg-gradient-to-br ${p.gradientFrom} ${p.gradientTo}`}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />

            {/* Content */}
            <div className="relative z-10">
              {/* Icon */}
              <div className="text-5xl mb-4">{p.ikon}</div>

              {/* Nama Produk */}
              <h2 className="text-2xl font-bold text-white mb-2">{p.nama}</h2>

              {/* Deskripsi */}
              <p className="text-sm text-white/90 mb-6 min-h-[2.5rem]">{p.deskripsi}</p>

              {/* Button */}
              <button className="inline-block px-4 py-2 rounded-lg font-semibold text-white bg-white/20 hover:bg-white/30 transition-colors text-sm">
                Lihat Produk →
              </button>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
