function SubmitListingPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">İlan Ver</h1>
      <p className="text-gray-600 mb-6">Gönderdiğiniz ilan admin onayından sonra yayına alınır.</p>
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input className="rounded-lg border px-3 py-2" placeholder="Başlık" />
        <input className="rounded-lg border px-3 py-2" placeholder="Fiyat (TL)" />
        <input className="rounded-lg border px-3 py-2" placeholder="m²" />
        <input className="rounded-lg border px-3 py-2" placeholder="Oda Sayısı (3+1 vb.)" />
        <textarea className="rounded-lg border px-3 py-2 sm:col-span-2" placeholder="Açıklama" rows={4} />
        <button className="sm:col-span-2 rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700">İlanı Gönder</button>
      </form>
    </div>
  )
}

export default SubmitListingPage


