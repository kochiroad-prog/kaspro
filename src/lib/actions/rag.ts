'use server'

import { createClient } from '@/lib/supabase/server'
import type { CoaSearchResult } from '@/types'

// ============================================================
// RAG / AI Semantic Search for CoA
// ============================================================

/**
 * Search CoA accounts by text query (keyword-based fallback)
 * This is the primary search when pgvector embeddings aren't available yet
 */
export async function searchCoaByText(query: string, limit = 10): Promise<{ data: CoaSearchResult[] | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  if (!query || query.trim().length < 2) {
    return { data: null, error: 'Query minimal 2 karakter' }
  }

  const searchTerms = query.toLowerCase().trim().split(/\s+/)

  // Search by ilike on nama and deskripsi
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('id, kode, nama, deskripsi')
    .eq('user_id', user.id)
    .eq('tipe_akun', 'detail')
    .eq('aktif', true)
    .or(searchTerms.map(t => `nama.ilike.%${t}%,deskripsi.ilike.%${t}%`).join(','))
    .order('kode', { ascending: true })
    .limit(limit)

  if (error) return { data: null, error: error.message }

  // Score results based on term matches
  const scored = (data ?? []).map(row => {
    const text = `${row.nama} ${row.deskripsi}`.toLowerCase()
    const matchCount = searchTerms.filter(t => text.includes(t)).length
    return {
      coa_id: row.id,
      kode: row.kode,
      nama: row.nama,
      deskripsi: row.deskripsi || '',
      similarity: matchCount / searchTerms.length,
    }
  }).sort((a, b) => b.similarity - a.similarity)

  return { data: scored, error: null }
}

/**
 * Search CoA accounts using pgvector semantic search
 * Requires embeddings to be pre-computed and stored in coa_embeddings table
 */
export async function searchCoaSemantic(queryEmbedding: number[], limit = 5): Promise<{ data: CoaSearchResult[] | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase.rpc('search_coa_semantic', {
    p_user_id: user.id,
    p_query_embedding: queryEmbedding,
    p_limit: limit,
  })

  if (error) return { data: null, error: error.message }
  return { data: data as CoaSearchResult[], error: null }
}

/**
 * AI-powered CoA recommendation based on transaction description
 * Uses keyword matching + pattern recognition as smart fallback
 */
