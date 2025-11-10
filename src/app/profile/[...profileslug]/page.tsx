"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Trophy, TrendingUp, Award, Clock, Coins, Play, Flame, Star, Shield, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ItemDisplay } from "@/components/itemDisplay"
import { ChampionDisplay } from "@/components/championDisplay"
import { PerkDisplay, PerkStyleDisplay } from "@/components/perkDisplay"
import { SummonerDisplay } from "@/components/summonerDisplay"
import { invokeLambda } from "@/app/actions/lambda"
import { getJsonFileFromS3, listObjectsInS3 } from "@/app/actions/s3"
const REGIONS: { [key: string]: string } = {
  na1: "NA",
  euw1: "EUW",
  eun1: "EUNE",
  kr: "KR",
  br1: "BR",
  la1: "LAN",
  la2: "LAS",
  oc1: "OCE",
  ru: "RU",
  tr1: "TR",
  jp1: "JP",
  ph2: "PH",
  sg2: "SG",
  th2: "TH",
  tw2: "TW",
  vn2: "VN",
}

// Mock data structure - replace with actual API calls
interface RankedStats {
  queueType: string;
  tier: string;
  rank: string;
  puuid: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}

interface Match {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  gameMode: string;
  queueId: number;
  championName: string;
  championId: number;
  teamPosition: string;
  individualPosition: string;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  goldEarned: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  visionScore: number;
  win: boolean;
  items: number[];
  summoner1Id: number;
  summoner2Id: number;
  perks: {
    "statPerks": {
      defense: number;
      flex: number;
      offense: number;
    },
    styles: {
      description: string,
      selections: {
        perk: number;
        var1: number;
        var2: number;
        var3: number;
      }[];
      style: number;
    }[]
  }
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  // Handle catch-all route: profileslug will be an array like ["na1", "PlayerName"]
  const profileslug = params?.profileslug
  const slugArray = Array.isArray(profileslug) ? profileslug : profileslug ? [profileslug] : []
  
  // If we have 2+ segments, first is region, second is player name
  // If we have 1 segment, it's the player name (default region to na1)
  let region = "na1"
  let playerName = ""
  
  if (slugArray.length >= 2) {
    region = slugArray[0]
    playerName = decodeURIComponent(slugArray[1])
  } else if (slugArray.length === 1) {
    // Check if first segment is a region code
    if (REGIONS[slugArray[0]]) {
      region = slugArray[0]
    } else {
      playerName = decodeURIComponent(slugArray[0])
    }
  }

  // Mock data - replace with actual API calls
  const [rankedSolo, setRankedSolo] = useState<RankedStats | null>(null)

  const [rankedFlex, setRankedFlex] = useState<RankedStats | null>(null)

  const [matchHistory, setMatchHistory] = useState<Match[]>([])

