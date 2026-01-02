// iOS PWA için kalıcı storage çözümü
// localStorage + IndexedDB + sessionStorage kombinasyonu

interface StorageData {
  user: any
  timestamp: number
  version: string
}

const STORAGE_KEY = 'kulu_ilan_user'
const STORAGE_VERSION = '1.0'
const EXPIRY_DAYS = 30

// IndexedDB helper functions
class PersistentStorage {
  private dbName = 'KuluIlanDB'
  private storeName = 'userStore'
  private version = 1

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' })
        }
      }
    })
  }

  async setItem(key: string, value: any): Promise<void> {
    try {
      const data: StorageData = {
        user: value,
        timestamp: Date.now(),
        version: STORAGE_VERSION
      }

      // 1. localStorage'a kaydet (hızlı erişim için)
      localStorage.setItem(key, JSON.stringify(data))
      
      // 2. sessionStorage'a kaydet (tab içi persistence için)
      sessionStorage.setItem(key, JSON.stringify(data))

      // 3. IndexedDB'ye kaydet (iOS PWA için kalıcı)
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put({ key, data })
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      console.log('✅ User data saved to all storage methods')
    } catch (error) {
      console.error('❌ Storage save error:', error)
      // Fallback to localStorage only
      localStorage.setItem(key, JSON.stringify({
        user: value,
        timestamp: Date.now(),
        version: STORAGE_VERSION
      }))
    }
  }

  async getItem(key: string): Promise<any> {
    try {
      // 1. Önce localStorage'dan dene (en hızlı)
      let dataStr = localStorage.getItem(key)
      if (dataStr) {
        const data: StorageData = JSON.parse(dataStr)
        if (this.isValidData(data)) {
          console.log('✅ User data loaded from localStorage')
          return data.user
        }
      }

      // 2. sessionStorage'dan dene
      dataStr = sessionStorage.getItem(key)
      if (dataStr) {
        const data: StorageData = JSON.parse(dataStr)
        if (this.isValidData(data)) {
          console.log('✅ User data loaded from sessionStorage')
          // localStorage'a geri kaydet
          localStorage.setItem(key, dataStr)
          return data.user
        }
      }

      // 3. IndexedDB'den dene (iOS PWA için)
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      
      const result = await new Promise<any>((resolve, reject) => {
        const request = store.get(key)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      if (result && result.data && this.isValidData(result.data)) {
        console.log('✅ User data loaded from IndexedDB (iOS PWA recovery)')
        // Diğer storage'lara geri kaydet
        const dataStr = JSON.stringify(result.data)
        localStorage.setItem(key, dataStr)
        sessionStorage.setItem(key, dataStr)
        return result.data.user
      }

      console.log('ℹ️ No valid user data found in any storage')
      return null
    } catch (error) {
      console.error('❌ Storage read error:', error)
      return null
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      // Tüm storage'lardan sil
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)

      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      console.log('✅ User data removed from all storage methods')
    } catch (error) {
      console.error('❌ Storage remove error:', error)
      // Fallback
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    }
  }

  private isValidData(data: StorageData): boolean {
    if (!data || !data.user || !data.timestamp || !data.version) {
      return false
    }

    // Version check
    if (data.version !== STORAGE_VERSION) {
      console.log('⚠️ Storage version mismatch, clearing data')
      return false
    }

    // Expiry check (30 gün)
    const expiryTime = data.timestamp + (EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    if (Date.now() > expiryTime) {
      console.log('⚠️ User data expired, clearing')
      return false
    }

    return true
  }

  // iOS PWA detection
  isIOSPWA(): boolean {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone = (window.navigator as any).standalone === true
    return isIOS && isStandalone
  }

  // Storage health check
  async healthCheck(): Promise<void> {
    if (this.isIOSPWA()) {
      console.log('🍎 iOS PWA detected - using enhanced storage persistence')
    }

    try {
      // Test IndexedDB availability
      await this.openDB()
      console.log('✅ IndexedDB available')
    } catch (error) {
      console.warn('⚠️ IndexedDB not available:', error)
    }
  }
}

// Singleton instance
export const persistentStorage = new PersistentStorage()

// Helper functions for easy use
export async function saveUser(user: any): Promise<void> {
  return persistentStorage.setItem(STORAGE_KEY, user)
}

export async function getUser(): Promise<any> {
  return persistentStorage.getItem(STORAGE_KEY)
}

export async function removeUser(): Promise<void> {
  return persistentStorage.removeItem(STORAGE_KEY)
}

export async function initStorage(): Promise<void> {
  return persistentStorage.healthCheck()
}