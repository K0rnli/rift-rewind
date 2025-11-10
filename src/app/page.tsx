"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const REGIONS = [
  { value: "na1", label: "NA" },
  { value: "euw1", label: "EUW" },
  { value: "eun1", label: "EUNE" },
  { value: "kr", label: "KR" },
  { value: "br1", label: "BR" },
  { value: "la1", label: "LAN" },
  { value: "la2", label: "LAS" },
  { value: "oc1", label: "OCE" },
  { value: "ru", label: "RU" },
  { value: "tr1", label: "TR" },
  { value: "jp1", label: "JP" },
  { value: "ph2", label: "PH" },
  { value: "sg2", label: "SG" },
  { value: "th2", label: "TH" },
  { value: "tw2", label: "TW" },
  { value: "vn2", label: "VN" },
]

export default function Home() {
  const [playerName, setPlayerName] = useState("")
  const [region, setRegion] = useState("na1")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (playerName.trim()) {
      // Navigate to profile page with the player name and region
      router.push(`/profile/${region}/${encodeURIComponent(playerName.trim())}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
            Champ Diff
          </h1>
          <p className="text-xl text-slate-300">
            Look up any League of Legends player
          </p>
        </div>

        {/* Search Card */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Player Lookup</CardTitle>
            <CardDescription className="text-slate-400">
              Enter a summoner name and select a region to view their profile and match history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Player#Tagline"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="pl-10 h-12 text-lg bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                  />
                </div>
                <Select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="h-12 w-32 bg-slate-900/50 border-slate-600 text-white focus:border-blue-500"
                >
                  {REGIONS.map((reg) => (
                    <option key={reg.value} value={reg.value} className="bg-slate-800">
                      {reg.label}
                    </option>
                  ))}
                </Select>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Search
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center text-slate-400 text-sm">
          <p>Search for players across all regions</p>
        </div>
      </div>
    </div>
  )
}

