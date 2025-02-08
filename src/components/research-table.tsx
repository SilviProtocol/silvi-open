"use client"

import { useResearchContext } from "@/context/research-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const researchData = [
  { label: "Best Practices", key: "bestPractices" },
  { label: "Common Countries", key: "commonCountries" },
  { label: "Ecoregions", key: "ecoregions" },
  { label: "Bioregions", key: "bioregions" },
  { label: "Biome", key: "biome" },
  { label: "Ecological Functions", key: "ecologicalFunctions" },
  { label: "Elevation Ranges/Mean/Average", key: "elevationRanges" },
  { label: "Soil Types", key: "soilTypes" },
  { label: "Conservation Status", key: "conservationStatus" },
]

export function ResearchTable() {



  return (
    <div className="h-full flex flex-col bg-white  rounded-xl">
      <h2 className="text-xl font-semibold mb-4 sticky top-0">
        Research: {}
      </h2>
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3 ">Attribute</TableHead>
              <TableHead className="">Information</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {researchData.map((item) => (
              <TableRow key={item.key}>
                <TableCell className="font-medium">{item.label}</TableCell>
                <TableCell className="">{ "Data not available"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