  useEffect(() => {
    // Load match history data
    const loadMatchHistory = async () => {
      try {
        // Load the example match data
        // Example Lambda invocation - replace with your actual function name and payload
        const lambdaResult = await invokeLambda(
          'fetch-match-history', // Replace with your actual Lambda function name
          {
            "riotId": playerName,
            "region": region,
            "count": "1"
          }
        )
        if (lambdaResult.statusCode === 200) {
          console.log("worked")
          let name = playerName.toLowerCase()
          console.log(name)
          let rankedData: RankedStats[] = await getJsonFileFromS3(`match-history/players/${name}/ranked/ranks.json`)
          for (const ranked of rankedData) {
            if (ranked.queueType === "RANKED_SOLO_5x5") {
              setRankedSolo(ranked)
            } else if (ranked.queueType === "RANKED_FLEX_SR") {
              setRankedFlex(ranked)
            }
          }
          
          // List all match files in the matches folder
          const matchFiles = await listObjectsInS3(`match-history/players/${name}/stats/`)
          
          // Filter out any non-JSON files and load all match data
          const jsonMatchFiles = matchFiles.filter(file => file.endsWith('.json'))
          const matchDataPromises = jsonMatchFiles.map(async (file) => {
            try {
              const data = await getJsonFileFromS3(file)
              // Handle both single match objects and arrays of matches
              return Array.isArray(data) ? data : [data]
            } catch (error) {
              console.error(`Error loading match file ${file}:`, error)
              return []
            }
          })
          const matchDataArray = await Promise.all(matchDataPromises)
          
          // Flatten the array and filter out invalid matches
          const matchData: Match[] = matchDataArray
            .flat()
            .filter((match): match is Match => 
              match && typeof match === 'object' && 'matchId' in match
            )
          
          // Sort by gameCreation timestamp (most recent first)
          matchData.sort((a, b) => b.gameCreation - a.gameCreation)
          
          setMatchHistory(matchData)
        } else {
          console.error("Failed to load match history:", lambdaResult.error)
        }
      } catch (error) {
        console.error("Failed to load match history:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadMatchHistory()
  }, [region, playerName])

  const getTierColor = (tier: string) => {
    const tierLower = tier.toLowerCase()
    if (tierLower.includes("iron")) return "text-gray-400"
    if (tierLower.includes("bronze")) return "text-amber-700"
    if (tierLower.includes("silver")) return "text-gray-300"
    if (tierLower.includes("gold")) return "text-yellow-400"
    if (tierLower.includes("platinum")) return "text-teal-400"
    if (tierLower.includes("emerald")) return "text-emerald-400"
    if (tierLower.includes("diamond")) return "text-cyan-400"
    if (tierLower.includes("master")) return "text-purple-400"
    if (tierLower.includes("grandmaster")) return "text-red-400"
    if (tierLower.includes("challenger")) return "text-yellow-300"
    return "text-gray-400"
  }

  const getTierBgColor = (tier: string) => {
    const tierLower = tier.toLowerCase()
    if (tierLower.includes("iron")) return "bg-gray-800 border-gray-700"
    if (tierLower.includes("bronze")) return "bg-amber-900/20 border-amber-800"
    if (tierLower.includes("silver")) return "bg-gray-800 border-gray-600"
    if (tierLower.includes("gold")) return "bg-yellow-900/20 border-yellow-700"
    if (tierLower.includes("platinum")) return "bg-teal-900/20 border-teal-700"
    if (tierLower.includes("emerald")) return "bg-emerald-900/20 border-emerald-700"
    if (tierLower.includes("diamond")) return "bg-cyan-900/20 border-cyan-700"
    if (tierLower.includes("master")) return "bg-purple-900/20 border-purple-700"
    if (tierLower.includes("grandmaster")) return "bg-red-900/20 border-red-700"
    if (tierLower.includes("challenger")) return "bg-yellow-900/20 border-yellow-600"
    return "bg-gray-800 border-gray-700"
  }

  const formatGameDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatGameMode = (gameMode: string, queueId: number) => {
    if (gameMode === "SWIFTPLAY") return "Swiftplay"
    if (queueId === 420) return "Ranked Solo"
    if (queueId === 440) return "Ranked Flex"
    if (queueId === 450) return "ARAM"
    if (queueId === 400) return "Normal Draft"
    return gameMode
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    const mins = Math.floor(diff / 60000)
    return `${mins}m ago`
  }

  const getKDA = (kills: number, deaths: number, assists: number) => {
    const kda = deaths === 0 ? (kills + assists).toFixed(1) : ((kills + assists) / deaths).toFixed(2)
    return kda
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-4 text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{playerName}</h1>
              <p className="text-slate-400">{REGIONS[region] || region.toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Ranked Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Ranked Solo */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Ranked Solo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rankedSolo ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`text-3xl font-bold ${getTierColor(rankedSolo.tier)}`}>
                      {rankedSolo.tier} {rankedSolo.rank}
                    </div>
                    <div className="text-xl text-slate-300">{rankedSolo.leaguePoints} LP</div>
                  </div>
                  
                  {/* Win/Loss Record */}
                  <div className="flex items-center gap-6 pt-2 border-t border-slate-700">
                    <div className="flex-1">
                      <div className="text-sm text-slate-400 mb-1">Win/Loss</div>
                      <div className="text-lg font-semibold text-white">
                        <span className="text-green-400">{rankedSolo.wins}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-red-400">{rankedSolo.losses}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-slate-400 mb-1">Win Rate</div>
                      <div className="text-lg font-semibold text-white">
                        {rankedSolo.wins + rankedSolo.losses > 0
                          ? `${Math.round((rankedSolo.wins / (rankedSolo.wins + rankedSolo.losses)) * 100)}%`
                          : "0%"}
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {rankedSolo.hotStreak && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-orange-900/30 border border-orange-700 rounded text-orange-400 text-xs">
                        <Flame className="h-3 w-3" />
                        Hot Streak
                      </div>
                    )}
                    {rankedSolo.freshBlood && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-900/30 border border-blue-700 rounded text-blue-400 text-xs">
                        <Star className="h-3 w-3" />
                        Fresh Blood
                      </div>
                    )}
                    {rankedSolo.veteran && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-purple-900/30 border border-purple-700 rounded text-purple-400 text-xs">
                        <Shield className="h-3 w-3" />
                        Veteran
                      </div>
                    )}
                    {rankedSolo.inactive && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-gray-900/30 border border-gray-700 rounded text-gray-400 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        Inactive
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-center py-4">Unranked</div>
              )}
            </CardContent>
          </Card>

          {/* Ranked Flex */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-400" />
                Ranked Flex
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rankedFlex ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`text-3xl font-bold ${getTierColor(rankedFlex.tier)}`}>
                      {rankedFlex.tier} {rankedFlex.rank}
                    </div>
                    <div className="text-xl text-slate-300">{rankedFlex.leaguePoints} LP</div>
                  </div>
                  
