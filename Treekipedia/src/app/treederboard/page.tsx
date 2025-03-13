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
];

export default function TreederboardPage() {
  return (
    <main className="min-h-screen bg-black text-white relative">
      {/* Background with adjusted opacity */}
      <div 
        className="absolute inset-0 w-full h-full z-0 opacity-50"
        style={{
          backgroundColor: '#000',
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      <Navbar />
      <div className="container mx-auto px-4 py-20 relative z-10">
        {/* Header section - centered */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
            Treederboard
          </h1>
          <p className="text-gray-300 max-w-3xl mx-auto">
            This leaderboard showcases our top contributors. Rankings are based on the score earned for Research funding and social media shares.
          </p>
        </div>
        
        {/* Leaderboard Table with glassy styling */}
        <div className="max-w-4xl mx-auto backdrop-blur-md bg-zinc-900/40 border border-zinc-800/50 rounded-xl overflow-hidden shadow-2xl">
          <div className="px-6 py-5 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/60">
            <h2 className="text-xl font-bold text-white">Top Contributors</h2>
            <div className="bg-green-600/80 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
              LIVE RANKINGS
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800/30">
              <thead className="bg-zinc-900/50">
                <tr>
                  <th scope="col" className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-16">
                    Rank
                  </th>
                  <th scope="col" className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Wallet
                  </th>
                  <th scope="col" className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-24">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30 bg-zinc-900/30">
                {leaderboardData.map((entry) => (
                  <tr 
                    key={entry.id} 
                    className={`hover:bg-zinc-800/50 transition-colors ${
                      entry.rank === 1 ? "bg-gradient-to-r from-zinc-900/40 to-zinc-900/20 border-l-4 border-yellow-500" : 
                      entry.rank === 2 ? "bg-gradient-to-r from-zinc-900/40 to-zinc-900/20 border-l-4 border-gray-400" : 
                      entry.rank === 3 ? "bg-gradient-to-r from-zinc-900/40 to-zinc-900/20 border-l-4 border-amber-700" : ""
                    }`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`text-lg font-bold ${
                        entry.rank === 1 ? "text-yellow-500" : 
                        entry.rank === 2 ? "text-gray-400" : 
                        entry.rank === 3 ? "text-amber-700" : "text-gray-400"
                      }`}>
                        {entry.rank}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{entry.username}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-800/70 backdrop-blur-sm text-xs font-medium text-gray-300">
                        {entry.wallet}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-green-400">{entry.score}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-zinc-900/60 backdrop-blur-md px-6 py-4 border-t border-zinc-800/50">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-4">
                Join our community efforts to see your name on the Treederboard!
              </p>
              <div className="flex justify-center space-x-4">
                <button className="bg-green-600/90 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg transition-colors backdrop-blur-sm">
                  Fund Research
                </button>
                <button className="bg-zinc-800/80 hover:bg-zinc-700/90 text-white font-bold py-2 px-5 rounded-lg transition-colors flex items-center backdrop-blur-sm">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                  </svg>
                  Share on X
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 