import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { SetupStep1 } from './SetupStep1'
import { SetupStep2 } from './SetupStep2'
import { SetupStep3 } from './SetupStep3'
import { CheckCircle2, Circle } from 'lucide-react'
import { savePreferences } from '../lib/preferences'
import { initTypography } from '../lib/typographyLoader'
import { loadTheme } from '../lib/themeLoader'

export function SetupWizard({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [config, setConfig] = useState({
    figma: {
      accessToken: '',
      libraryUrl: ''
    },
    theme: {
      preset: 'blue',
      customCss: '',
      typography: {
        fontFamily: 'Inter',
        fontWeights: '300;400;500;600;700'
      }
    }
  })

  const steps = [
    { number: 1, title: 'Figma Credentials' },
    { number: 2, title: 'Theme Selection' },
    { number: 3, title: 'Typography' }
  ]

  const handleStepComplete = async (stepData) => {
    const updatedConfig = { ...config, ...stepData }
    setConfig(updatedConfig)
    
    // Apply theme and typography immediately for preview
    if (stepData.theme) {
      if (stepData.theme.preset) {
        loadTheme(stepData.theme.preset)
      }
      if (stepData.theme.typography) {
        initTypography(updatedConfig)
      }
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      // All steps complete - save preferences and finish
      await savePreferences(updatedConfig)
      onComplete?.(updatedConfig)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Welcome to Figma Analytics Dashboard</CardTitle>
          <CardDescription>Let's set up your dashboard in a few simple steps.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  {currentStep > step.number ? (
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  ) : currentStep === step.number ? (
                    <Circle className="h-8 w-8 text-primary fill-primary" />
                  ) : (
                    <Circle className="h-8 w-8 text-muted-foreground" />
                  )}
                  <span className={`text-xs mt-2 ${currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.number ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[400px]">
            {currentStep === 1 && (
              <SetupStep1
                config={config}
                onNext={(data) => handleStepComplete(data)}
              />
            )}
            {currentStep === 2 && (
              <SetupStep2
                config={config}
                onNext={(data) => handleStepComplete(data)}
                onBack={handleBack}
              />
            )}
            {currentStep === 3 && (
              <SetupStep3
                config={config}
                onComplete={(data) => {
                  handleStepComplete(data)
                }}
                onBack={handleBack}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