                  {/* Win/Loss Record */}
                  <div className="flex items-center gap-6 pt-2 border-t border-slate-700">
                    <div className="flex-1">
                      <div className="text-sm text-slate-400 mb-1">Win/Loss</div>
                      <div className="text-lg font-semibold text-white">
                        <span className="text-green-400">{rankedFlex.wins}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-red-400">{rankedFlex.losses}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-slate-400 mb-1">Win Rate</div>
                      <div className="text-lg font-semibold text-white">
                        {rankedFlex.wins + rankedFlex.losses > 0
                          ? `${Math.round((rankedFlex.wins / (rankedFlex.wins + rankedFlex.losses)) * 100)}%`
                          : "0%"}
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {rankedFlex.hotStreak && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-orange-900/30 border border-orange-700 rounded text-orange-400 text-xs">
                        <Flame className="h-3 w-3" />
                        Hot Streak
                      </div>
                    )}
                    {rankedFlex.freshBlood && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-900/30 border border-blue-700 rounded text-blue-400 text-xs">
                        <Star className="h-3 w-3" />
                        Fresh Blood
                      </div>
                    )}
                    {rankedFlex.veteran && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-purple-900/30 border border-purple-700 rounded text-purple-400 text-xs">
                        <Shield className="h-3 w-3" />
                        Veteran
                      </div>
                    )}
                    {rankedFlex.inactive && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-gray-900/30 border border-gray-700 rounded text-gray-400 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        Inactive
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-center py-4">Unranked</div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Match History */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Match History
            </CardTitle>
            <CardDescription className="text-slate-400">
              All Matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matchHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No matches found
                </div>
              ) : (
                matchHistory.map((match) => {
                  const kda = getKDA(match.kills, match.deaths, match.assists)
                  return (
                    <div
                      key={match.matchId}
                      className={`border rounded-lg p-4 transition-colors ${
                        match.win
                          ? "bg-green-900/10 border-green-700/50 hover:bg-green-900/20"
                          : "bg-red-900/10 border-red-700/50 hover:bg-red-900/20"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Win/Loss Indicator */}
                        <div className={`flex-shrink-0 w-1 h-16 rounded-full ${
                          match.win ? "bg-green-500" : "bg-red-500"
                        }`} />
                        
                        <div className="flex-shrink-0 min-w-[100px]">
                          <div className="text-slate-300 text-lg font-bold text-center">{formatGameMode(match.gameMode, match.queueId)}</div>
                          <div className="text-slate-300 text-sm text-center">{formatTimeAgo(match.gameCreation)}</div>
                        </div>
                        {/* Champion & Game Info */}
                        <ChampionDisplay championId={match.championId} size={48} />

                        {/* KDA */}
                        <div className="flex-shrink-0 min-w-[100px]">
                          <div className={`text-lg font-bold text-center ${
                            match.win ? "text-green-400" : "text-red-400"
                          }`}>
                            {match.win ? "Victory" : "Defeat"}
                          </div>
                          <div className="text-slate-300 text-sm text-center">
                            {match.kills} / <span className="text-red-400">{match.deaths}</span> / {match.assists}
                          </div>
                          <div className="text-slate-400 text-xs text-center">KDA {kda}</div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <div>
                              <div className="text-slate-300">{formatGameDuration(match.gameDuration)}</div>
                              <div className="text-slate-500 text-xs">Duration</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-slate-400" />
                            <div>
                              <div className="text-slate-300">{match.goldEarned.toLocaleString()}</div>
                              <div className="text-slate-500 text-xs">Gold</div>
                            </div>
                          </div>
                        </div>

                        {/* Items, Perks and Summoners */}
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-1">
                          {match.items.map((itemId) => (
                            <ItemDisplay key={itemId} itemId={itemId} size={48} />
                          ))}
                          {/* Perks and Summoners - takes up 1 grid slot */}
                          <div className="flex flex-row gap-1">
                            <div className="flex flex-col gap-1">
                              <PerkDisplay perkId={match.perks?.styles[0]?.selections[0]?.perk || 0} size={24} />
                              <PerkStyleDisplay perkStyleId={match.perks?.styles[1]?.style || 0} size={24} />
                            </div>
                            <div className="flex flex-col gap-1">
                              <SummonerDisplay summonerId={match.summoner1Id} size={24} />
                              <SummonerDisplay summonerId={match.summoner2Id} size={24} />
                            </div>
                          </div>
                        </div>
                        {/* Game Review */}
                        <Button
                          onClick={() => router.push(`/game/${match.matchId}`)}
                          size="default"
                          className="h-12 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Play className="h-4 w-4" />
                          Game Review
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

