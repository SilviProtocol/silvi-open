import { Navbar } from "@/components/navbar";

// Sample data for the leaderboard
const leaderboardData = [
  { id: 1, rank: 1, username: "ForestGuardian", wallet: "0x71C...a3F2", score: 1250 },
  { id: 2, rank: 2, username: "EcoWarrior", wallet: "0x89B...e7D4", score: 980 },
  { id: 3, rank: 3, username: "GreenThumb", wallet: "0x45A...c8E1", score: 840 },
  { id: 4, rank: 4, username: "TreeHugger", wallet: "0x32F...b9C5", score: 720 },
  { id: 5, rank: 5, username: "EarthDefender", wallet: "0x67D...a1B8", score: 650 },
  { id: 6, rank: 6, username: "PlantPioneer", wallet: "0x91C...d4E7", score: 580 },
  { id: 7, rank: 7, username: "CarbonCrusader", wallet: "0x25E...f7G3", score: 510 },
  { id: 8, rank: 8, username: "BiodiversityBuilder", wallet: "0x78H...j2K9", score: 470 },
  { id: 9, rank: 9, username: "ReforestationRanger", wallet: "0x36L...m5N1", score: 420 },
  { id: 10, rank: 10, username: "ClimateChampion", wallet: "0x59P...r8S6", score: 390 },
  { id: 11, rank: 11, username: "SeedSpreader", wallet: "0x44T...k2R8", score: 355 },
  { id: 12, rank: 12, username: "WildlifeWarden", wallet: "0x62U...s9V1", score: 320 },
  { id: 13, rank: 13, username: "EcosystemEngineer", wallet: "0x73W...z4X7", score: 290 },
  { id: 14, rank: 14, username: "GreenhouseGuru", wallet: "0x81Y...a6Z3", score: 265 },
  { id: 15, rank: 15, username: "RainforestRevivalist", wallet: "0x19B...c8D5", score: 240 },
  { id: 16, rank: 16, username: "BotanicalExplorer", wallet: "0x27F...e0G9", score: 215 },
  { id: 17, rank: 17, username: "PollutionPreventer", wallet: "0x35H...g2J4", score: 190 },
  { id: 18, rank: 18, username: "OxygenOptimizer", wallet: "0x53K...i4L6", score: 165 },
  { id: 19, rank: 19, username: "ArborealAdvocate", wallet: "0x71M...k6N2", score: 140 },
  { id: 20, rank: 20, username: "SustainabilitySteward", wallet: "0x89P...m8Q7", score: 115 },
];

export default function TreederboardPage() {
  return (
    <main className="min-h-screen text-white">
      {/* Remove background overlay */}
      
      <Navbar />
      <div className="relative min-h-screen flex flex-col z-10">
        {/* Modern header section */}
        <div className="max-w-6xl mx-auto pt-20 pb-8 px-4 w-full">
          <div className="mb-6 text-center">
            <h1 className="relative inline-block text-2xl md:text-5xl font-medium tracking-tight mb-8">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-green-200 to-teal-300 animate-gradient-x">Treederboard</span>
              <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>
            </h1>
            <div className="mb-2">
              <p className="text-gray-300 max-w-3xl mx-auto text-lg opacity-80 font-light">
                This leaderboard showcases our top contributors. Rankings are based on the score earned for Research funding and social media shares.
              </p>
            </div>
          </div>
        </div>
        
        {/* Leaderboard section - similar to search results in species page */}
        <div className="flex-1 mx-auto w-full max-w-6xl px-4 mb-6 -mt-2">
          <div className="mb-2">
            <h2 className="text-xl font-semibold text-white sticky top-0">
              Top Contreebutors
              <span className="ml-2 bg-green-600/80 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                LIVE RANKINGS
              </span>
            </h2>
            
            {/* CTA section moved to top of table */}
            <div className="mt-3 mb-3 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <div className="flex items-center justify-between">
                <p className="text-gray-300 text-sm pl-2 pr-4">
                  Join our community efforts to see your name on the Treederboard!
                </p>
                <div className="flex space-x-4">
                  {/* Neomorphic Fund Research button */}
                  <button className="bg-emerald-800/30 text-emerald-300 font-medium py-2 px-5 rounded-lg
                    transition-all duration-300 shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.2),inset_2px_2px_5px_rgba(255,255,255,0.1)]
                    hover:shadow-[inset_-1px_-1px_3px_rgba(0,0,0,0.2),inset_1px_1px_3px_rgba(255,255,255,0.1)]
                    active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.1)]
                    active:translate-y-[1px]">
                    Fund Research
                  </button>
                  
                  {/* Neomorphic Share on X button */}
                  <button className="bg-zinc-800/40 text-white font-medium py-2 px-5 rounded-lg
                    transition-all duration-300 shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.2),inset_2px_2px_5px_rgba(255,255,255,0.1)]
                    hover:shadow-[inset_-1px_-1px_3px_rgba(0,0,0,0.2),inset_1px_1px_3px_rgba(255,255,255,0.1)]
                    active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.1)]
                    active:translate-y-[1px]
                    flex items-center">
                    Share on <span className="ml-1 font-bold">𝕏</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 overflow-auto max-h-[432px]">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-16">
                    Rank
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Wallet
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-24">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {leaderboardData.map((entry) => (
                  <tr 
                    key={entry.id} 
                    className={`hover:bg-white/10 transition-colors ${
                      entry.rank === 1 ? "border-l-4 border-yellow-500" : 
                      entry.rank === 2 ? "border-l-4 border-gray-400" : 
                      entry.rank === 3 ? "border-l-4 border-amber-700" : ""
                    }`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className={`text-base font-bold ${
                        entry.rank === 1 ? "text-yellow-500" : 
                        entry.rank === 2 ? "text-gray-400" : 
                        entry.rank === 3 ? "text-amber-700" : "text-gray-400"
                      }`}>
                        {entry.rank}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{entry.username}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-sm text-xs font-medium text-gray-300">
                        {entry.wallet}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-base font-bold text-green-400">{entry.score}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}