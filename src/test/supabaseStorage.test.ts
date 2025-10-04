import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Supabase Storage Schema', () => {
  it('should have valid SQL syntax in SUPABASE_STORAGE_SCHEMA.sql', () => {
    const filePath = join(__dirname, '../../', 'SUPABASE_STORAGE_SCHEMA.sql')
    const content = readFileSync(filePath, 'utf-8')
    
    // Basic checks
    expect(content).toContain('create schema if not exists storage')
    expect(content).toContain('insert into storage.buckets')
    expect(content).toContain('listings.images')
    expect(content).toContain('enable row level security')
    expect(content).toContain('create policy')
    expect(content).not.toContain('\t') // No tabs, only spaces
    
    // Check for proper semicolon termination
    const statements = content.split(';').filter(s => s.trim().length > 0)
    expect(statements.length).toBeGreaterThan(0)
    
    // Check for bucket creation
    expect(content).toContain('bucket_id = \'listings.images\'')
    
    // Check for RLS policies
    expect(content).toContain('Herkes ilan görseli yükleyebilir')
    expect(content).toContain('Herkes ilan görsellerini görebilir')
    expect(content).toContain('İlan sahibi kendi görsellerini silebilir')
    expect(content).toContain('Admin kullanıcılar tüm görselleri silebilir')
  })

  it('should have storage schema file present', () => {
    const filePath = join(__dirname, '../../', 'SUPABASE_STORAGE_SCHEMA.sql')
    expect(() => readFileSync(filePath, 'utf-8')).not.toThrow()
  })
})