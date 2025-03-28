"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ResearchProgressProps {
  status: string
  progress: number
  isComplete?: boolean
  points?: number
}

export function ResearchProgress({ status, progress, isComplete = false, points = 0 }: ResearchProgressProps) {
  const [showAnimation, setShowAnimation] = useState(true)

  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        setShowAnimation(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isComplete])

  return (
    <Card className="overflow-hidden">
      <CardHeader className={isComplete ? "bg-primary/10 pb-4" : "pb-4"}>
        <CardTitle>{isComplete ? "Research Complete!" : "Research in Progress"}</CardTitle>
        <CardDescription>
          {isComplete
            ? `You earned ${points} points! Check your rank on the Treederboard →`
            : "Our AI is researching this tree species"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {!isComplete && (
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">{status}</span>
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{isComplete ? "Completed" : "Progress"}</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-500 ${isComplete ? "bg-green-500" : "bg-primary"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {isComplete && (
          <div className="mt-4 rounded-lg border p-3 bg-muted/50">
            <p className="text-sm">
              Thank you for funding this research! The species page has been updated with new information.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

