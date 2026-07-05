import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { getErrorMessage, useToast } from '../useToast.ts'

describe('getErrorMessage', () => {
  it('extracts message from Error instance', () => {
    const err = new Error('Something went wrong')
    expect(getErrorMessage(err)).toBe('Something went wrong')
  })

  it('returns string directly if input is a string', () => {
    expect(getErrorMessage('Network error')).toBe('Network error')
  })

  it('returns fallback for unknown types (null)', () => {
    expect(getErrorMessage(null)).toBe('Terjadi kesalahan')
  })

  it('returns custom fallback for unknown types', () => {
    expect(getErrorMessage(null, 'Gagal memuat data')).toBe('Gagal memuat data')
  })

  it('returns fallback for number input', () => {
    expect(getErrorMessage(404, 'Not found')).toBe('Not found')
  })

  it('returns fallback for object without message', () => {
    expect(getErrorMessage({}, 'Unexpected error')).toBe('Unexpected error')
  })

  it('uses Error.message even when fallback is provided', () => {
    const err = new Error('Real error')
    expect(getErrorMessage(err, 'Fallback')).toBe('Real error')
  })

  it('returns default fallback when none provided for unknown', () => {
    expect(getErrorMessage(undefined)).toBe('Terjadi kesalahan')
  })
})

describe('useToast', () => {
  vi.useFakeTimers()

  function clearAllToasts() {
    // Access module-level toasts via useSyncExternalStore hook
    const { result } = renderHook(() => useToast())
    // Remove persistent toasts (duration: 0) and any remaining
    act(() => {
      for (const t of [...result.current.toasts]) {
        result.current.removeToast(t.id)
      }
    })
  }

  beforeEach(() => {
    vi.runAllTimers()
    clearAllToasts()
  })

  it('returns empty toasts array initially', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current.toasts).toHaveLength(0)
  })

  it('adds a success toast with default type', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast('Produk tersimpan')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('Produk tersimpan')
    expect(result.current.toasts[0].type).toBe('success')
  })

  it('adds a toast with explicit error type', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast('Gagal menyimpan', 'error')
    })

    expect(result.current.toasts[0].type).toBe('error')
  })

  it('adds a toast with info type', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast('Informasi', 'info')
    })

    expect(result.current.toasts[0].type).toBe('info')
  })

  it('adds a toast with warning type', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast('Perhatian', 'warning')
    })

    expect(result.current.toasts[0].type).toBe('warning')
  })

  it('adds a toast with ToastOptions object', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        message: 'Custom toast',
        type: 'error',
        title: 'Error Title',
      })
    })

    expect(result.current.toasts[0].message).toBe('Custom toast')
    expect(result.current.toasts[0].title).toBe('Error Title')
    expect(result.current.toasts[0].type).toBe('error')
  })

  it('removes toast by id', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast('Test message')
    })

    const id = result.current.toasts[0].id

    act(() => {
      result.current.removeToast(id)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('auto-removes toast after default duration (3500ms)', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast('Temporary message')
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(3500)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('apiError creates persistent error toast (duration 0)', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.apiError(new Error('API failure'))
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].type).toBe('error')
    expect(result.current.toasts[0].message).toBe('API failure')

    // Advance timers — should NOT auto-remove
    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(result.current.toasts).toHaveLength(1)
  })

  it('apiError uses fallback message for non-Error', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.apiError('string error', 'Gagal memuat')
    })

    expect(result.current.toasts[0].message).toBe('string error')
  })

  it('apiError attaches retry action when retry callback provided', () => {
    const retryFn = vi.fn()
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.apiError(new Error('Server error'), undefined, retryFn)
    })

    const toast = result.current.toasts[0]
    expect(toast.action).toBeDefined()
    expect(toast.action!.label).toBe('Coba Lagi')

    // Click the retry action
    act(() => {
      toast.action!.onClick()
    })

    expect(retryFn).toHaveBeenCalledOnce()
  })

  it('apiError without retry has no action', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.apiError(new Error('Error'))
    })

    expect(result.current.toasts[0].action).toBeUndefined()
  })

  it('supports custom duration via ToastOptions', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        message: 'Quick toast',
        duration: 1000,
      })
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('removing a non-existent toast does nothing', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.removeToast('nonexistent-id')
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('assigns unique incremental ids to toasts', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast('First')
      result.current.toast('Second')
    })

    const ids = result.current.toasts.map((t) => t.id)
    expect(ids[0]).not.toBe(ids[1])
  })
})
