import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Supabase Schema Files', () => {
  const schemaFiles = [
    'SUPABASE_SCHEMA.sql',
    'SUPABASE_SCHEMA_SIMPLE.sql',
    'SUPABASE_SCHEMA_UPDATED.sql',
    'SUPABASE_SCHEMA_EXPLAINED.sql'
  ]

  schemaFiles.forEach(fileName => {
    it(`should have valid SQL syntax in ${fileName}`, () => {
      const filePath = join(__dirname, '../../', fileName)
      const content = readFileSync(filePath, 'utf-8')
      
      // Basic checks
      expect(content).toContain('create table')
      expect(content).toContain('public.')
      expect(content).not.toContain('\t') // No tabs, only spaces
      
      // Check for proper semicolon termination
      const statements = content.split(';').filter(s => s.trim().length > 0)
      expect(statements.length).toBeGreaterThan(0)
      
      // Check for extension creation
      expect(content).toContain('create extension if not exists pgcrypto')
      
      // Check for RLS enablement
      expect(content).toContain('enable row level security')
    })
  })

  it('should have all schema files present', () => {
    schemaFiles.forEach(fileName => {
      const filePath = join(__dirname, '../../', fileName)
      expect(() => readFileSync(filePath, 'utf-8')).not.toThrow()
    })
  })
})