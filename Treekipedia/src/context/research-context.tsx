"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import type { TreeSpecies } from "@/lib/types"

interface ResearchContextType {
  selectedSpecies: TreeSpecies | null
  setSelectedSpecies: (species: TreeSpecies | null) => void
}

const ResearchContext = createContext<ResearchContextType | undefined>(undefined)

export function ResearchProvider({ children }: { children: React.ReactNode }) {
  const [selectedSpecies, setSelectedSpecies] = useState<TreeSpecies | null>(null)

  return <ResearchContext.Provider value={{ selectedSpecies, setSelectedSpecies }}>{children}</ResearchContext.Provider>
}

export function useResearchContext() {
  const context = useContext(ResearchContext)
  if (context === undefined) {
    throw new Error("useResearchContext must be used within a ResearchProvider")
  }
  return context
}

