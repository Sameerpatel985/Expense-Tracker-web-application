"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id, duration: toast.duration ?? 5000 }

    setToasts(prev => [...prev, newToast])

    // Auto-remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`max-w-sm bg-white border rounded-lg shadow-lg p-4 flex items-start space-x-3 ${
            toast.type === 'success' ? 'border-green-200' :
            toast.type === 'error' ? 'border-red-200' :
            toast.type === 'warning' ? 'border-yellow-200' :
            'border-blue-200'
          }`}
        >
          <div className={`flex-shrink-0 ${
            toast.type === 'success' ? 'text-green-600' :
            toast.type === 'error' ? 'text-red-600' :
            toast.type === 'warning' ? 'text-yellow-600' :
            'text-blue-600'
          }`}>
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✕'}
            {toast.type === 'warning' && '⚠'}
            {toast.type === 'info' && 'ℹ'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{toast.title}</p>
            {toast.message && (
              <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
            )}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
