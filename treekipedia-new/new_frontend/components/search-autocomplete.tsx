"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { speciesAPI } from "@/lib/api"

interface SearchAutocompleteProps {
  placeholder: string
  field?: "common_name" | "accepted_scientific_name"
}

export function SearchAutocomplete({ placeholder, field }: SearchAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<
    Array<{
      value: string
      label: string
      scientificName?: string
    }>
  >([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query || query.length < 2) {
        setSuggestions([])
        return
      }

      setLoading(true)
      try {
        const results = await speciesAPI.getSuggestions(query, field)
        const formattedSuggestions = results.map((item) => ({
          value: item.taxon_id,
          label: item.common_name,
          scientificName: item.accepted_scientific_name,
        }))
        setSuggestions(formattedSuggestions)
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        // Don't show the error to the user, just reset suggestions
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimeout = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimeout)
  }, [query, field])

  const handleSelect = (currentValue: string) => {
    setValue(currentValue)
    setOpen(false)
    router.push(`/species/${currentValue}`)
  }

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-background"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="h-4 w-4 shrink-0 opacity-50" />
              <span className="truncate">
                {value ? suggestions.find((item) => item.value === value)?.label || placeholder : placeholder}
              </span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={placeholder} value={query} onValueChange={setQuery} />
            <CommandList>
              {loading && <div className="py-6 text-center text-sm">Loading suggestions...</div>}
              <CommandEmpty>No tree species found.</CommandEmpty>
              <CommandGroup>
                {suggestions.map((item) => (
                  <CommandItem key={item.value} value={item.value} onSelect={handleSelect}>
                    <div className="flex flex-col">
                      <span>{item.label}</span>
                      {item.scientificName && (
                        <span className="text-xs italic text-muted-foreground">{item.scientificName}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

