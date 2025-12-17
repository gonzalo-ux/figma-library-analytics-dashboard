import React, { createContext, useContext, useState } from 'react'

const AdminModeContext = createContext()

export function AdminModeProvider({ children }) {
  const [isAdminMode, setIsAdminMode] = useState(false)

  const toggleAdminMode = () => {
    setIsAdminMode(prev => !prev)
  }

  const value = {
    isAdminMode,
    toggleAdminMode,
  }

  return (
    <AdminModeContext.Provider value={value}>
      {children}
    </AdminModeContext.Provider>
  )
}

export function useAdminMode() {
  const context = useContext(AdminModeContext)
  if (!context) {
    throw new Error('useAdminMode must be used within AdminModeProvider')
  }
  return context
}

