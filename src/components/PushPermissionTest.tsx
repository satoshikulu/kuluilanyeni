import { useState } from 'react'
import { 
  shouldShowPushModal, 
  resetPushPermissionState, 
  getPushPermissionStatus,
  denyPushForFiveDays,
  denyPushPermanently,
  markPushPermissionGranted
} from '../lib/pushPermission'
import PushPermissionModal from './PushPermissionModal'

/**
 * Push Permission Test Component
 * Sadece development için - production'da kullanılmayacak
 */
export default function PushPermissionTest() {
  const [showModal, setShowModal] = useState(false)
  const [status, setStatus] = useState(getPushPermissionStatus())

  const refreshStatus = () => {
    setStatus(getPushPermissionStatus())
  }

  const testShowModal = () => {
    if (shouldShowPushModal()) {
      setShowModal(true)
    } else {
      alert('Modal gösterilemez: ' + status.reason)
    }
  }

  return (
    <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
      <h3 className="text-lg font-bold mb-4 text-gray-900">🧪 Push Permission Test Panel</h3>
      
      {/* Status */}
      <div className="bg-white p-4 rounded-lg mb-4">
        <h4 className="font-semibold mb-2">📊 Mevcut Durum:</h4>
        <div className="text-sm space-y-1">
          <p><strong>Can Show:</strong> {status.canShow ? '✅ Evet' : '❌ Hayır'}</p>
          <p><strong>Reason:</strong> {status.reason}</p>
          {status.deniedUntil && (
            <p><strong>Denied Until:</strong> {status.deniedUntil.toLocaleString('tr-TR')}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={testShowModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          🔔 Modal'ı Test Et
        </button>
        
        <button
          onClick={() => { resetPushPermissionState(); refreshStatus(); }}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm"
        >
          🔄 Durumu Sıfırla
        </button>
        
        <button
          onClick={() => { denyPushForFiveDays(); refreshStatus(); }}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm"
        >
          ⏰ 5 Gün Ertele
        </button>
        
        <button
          onClick={() => { denyPushPermanently(); refreshStatus(); }}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
        >
          🚫 Kalıcı Reddet
        </button>
        
        <button
          onClick={() => { markPushPermissionGranted(); refreshStatus(); }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
        >
          ✅ İzin Verildi İşaretle
        </button>
        
        <button
          onClick={refreshStatus}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
        >
          🔍 Durumu Yenile
        </button>
      </div>

      {/* localStorage Debug */}
      <div className="bg-white p-4 rounded-lg text-xs">
        <h4 className="font-semibold mb-2">🗄️ localStorage Debug:</h4>
        <div className="space-y-1 font-mono text-gray-600">
          <p>push_permission_denied_until: {localStorage.getItem('push_permission_denied_until') || 'null'}</p>
          <p>push_permission_permanently_denied: {localStorage.getItem('push_permission_permanently_denied') || 'null'}</p>
          <p>push_permission_granted: {localStorage.getItem('push_permission_granted') || 'null'}</p>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <PushPermissionModal onClose={() => { setShowModal(false); refreshStatus(); }} />
      )}
    </div>
  )
}