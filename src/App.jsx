import { useState, useEffect } from "react"
import { Dashboard } from "./components/Dashboard"
import { EditModeProvider } from "./components/EditModeProvider"
import { AdminModeProvider } from "./components/AdminModeProvider"
import { SetupWizard } from "./components/SetupWizard"
import { loadConfigSync } from "./lib/config"
import { initTypography } from "./lib/typographyLoader"
import "./index.css"

function App() {
  const [showSetup, setShowSetup] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load config
    const config = loadConfigSync()
    
    // Check if setup wizard has been completed
    // We check for a specific flag that's set when the wizard completes
    // This distinguishes between default config values and user-completed setup
    const setupCompleted = typeof window !== 'undefined' 
      ? localStorage.getItem('setupCompleted') === 'true'
      : false
    
    // Initialize typography (will use Inter as default if no config)
    initTypography(config)
    
    // Show setup if not completed, or if explicitly requested via URL param
    const urlParams = new URLSearchParams(window.location.search)
    const forceSetup = urlParams.get('setup') === 'true'
    
    setShowSetup(!setupCompleted || forceSetup)
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (showSetup) {
    return (
      <AdminModeProvider>
        <EditModeProvider>
          <SetupWizard 
            onComplete={async (config) => {
              // Mark setup as completed
              if (typeof window !== 'undefined') {
                localStorage.setItem('setupCompleted', 'true')
              }
              // Reload config after setup completes
              const updatedConfig = loadConfigSync()
              initTypography(updatedConfig)
              setShowSetup(false)
            }} 
          />
        </EditModeProvider>
      </AdminModeProvider>
    )
  }

  return (
    <AdminModeProvider>
      <EditModeProvider>
        <Dashboard />
      </EditModeProvider>
    </AdminModeProvider>
  )
}

export default App
