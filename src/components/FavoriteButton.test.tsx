import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import FavoriteButton from './FavoriteButton'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock Supabase client (hoist-safe)
const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(),
  auth: {
    getUser: vi.fn()
  }
}))

vi.mock('../lib/supabaseClient', () => ({
  supabase: mockSupabase
}))

describe('FavoriteButton', () => {
  const mockListingId = 'test-listing-id'
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockResolvedValue({ data: [], error: null })
    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq
    })

    render(
      <BrowserRouter>
        <FavoriteButton listingId={mockListingId} />
      </BrowserRouter>
    )

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Favori')).toBeInTheDocument()
    })
  })

  it('shows "Favoride" when listing is favorited', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null })
    // Zincir: select('id').eq('listing_id', ...).eq('user_id', ...).limit(1)
    const chain = {
      eq: vi.fn()
    } as any
    chain.limit = vi.fn().mockResolvedValue({ data: [{ id: 'favorite-id' }], error: null })
    const chainAfterFirstEq = { ...chain }
    const chainAfterSecondEq = { ...chain }
    chain.eq.mockReturnValueOnce(chainAfterFirstEq).mockReturnValueOnce(chainAfterSecondEq)
    const select = vi.fn().mockReturnValue(chain)
    mockSupabase.from.mockReturnValue({ select })

    render(
      <BrowserRouter>
        <FavoriteButton listingId={mockListingId} />
      </BrowserRouter>
    )

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Favoride')).toBeInTheDocument()
    })
  })

  it('adds to favorites when clicked and not already favorited', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null })
    const mockSelect = vi.fn().mockReturnThis()
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    const mockEq = vi.fn().mockResolvedValue({ data: [], error: null })
    
    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      eq: mockEq
    })

    render(
      <BrowserRouter>
        <FavoriteButton listingId={mockListingId} />
      </BrowserRouter>
    )

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Favori')).toBeInTheDocument()
    })

    const button = screen.getByText('Favori')
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        listing_id: mockListingId,
        user_id: 'user-id'
      })
    })
  })

  it('removes from favorites when clicked and already favorited', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null })
    // İlk yükleme için favoride olduğunu gösteren zincir
    const loadChain = {
      eq: vi.fn()
    } as any
    loadChain.limit = vi.fn().mockResolvedValue({ data: [{ id: 'favorite-id' }], error: null })
    const loadChainEq1 = { ...loadChain }
    const loadChainEq2 = { ...loadChain }
    loadChain.eq.mockReturnValueOnce(loadChainEq1).mockReturnValueOnce(loadChainEq2)
    const select = vi.fn().mockReturnValue(loadChain)

    // Silme akışı için zincir: delete().eq(...).eq(...)
    const deleteEqSecond = vi.fn().mockResolvedValue({ error: null })
    const deleteEqFirst = vi.fn().mockReturnValue({ eq: deleteEqSecond })
    const deleter = vi.fn().mockReturnValue({ eq: deleteEqFirst })

    mockSupabase.from.mockReturnValue({
      select,
      delete: deleter
    })

    render(
      <BrowserRouter>
        <FavoriteButton listingId={mockListingId} />
      </BrowserRouter>
    )

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Favoride')).toBeInTheDocument()
    })

    const button = screen.getByText('Favoride')
    fireEvent.click(button)

    await waitFor(() => {
      expect(deleter).toHaveBeenCalled()
    })
  })

  it('redirects to login when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockResolvedValue({ data: [], error: null })
    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq
    })

    render(
      <BrowserRouter>
        <FavoriteButton listingId={mockListingId} />
      </BrowserRouter>
    )

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Favori')).toBeInTheDocument()
    })

    const button = screen.getByText('Favori')
    fireEvent.click(button)
    
    // Check that navigate was called to redirect to login
    expect(mockNavigate).toHaveBeenCalledWith('/giris')
  })
})