export async function rekomendasiAkun(deskripsi: string): Promise<{ data: CoaSearchResult[] | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  if (!deskripsi || deskripsi.trim().length < 2) {
    return { data: null, error: 'Deskripsi minimal 2 karakter' }
  }

  const desc = deskripsi.toLowerCase()

  // Pattern-based keyword mapping for intelligent matching
  const patterns: { keywords: string[]; coaKodePrefix: string[] }[] = [
    // Kas & Bank
    { keywords: ['kas', 'tunai', 'cash'], coaKodePrefix: ['1.1.11'] },
    { keywords: ['bank', 'bri', 'bca', 'mandiri', 'bni'], coaKodePrefix: ['1.1.11'] },
    { keywords: ['ewallet', 'gopay', 'ovo', 'dana', 'shopeepay'], coaKodePrefix: ['1.1.11'] },

    // Piutang
    { keywords: ['piutang', 'tagihan', 'receivable'], coaKodePrefix: ['1.1.21'] },
    { keywords: ['kasbon', 'pinjam karyawan'], coaKodePrefix: ['1.1.21'] },

    // Persediaan
    { keywords: ['stok', 'persediaan', 'inventory', 'barang'], coaKodePrefix: ['1.1.31'] },

    // Sewa / Prepaid
    { keywords: ['sewa', 'rent', 'kontrak'], coaKodePrefix: ['1.1.41', '6.2.11'] },
    { keywords: ['asuransi', 'insurance'], coaKodePrefix: ['1.1.41'] },

    // Aset Tetap
    { keywords: ['peralatan', 'laptop', 'komputer', 'printer', 'furniture'], coaKodePrefix: ['1.2.11'] },
    { keywords: ['kendaraan', 'mobil', 'motor'], coaKodePrefix: ['1.2.11'] },
    { keywords: ['bangunan', 'gedung', 'tanah'], coaKodePrefix: ['1.2.11'] },
    { keywords: ['penyusutan', 'depresiasi'], coaKodePrefix: ['1.2.21', '6.2.11'] },

    // Utang
    { keywords: ['utang', 'hutang', 'bayar supplier', 'payable'], coaKodePrefix: ['2.1.11'] },
    { keywords: ['utang gaji', 'gaji belum'], coaKodePrefix: ['2.1.21'] },
    { keywords: ['pajak', 'tax', 'pph'], coaKodePrefix: ['2.1.31', '9.1.11'] },

    // Ekuitas
    { keywords: ['modal', 'invest', 'setoran'], coaKodePrefix: ['3.1.11'] },
    { keywords: ['prive', 'drawing', 'tarik modal'], coaKodePrefix: ['3.1.31'] },
    { keywords: ['laba', 'profit', 'keuntungan'], coaKodePrefix: ['3.1.21'] },

    // Pendapatan
    { keywords: ['jual', 'penjualan', 'revenue', 'sales'], coaKodePrefix: ['4.1.11'] },
    { keywords: ['jasa', 'service', 'konsultasi', 'fee'], coaKodePrefix: ['4.1.11'] },
    { keywords: ['diskon', 'potongan'], coaKodePrefix: ['4.1.21'] },
    { keywords: ['retur'], coaKodePrefix: ['4.1.21'] },

    // HPP
    { keywords: ['hpp', 'harga pokok', 'bahan baku', 'cost of goods'], coaKodePrefix: ['5.1.11'] },

    // Beban Operasional
    { keywords: ['marketing', 'iklan', 'promo', 'advertising'], coaKodePrefix: ['6.1.11'] },
    { keywords: ['kirim', 'ekspedisi', 'kurir', 'ongkir'], coaKodePrefix: ['6.1.11'] },
    { keywords: ['listrik', 'air', 'telepon', 'internet', 'wifi'], coaKodePrefix: ['6.2.11'] },
    { keywords: ['gaji', 'salary', 'upah', 'tunjangan', 'bonus'], coaKodePrefix: ['6.2.11'] },
    { keywords: ['transport', 'bensin', 'parkir', 'tol'], coaKodePrefix: ['6.2.11'] },
    { keywords: ['atk', 'alat tulis', 'perlengkapan'], coaKodePrefix: ['6.2.11'] },
    { keywords: ['operasional', 'makan', 'meeting'], coaKodePrefix: ['6.2.11'] },

    // Pendapatan Lain
    { keywords: ['bunga', 'interest', 'deposito'], coaKodePrefix: ['7.1.11'] },

    // Beban Lain
    { keywords: ['admin bank', 'biaya bank'], coaKodePrefix: ['8.1.11'] },
    { keywords: ['kurs', 'selisih', 'forex'], coaKodePrefix: ['8.1.11'] },
  ]

  // Find matching patterns
  const matchedPrefixes = new Set<string>()
  for (const pattern of patterns) {
    if (pattern.keywords.some(kw => desc.includes(kw))) {
      pattern.coaKodePrefix.forEach(p => matchedPrefixes.add(p))
    }
  }

  if (matchedPrefixes.size === 0) {
    // Fallback to text search
    return searchCoaByText(deskripsi, 5)
  }

  // Fetch matching accounts
  const prefixArray = Array.from(matchedPrefixes)
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('id, kode, nama, deskripsi')
    .eq('user_id', user.id)
    .eq('tipe_akun', 'detail')
    .eq('aktif', true)
    .or(prefixArray.map(p => `kode.like.${p}%`).join(','))
    .order('kode', { ascending: true })
    .limit(10)

  if (error) return { data: null, error: error.message }

  const results: CoaSearchResult[] = (data ?? []).map(row => ({
    coa_id: row.id,
    kode: row.kode,
    nama: row.nama,
    deskripsi: row.deskripsi || '',
    similarity: 0.85, // Pattern match confidence
  }))

  return { data: results, error: null }
}

/**
 * Generate and store embeddings for all CoA accounts
 * Call this after seeding CoA or adding new accounts
 * Note: Requires an embedding API endpoint or Supabase Edge Function
 */
export async function generateCoaEmbeddings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  // Get all detail accounts
  const { data: accounts, error } = await supabase
    .from('chart_of_accounts')
    .select('id, kode, nama, deskripsi')
    .eq('user_id', user.id)
    .eq('tipe_akun', 'detail')
    .eq('aktif', true)

  if (error) return { error: error.message }
  if (!accounts || accounts.length === 0) return { error: 'Tidak ada akun CoA yang ditemukan' }

  // For now, store text content for future embedding generation
  // When pgvector embeddings are configured via Edge Function or external API,
  // this function will compute actual embeddings
  const rows = accounts.map(acc => ({
    user_id: user.id,
    coa_id: acc.id,
    content: `${acc.kode} ${acc.nama} ${acc.deskripsi}`.trim(),
    // embedding will be null until Edge Function computes it
  }))

  // Upsert content (embedding will be updated separately)
  for (const row of rows) {
    await supabase
      .from('coa_embeddings')
      .upsert(row, { onConflict: 'user_id,coa_id' })
  }

  return { error: null, count: rows.length }
}
