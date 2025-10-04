import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Supabase Storage Troubleshooting Guide', () => {
  it('should have valid markdown syntax', () => {
    const filePath = join(__dirname, '../../', 'SUPABASE_STORAGE_TROUBLESHOOTING.md')
    const content = readFileSync(filePath, 'utf-8')
    
    // Basic checks
    expect(content).toContain('# Supabase Storage Sorun Giderme Rehberi')
    expect(content).toContain('## Yaygın Sorunlar ve Çözümleri')
    expect(content).toContain('```sql')
    expect(content).toContain('```javascript')
    expect(content).not.toContain('\t') // No tabs, only spaces
    
    // Check for common sections
    expect(content).toContain('Storage Bucket Oluşturma Sorunu')
    expect(content).toContain('Görsel Yükleme İzni Hatası')
    expect(content).toContain('Görseller Görüntülenemiyor')
    
    // Check for troubleshooting solutions
    expect(content).toContain('Supabase Dashboard')
    expect(content).toContain('SQL Editor')
  })

  it('should have troubleshooting guide file present', () => {
    const filePath = join(__dirname, '../../', 'SUPABASE_STORAGE_TROUBLESHOOTING.md')
    expect(() => readFileSync(filePath, 'utf-8')).not.toThrow()
  })
})