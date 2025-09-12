import { useState } from 'react'
import { uploadListingImage, getListingImageUrl, deleteListingImage } from '../lib/storage'

function AdminDashboard() {
  const [listingId, setListingId] = useState('demo-listing-id')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState('Hazır')
  const [error, setError] = useState('')
  const [uploadedPath, setUploadedPath] = useState('')
  const [publicUrl, setPublicUrl] = useState('')

  async function handleUpload() {
    try {
      setError('')
      if (!file) {
        setError('Lütfen bir dosya seçin')
        return
      }
      if (!listingId) {
        setError('listingId giriniz')
        return
      }
      setStatus('Yükleniyor...')
      const res = await uploadListingImage(file, listingId)
      setUploadedPath(res.path)
      setPublicUrl(res.publicUrl)
      setStatus('Yükleme başarılı')
    } catch (e: any) {
      setError(e?.message || 'Yükleme başarısız')
      setStatus('HATA')
    }
  }

  async function handleRefreshUrl() {
    try {
      setError('')
      if (!uploadedPath) return
      setPublicUrl(getListingImageUrl(uploadedPath))
    } catch (e: any) {
      setError(e?.message || 'URL alınamadı')
    }
  }

  async function handleDelete() {
    try {
      setError('')
      if (!uploadedPath) return
      setStatus('Siliniyor...')
      await deleteListingImage(uploadedPath)
      setStatus('Silindi')
      setUploadedPath('')
      setPublicUrl('')
      setFile(null)
    } catch (e: any) {
      setError(e?.message || 'Silme başarısız')
      setStatus('HATA')
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard (Storage Test)</h1>

      <div className="rounded-lg border p-4 mb-4">
        <div className="mb-2 text-sm text-gray-600">Durum: {status}</div>
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        <div className="grid gap-3">
          <div>
            <label className="block text-sm mb-1">Listing ID</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="ör. 123e4567-e89b-12d3-a456-426614174000"
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Dosya</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => void handleUpload()} className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-orange-500">Yükle</button>
            <button onClick={() => void handleRefreshUrl()} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">URL Yenile</button>
            <button onClick={() => void handleDelete()} className="rounded-lg bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700">Sil</button>
          </div>
        </div>
      </div>

      {uploadedPath && (
        <div className="rounded-lg border p-4">
          <div className="text-sm mb-2">
            <div className="text-gray-700">Yüklenen path:</div>
            <div className="font-mono break-all">{uploadedPath}</div>
          </div>
          {publicUrl ? (
            <div>
              <div className="text-sm text-gray-700 mb-1">Public URL:</div>
              <a href={publicUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-sm break-all hover:underline">{publicUrl}</a>
              <div className="mt-3">
                <img src={publicUrl} alt="preview" className="w-40 h-40 object-cover rounded border" />
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">URL mevcut değil (bucket private olabilir).</div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
