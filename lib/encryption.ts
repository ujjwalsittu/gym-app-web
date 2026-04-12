// Client-side E2E encryption for sensitive media (photos/videos)
// Uses Web Crypto API for AES-GCM encryption

export class MediaEncryption {
  private static algorithm = 'AES-GCM'
  private static keyLength = 256

  // Generate a new encryption key for the user
  static async generateKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: this.algorithm, length: this.keyLength },
      true, // extractable
      ['encrypt', 'decrypt']
    )
  }

  // Export key to storable format
  static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key)
    return Buffer.from(exported).toString('base64')
  }

  // Import key from stored format
  static async importKey(keyString: string): Promise<CryptoKey> {
    const keyBuffer = Buffer.from(keyString, 'base64')
    return crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: this.algorithm, length: this.keyLength },
      true,
      ['encrypt', 'decrypt']
    )
  }

  // Encrypt file data
  static async encrypt(data: ArrayBuffer, key: CryptoKey): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
      { name: this.algorithm, iv },
      key,
      data
    )
    return { encrypted, iv }
  }

  // Decrypt file data
  static async decrypt(encryptedData: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<ArrayBuffer> {
    return crypto.subtle.decrypt(
      { name: this.algorithm, iv },
      key,
      encryptedData
    )
  }

  // Encrypt a File object
  static async encryptFile(file: File, key: CryptoKey): Promise<{ blob: Blob; iv: string }> {
    const arrayBuffer = await file.arrayBuffer()
    const { encrypted, iv } = await this.encrypt(arrayBuffer, key)
    return {
      blob: new Blob([encrypted], { type: 'application/octet-stream' }),
      iv: Buffer.from(iv).toString('base64')
    }
  }

  // Decrypt to Blob
  static async decryptToBlob(encryptedBlob: Blob, key: CryptoKey, ivString: string, mimeType: string): Promise<Blob> {
    const iv = new Uint8Array(Buffer.from(ivString, 'base64'))
    const encryptedData = await encryptedBlob.arrayBuffer()
    const decrypted = await this.decrypt(encryptedData, key, iv)
    return new Blob([decrypted], { type: mimeType })
  }

  // Store encryption key securely in IndexedDB (client-side only)
  static async storeKeyLocally(userId: string, key: CryptoKey): Promise<void> {
    const keyString = await this.exportKey(key)
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('visionaryfit_keys', 1)
      
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys', { keyPath: 'userId' })
        }
      }
      
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('keys', 'readwrite')
        const store = tx.objectStore('keys')
        store.put({ userId, key: keyString })
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  // Retrieve encryption key from IndexedDB
  static async getKeyLocally(userId: string): Promise<CryptoKey | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('visionaryfit_keys', 1)
      
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys', { keyPath: 'userId' })
        }
      }
      
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('keys', 'readonly')
        const store = tx.objectStore('keys')
        const getRequest = store.get(userId)
        
        getRequest.onsuccess = async () => {
          if (getRequest.result) {
            const key = await this.importKey(getRequest.result.key)
            resolve(key)
          } else {
            resolve(null)
          }
        }
        getRequest.onerror = () => reject(getRequest.error)
      }
      
      request.onerror = () => reject(request.error)
    })
  }
}

// Generate a hash of the encryption key for server-side verification
export async function hashKey(keyString: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(keyString)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Buffer.from(hashBuffer).toString('base64')
}
