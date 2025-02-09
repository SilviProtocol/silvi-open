"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResearchData, ResearchPayload } from "@/lib/types";
import { UseMutationResult } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const tableMapping = [
  { label: "Native/Adapted Habitats", key: "native_adapted_habitats" },
  { label: "Stewardship Best Practices", key: "stewardship_best_practices" },
  { label: "Planting Methods", key: "planting_methods" },
  { label: "Ecological Function", key: "ecological_function" },
  { label: "Agroforestry Use Cases", key: "agroforestry_use_cases" },
  { label: "Elevation Ranges", key: "elevation_ranges" },
  { label: "Compatible Soil Types", key: "compatible_soil_types" },
  { label: "Conservation Status", key: "conservation_status" },
  { label: "Research Status", key: "research_status" },
];

interface ResearchTableProps {
  data?: ResearchData;
  isLoading: boolean;
  researchMutation: UseMutationResult<ResearchData, Error, ResearchPayload>;
}

export const ResearchTable: React.FC<ResearchTableProps> = ({
  data,
  isLoading,
  researchMutation,
}) => {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        Loading research data...
      </div>
    );
  }

  if (researchMutation.isPending) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-green-800" />
        AI Agent Researching...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center">
        No research data available
        <br />
        (Click research button to generate research data)
      </div>
    );
  }

  return (
    <div className="h-full p-4 flex flex-col bg-white rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Research: {data.taxon_id}</h2>
      <div className="flex-1 overflow-auto">
        <Table className="border rounded-lg">
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Attribute</TableHead>
              <TableHead>Information</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableMapping.map((item) => (
              <TableRow key={item.key}>
                <TableCell className="font-medium">{item.label}</TableCell>
                <TableCell className="whitespace-pre-wrap">
                  {data[item.key as keyof ResearchData] || "Data not available"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
