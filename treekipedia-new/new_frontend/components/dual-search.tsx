"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SearchAutocomplete } from "@/components/search-autocomplete"

export function DualSearch() {
  const [commonNameValue, setCommonNameValue] = useState("")
  const [scientificNameValue, setScientificNameValue] = useState("")
  const router = useRouter()

  const handleSearch = () => {
    if (commonNameValue) {
      router.push(`/species/${commonNameValue}`)
    } else if (scientificNameValue) {
      router.push(`/species/${scientificNameValue}`)
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <SearchAutocomplete placeholder="Search Common Name" field="common_name" />
        <SearchAutocomplete placeholder="Search Scientific Name" field="accepted_scientific_name" />
      </div>
      <p className="text-xs text-white/70 text-center">Try searching for "Oak", "Maple", or "Sequoia"</p>
    </div>
  )
}

