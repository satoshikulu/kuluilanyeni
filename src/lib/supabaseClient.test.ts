import { describe, it, expect, vi } from 'vitest'
import { supabase, SUPABASE_READY } from './supabaseClient'

describe('supabaseClient', () => {
  it('should export supabase client', () => {
    expect(supabase).toBeDefined()
  })

  it('should define SUPABASE_READY', () => {
    // SUPABASE_READY depends on environment variables
    expect(typeof SUPABASE_READY).toBe('boolean')
  })
})