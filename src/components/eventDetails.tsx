"use client"
import React, { useMemo } from 'react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { TimelineEvent } from './timelineController';
import { CombinedGameData } from '@/types/combinedGameData';
import { ChampionDisplay } from './championDisplay';
import { ItemDisplay } from './itemDisplay';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { getChampionImageUrl } from '@/app/context/imageHelper';

interface EventDetailsProps {
  event: TimelineEvent | null;
  gameData: CombinedGameData | null;
  onClose?: () => void;
}

export default function EventDetails({ event, gameData, onClose }: EventDetailsProps) {
  if (!event || !gameData) {
    return null;
  }

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPlayerName = (id: number) => {
    return gameData?.match_data?.participants?.find(p => p.participantId === id)?.riotIdGameName || `Player ${id}`;
  };

  const getChampionId = (id: number) => {
    return gameData?.match_data?.participants?.find(p => p.participantId === id)?.championId || -1;
  };

  const getTeamId = (id: number) => {
    return gameData?.match_data?.participants?.find(p => p.participantId === id)?.teamId;
  };

  const getEventColor = (eventType: string, type: string): string => {
    switch (eventType) {
      case 'kill':
        if (type === 'CHAMPION_KILL') return '#ef4444';
        if (type === 'CHAMPION_SPECIAL_KILL') return '#f59e0b';
        if (type === 'ELITE_MONSTER_KILL') return '#8b5cf6';
        if (type === 'BUILDING_KILL') return '#ec4899';
        return '#dc2626';
      case 'skill':
        return '#3b82f6';
      case 'level':
        return '#10b981';
      case 'item':
        return '#f59e0b';
      case 'feat':
        return '#6366f1';
      case 'game':
        if (type === 'GAME_END') return '#000000';
        if (type === 'PAUSE_END') return '#6b7280';
        return '#9ca3af';
      default:
        return '#6b7280';
    }
  };

  // Memoize damage data calculation to prevent recalculation on every render
  const damageData = useMemo(() => {
    if (event?.eventType === 'kill' && event?.type === 'CHAMPION_KILL' && event?.data?.victimDamageReceived) {
      const damageArray = event.data.victimDamageReceived;
      return damageArray
        .map((damage: any) => ({
          participantId: damage.participantId,
          totalDamage: (damage.physicalDamage || 0) + (damage.magicDamage || 0) + (damage.trueDamage || 0),
          physicalDamage: damage.physicalDamage || 0,
          magicDamage: damage.magicDamage || 0,
          trueDamage: damage.trueDamage || 0,
        }))
        .reduce((acc: any[], curr: any) => {
          const existing = acc.find((item) => item.participantId === curr.participantId);
          if (existing) {
            existing.totalDamage += curr.totalDamage;
            existing.physicalDamage += curr.physicalDamage;
            existing.magicDamage += curr.magicDamage;
            existing.trueDamage += curr.trueDamage;
          } else {
            acc.push(curr);
          }
          return acc;
        }, [])
        .map((item: any) => ({
          participant: getPlayerName(item.participantId),
          damage: item.totalDamage,
          physicalDamage: item.physicalDamage,
          magicDamage: item.magicDamage,
          trueDamage: item.trueDamage,
          participantId: item.participantId,
          championId: getChampionId(item.participantId),
          teamId: getTeamId(item.participantId),
        }))
        .sort((a: any, b: any) => b.damage - a.damage);
    }
    return [];
  }, [event?.eventType, event?.type, event?.data?.victimDamageReceived, event?.timestamp, gameData]);

  // Memoize chart config
  const chartConfig = useMemo(() => ({
    physicalDamage: {
      label: 'Physical Damage',
      color: '#dc2626', // Red for physical
    },
    magicDamage: {
      label: 'Magic Damage',
      color: '#3b82f6', // Blue for magic
    },
    trueDamage: {
      label: 'True Damage',
      color: '#fbbf24', // Yellow/Amber for true
    },
  } satisfies ChartConfig), []);

  // Memoize the chart component to prevent re-renders
  const DamageChart = useMemo(() => {
    if (!damageData || damageData.length === 0) return null;

    // Custom tick component for YAxis to display champion images
    const ChampionTick = ({ y, payload }: any) => {
      const data = damageData.find((d: any) => d.participant === payload.value);
      if (!data) return null;
      
      const championImageUrl = getChampionImageUrl(data.championId);
      const ringColor = data.teamId === 100 ? '#3b82f6' : data.teamId === 200 ? '#ef4444' : '#64748b';
      
      return (
        <g transform={`translate(0,${y})`}>
          <foreignObject x={0} y={-16} width={32} height={32}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              backgroundColor: '#1e293b',
              border: `2px solid ${ringColor}`,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {championImageUrl ? (
                <img 
                  src={championImageUrl} 
                  alt={data.participant}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <span style={{ color: '#cbd5e1', fontSize: '16px' }}>?</span>
              )}
            </div>
          </foreignObject>
        </g>
      );
    };
    
    return (
      <div style={{ marginBottom: '8px', marginTop: '12px' }}>
        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>Damage Dealt</div>
        <div style={{ height: `${Math.max(200, damageData.length * 40)}px`, width: '100%', minHeight: '200px', position: 'relative', display: 'block', boxSizing: 'border-box' }}>
          <ChartContainer 
            id={`damage-chart-${event?.timestamp || 'default'}`}
            config={chartConfig} 
            style={{ height: '100%', width: '100%', display: 'block' }}
          >
            <BarChart
              accessibilityLayer
              data={damageData}
              layout="vertical"
              margin={{
                left: -10,
              }}
            >
              <XAxis 
                type="number" 
                domain={[0, 'dataMax']}
                hide 
              />
              <YAxis
                dataKey="participant"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                width={50}
                tick={<ChampionTick />}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar 
                dataKey="physicalDamage" 
                stackId="damage" 
                fill="var(--color-physicalDamage)" 
                radius={[5, 0, 0, 5]}
              />
              <Bar 
                dataKey="magicDamage" 
                stackId="damage" 
                fill="var(--color-magicDamage)" 
                radius={0}
              />
              <Bar 
                dataKey="trueDamage" 
                stackId="damage" 
                fill="var(--color-trueDamage)" 
                radius={[0, 5, 5, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    );
  }, [damageData, chartConfig, event?.timestamp]);

  const renderEventDetails = () => {
    const { eventType, type, data, timestamp } = event;
    const color = getEventColor(eventType, type);

    switch (eventType) {
      case 'kill':
        if (type === 'CHAMPION_KILL') {

          return (
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color }}>
                Champion Kill
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Killer</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChampionDisplay championId={getChampionId(data.killerId)} size={32} teamId={getTeamId(data.killerId)} />
                  <span>{getPlayerName(data.killerId)}</span>
                </div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Victim</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChampionDisplay championId={getChampionId(data.victimId)} size={32} teamId={getTeamId(data.victimId)} />
                  <span>{getPlayerName(data.victimId)}</span>
                </div>
              </div>
              {data.bounty !== undefined && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Bounty: {data.bounty} gold</div>
                </div>
              )}
              {data.killStreakLength > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Kill Streak: {data.killStreakLength}</div>
                </div>
              )}
              {data.assistingParticipantIds && data.assistingParticipantIds.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Assists</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {data.assistingParticipantIds.map((id: number) => (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ChampionDisplay championId={getChampionId(id)} size={24} teamId={getTeamId(id)} />
                        <span style={{ fontSize: '11px' }}>{getPlayerName(id)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {DamageChart}
              {data.position && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Position: ({Math.round(data.position.x)}, {Math.round(data.position.y)})
                  </div>
                </div>
              )}
            </div>
          );
        } else if (type === 'CHAMPION_SPECIAL_KILL') {
          return (
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color }}>
                {data.killType === 'KILL_FIRST_BLOOD' ? 'First Blood' : 
                 data.killType === 'KILL_MULTI' ? 
                   (data.multiKillLength === 2 ? 'Double Kill' :
                    data.multiKillLength === 3 ? 'Triple Kill' :
                    data.multiKillLength === 4 ? 'Quadra Kill' :
                    data.multiKillLength === 5 ? 'Penta Kill' : 'Multi Kill') : 
                 'Special Kill'}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Killer</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChampionDisplay championId={getChampionId(data.killerId)} size={32} teamId={getTeamId(data.killerId)} />
                  <span>{getPlayerName(data.killerId)}</span>
                </div>
              </div>
              {data.position && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Position: ({Math.round(data.position.x)}, {Math.round(data.position.y)})
                  </div>
                </div>
              )}
            </div>
          );
        } else if (type === 'ELITE_MONSTER_KILL') {
          const monsterName = data.monsterType === 'DRAGON' 
            ? (data.monsterSubType || 'Dragon')
            : data.monsterType === 'RIFTHERALD' ? 'Rift Herald'
            : data.monsterType === 'BARON_NASHOR' ? 'Baron Nashor'
            : data.monsterType === 'HORDE' ? 'Void Grub'
            : data.monsterType;
          
          return (
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color }}>
                {monsterName} Slain
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Killer</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChampionDisplay championId={getChampionId(data.killerId)} size={32} teamId={getTeamId(data.killerId)} />
                  <span>{getPlayerName(data.killerId)}</span>
                </div>
              </div>
              {data.assistingParticipantIds && data.assistingParticipantIds.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Assists</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {data.assistingParticipantIds.map((id: number) => (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ChampionDisplay championId={getChampionId(id)} size={24} teamId={getTeamId(id)} />
                        <span style={{ fontSize: '11px' }}>{getPlayerName(id)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.position && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Position: ({Math.round(data.position.x)}, {Math.round(data.position.y)})
                  </div>
                </div>
              )}
            </div>
          );
        } else if (type === 'BUILDING_KILL') {
          const buildingName = data.buildingType === 'TOWER_BUILDING' 
            ? (data.towerType === 'NEXUS_TURRET' ? 'Nexus Turret' :
               data.towerType === 'BASE_TURRET' ? 'Base Turret' :
               data.towerType === 'INNER_TURRET' ? 'Inner Turret' :
               data.towerType === 'OUTER_TURRET' ? 'Outer Turret' : 'Turret')
            : data.buildingType === 'INHIBITOR_BUILDING' ? 'Inhibitor' : 'Building';
          
          const laneName = data.laneType === 'TOP_LANE' ? 'Top' :
                          data.laneType === 'MID_LANE' ? 'Mid' :
                          data.laneType === 'BOT_LANE' ? 'Bot' : '';
          
          return (
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color }}>
                {buildingName} Destroyed
              </div>
              {laneName && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Lane: {laneName}</div>
                </div>
              )}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Killer</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChampionDisplay championId={getChampionId(data.killerId)} size={32} teamId={getTeamId(data.killerId)} />
                  <span>{getPlayerName(data.killerId)}</span>
                </div>
              </div>
              {data.assistingParticipantIds && data.assistingParticipantIds.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Assists</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {data.assistingParticipantIds.map((id: number) => (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ChampionDisplay championId={getChampionId(id)} size={24} teamId={getTeamId(id)} />
                        <span style={{ fontSize: '11px' }}>{getPlayerName(id)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.position && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Position: ({Math.round(data.position.x)}, {Math.round(data.position.y)})
                  </div>
                </div>
              )}
            </div>
          );
        }
        break;
      
      case 'skill':
        const skillSlot = data.skillSlot === 1 ? 'Q' :
                         data.skillSlot === 2 ? 'W' :
                         data.skillSlot === 3 ? 'E' :
                         data.skillSlot === 4 ? 'R' : `Slot ${data.skillSlot}`;
        return (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color }}>
              Skill Level Up
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Player</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChampionDisplay championId={getChampionId(data.participantId)} size={32} teamId={getTeamId(data.participantId)} />
                <span>{getPlayerName(data.participantId)}</span>
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Skill: {skillSlot}</div>
            </div>
            {data.levelUpType && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Type: {data.levelUpType}</div>
              </div>
            )}
          </div>
        );
      
      case 'level':
        return (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color }}>
              Level Up
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Player</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChampionDisplay championId={getChampionId(data.participantId)} size={32} teamId={getTeamId(data.participantId)} />
                <span>{getPlayerName(data.participantId)}</span>
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>New Level: {data.level}</div>
            </div>
          </div>
        );
      
      case 'item':
        const itemAction = type === 'ITEM_PURCHASED' ? 'Purchased' :
                          type === 'ITEM_SOLD' ? 'Sold' :
                          type === 'ITEM_DESTROYED' ? 'Destroyed' :
                          type === 'ITEM_UNDO' ? 'Undo' : 'Item Event';
        return (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color }}>
              Item {itemAction}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Player</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChampionDisplay championId={getChampionId(data.participantId)} size={32} teamId={getTeamId(data.participantId)} />
                <span>{getPlayerName(data.participantId)}</span>
              </div>
            </div>
            {type === 'ITEM_UNDO' ? (
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Before</div>
                  <ItemDisplay itemId={data.beforeId} size={32} />
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>After</div>
                  <ItemDisplay itemId={data.afterId} size={32} />
                </div>
                {data.goldGain !== undefined && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Gold Gain: {data.goldGain}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Item</div>
                <ItemDisplay itemId={data.itemId} size={32} />
              </div>
            )}
          </div>
        );
      
      case 'feat':
        const teamName = data.teamId === 100 ? 'Blue' : data.teamId === 200 ? 'Red' : `Team ${data.teamId}`;
        let featDescription = '';
        if (data.featType === 0) {
          if (data.featValue === 1) featDescription = '1/3 kills for feat of warfare';
          else if (data.featValue === 2) featDescription = '2/3 kills for feat of warfare';
          else if (data.featValue === 3) featDescription = 'Taken feat of warfare';
          else if (data.featValue === 1001) featDescription = 'Lost feat of warfare';
        } else if (data.featType === 1) {
          if (data.featValue === 1) featDescription = 'Taken first turret';
          else if (data.featValue === 1001) featDescription = 'Lost first turret';
        } else if (data.featType === 2) {
          if (data.featValue === 1) featDescription = '1/3 Epic Monsters slain';
          else if (data.featValue === 2) featDescription = '2/3 Epic Monsters slain';
          else if (data.featValue === 3) featDescription = 'Taken feat of monster slaying';
          else if (data.featValue === 1001) featDescription = 'Lost feat of monster slaying';
        }
        
        return (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color }}>
              Feat Update
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Team: {teamName}</div>
            </div>
            {featDescription && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>{featDescription}</div>
              </div>
            )}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Feat Type: {data.featType}</div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Feat Value: {data.featValue}</div>
            </div>
          </div>
        );
      
      case 'game':
        return (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color }}>
              {type}
            </div>
            {data.winningTeam !== undefined && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Winning Team: {data.winningTeam === 100 ? 'Blue' : data.winningTeam === 200 ? 'Red' : `Team ${data.winningTeam}`}
                </div>
              </div>
            )}
            {data.gameId !== undefined && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Game ID: {data.gameId}</div>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color }}>
              {type}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Event Type: {eventType}
            </div>
          </div>
        );
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 1000,
        minWidth: '300px',
        maxWidth: '400px',
        maxHeight: 'calc(100vh - 60px)',
        overflowY: 'auto',
        border: `2px solid ${getEventColor(event.eventType, event.type)}`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
          {formatTime(event.timestamp)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            fontSize: '10px', 
            padding: '2px 6px', 
            borderRadius: '4px',
            backgroundColor: getEventColor(event.eventType, event.type),
            color: 'white'
          }}>
            {event.eventType.toUpperCase()}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Close details"
            >
              ×
            </button>
          )}
        </div>
      </div>
      {renderEventDetails()}
    </div>
  );
}

