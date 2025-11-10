"use client"
import React, { useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { TimelineEvent } from './timelineController';
import { CombinedGameData, ChampionKillEvent, ChampionSpecialKillEvent, EliteMonsterKillEvent, BuildingKillEvent, SkillEvent, LevelEvent, ItemEvent, FeatUpdateEvent, GameEvent, ItemUndoEvent, ItemPurchasedEvent, ItemSoldEvent, ItemDestroyedEvent } from '@/types/combinedGameData';
import { ChampionDisplay } from './championDisplay';
import { ItemDisplay } from './itemDisplay';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { getChampionImageUrl, useImageContext } from '@/app/context/imageHelper';

interface EventDetailsProps {
  event: TimelineEvent | null;
  gameData: CombinedGameData | null;
  onClose?: () => void;
}

interface DamageEntry {
  participantId: number;
  totalDamage: number;
  physicalDamage: number;
  magicDamage: number;
  trueDamage: number;
}

interface DamageDataItem {
  participant: string;
  damage: number;
  physicalDamage: number;
  magicDamage: number;
  trueDamage: number;
  participantId: number;
  championId: number;
  teamId: number | undefined;
}

interface ChampionTickProps {
  y?: number;
  payload?: {
    value: string;
  };
  [key: string]: unknown;
}

export default function EventDetails({ event, gameData, onClose }: EventDetailsProps) {
  const { championImageMap } = useImageContext();
  
  const getPlayerName = useCallback((id: number) => {
    return gameData?.match_data?.participants?.find(p => p.participantId === id)?.riotIdGameName || `Player ${id}`;
  }, [gameData]);

  const getChampionId = useCallback((id: number) => {
    return gameData?.match_data?.participants?.find(p => p.participantId === id)?.championId || -1;
  }, [gameData]);

  const getTeamId = useCallback((id: number) => {
    return gameData?.match_data?.participants?.find(p => p.participantId === id)?.teamId;
  }, [gameData]);

  // Memoize damage data calculation to prevent recalculation on every render
  const damageData = useMemo((): DamageDataItem[] => {
    if (event?.eventType === 'kill' && event?.type === 'CHAMPION_KILL') {
      const killData = event.data as ChampionKillEvent;
      if (killData.victimDamageReceived) {
        const damageArray = killData.victimDamageReceived;
        return damageArray
          .map((damage): DamageEntry => ({
            participantId: damage.participantId,
            totalDamage: (damage.physicalDamage || 0) + (damage.magicDamage || 0) + (damage.trueDamage || 0),
            physicalDamage: damage.physicalDamage || 0,
            magicDamage: damage.magicDamage || 0,
            trueDamage: damage.trueDamage || 0,
          }))
          .reduce((acc: DamageEntry[], curr: DamageEntry) => {
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
          .map((item): DamageDataItem => ({
            participant: getPlayerName(item.participantId),
            damage: item.totalDamage,
            physicalDamage: item.physicalDamage,
            magicDamage: item.magicDamage,
            trueDamage: item.trueDamage,
            participantId: item.participantId,
            championId: getChampionId(item.participantId),
            teamId: getTeamId(item.participantId),
          }))
          .sort((a, b) => b.damage - a.damage);
      }
    }
    return [];
  }, [event?.eventType, event?.type, event?.timestamp, event?.data, gameData, getChampionId, getPlayerName, getTeamId]);

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
    const ChampionTick = ({ y, payload }: ChampionTickProps) => {
      if (!y || !payload?.value) return null;
      const data = damageData.find((d) => d.participant === payload.value);
      if (!data) return null;
      
      const championImageUrl = getChampionImageUrl(data.championId, championImageMap);
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
                  width={32}
                  height={32}
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
                tick={(props: ChampionTickProps) => <ChampionTick {...props} />}
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
  }, [damageData, chartConfig, event?.timestamp, championImageMap]);
  
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
  
  if (!event || !gameData) {
    return null;
  }

  const renderEventDetails = () => {
    const { eventType, type, data } = event;
    const color = getEventColor(eventType, type);

    switch (eventType) {
      case 'kill':
        if (type === 'CHAMPION_KILL') {
          const championKillData = data as ChampionKillEvent;
          return (
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color }}>
                Champion Kill
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Killer</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChampionDisplay championId={getChampionId(championKillData.killerId)} size={32} teamId={getTeamId(championKillData.killerId)} />
                  <span>{getPlayerName(championKillData.killerId)}</span>
                </div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Victim</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChampionDisplay championId={getChampionId(championKillData.victimId)} size={32} teamId={getTeamId(championKillData.victimId)} />
                  <span>{getPlayerName(championKillData.victimId)}</span>
                </div>
              </div>
              {championKillData.bounty !== undefined && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Bounty: {championKillData.bounty} gold</div>
                </div>
              )}
              {championKillData.killStreakLength > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Kill Streak: {championKillData.killStreakLength}</div>
                </div>
              )}
              {championKillData.assistingParticipantIds && championKillData.assistingParticipantIds.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Assists</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {championKillData.assistingParticipantIds.map((id: number) => (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ChampionDisplay championId={getChampionId(id)} size={24} teamId={getTeamId(id)} />
                        <span style={{ fontSize: '11px' }}>{getPlayerName(id)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {DamageChart}
              {championKillData.position && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Position: ({Math.round(championKillData.position.x)}, {Math.round(championKillData.position.y)})
                  </div>
                </div>
              )}
            </div>
          );
        } else if (type === 'CHAMPION_SPECIAL_KILL') {
          const specialKillData = data as ChampionSpecialKillEvent;
          return (
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color }}>
                {specialKillData.killType === 'KILL_FIRST_BLOOD' ? 'First Blood' : 
                 specialKillData.killType === 'KILL_MULTI' ? 
                   (specialKillData.multiKillLength === 2 ? 'Double Kill' :
                    specialKillData.multiKillLength === 3 ? 'Triple Kill' :
                    specialKillData.multiKillLength === 4 ? 'Quadra Kill' :
                    specialKillData.multiKillLength === 5 ? 'Penta Kill' : 'Multi Kill') : 
                 'Special Kill'}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Killer</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChampionDisplay championId={getChampionId(specialKillData.killerId)} size={32} teamId={getTeamId(specialKillData.killerId)} />
                  <span>{getPlayerName(specialKillData.killerId)}</span>
                </div>
              </div>
              {specialKillData.position && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Position: ({Math.round(specialKillData.position.x)}, {Math.round(specialKillData.position.y)})
                  </div>
                </div>
              )}
            </div>
          );
        } else if (type === 'ELITE_MONSTER_KILL') {
          const monsterKillData = data as EliteMonsterKillEvent;
          const monsterName = monsterKillData.monsterType === 'DRAGON' 
            ? (monsterKillData.monsterSubType || 'Dragon')
            : monsterKillData.monsterType === 'RIFTHERALD' ? 'Rift Herald'
            : monsterKillData.monsterType === 'BARON_NASHOR' ? 'Baron Nashor'
            : monsterKillData.monsterType === 'HORDE' ? 'Void Grub'
            : monsterKillData.monsterType;
          
          return (
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color }}>
                {monsterName} Slain
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Killer</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChampionDisplay championId={getChampionId(monsterKillData.killerId)} size={32} teamId={getTeamId(monsterKillData.killerId)} />
                  <span>{getPlayerName(monsterKillData.killerId)}</span>
                </div>
              </div>
              {monsterKillData.assistingParticipantIds && monsterKillData.assistingParticipantIds.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Assists</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {monsterKillData.assistingParticipantIds.map((id: number) => (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ChampionDisplay championId={getChampionId(id)} size={24} teamId={getTeamId(id)} />
                        <span style={{ fontSize: '11px' }}>{getPlayerName(id)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {monsterKillData.position && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Position: ({Math.round(monsterKillData.position.x)}, {Math.round(monsterKillData.position.y)})
                  </div>
                </div>
              )}
            </div>
          );
        } else if (type === 'BUILDING_KILL') {
          const buildingKillData = data as BuildingKillEvent;
          const buildingName = buildingKillData.buildingType === 'TOWER_BUILDING' 
            ? (buildingKillData.towerType === 'NEXUS_TURRET' ? 'Nexus Turret' :
               buildingKillData.towerType === 'BASE_TURRET' ? 'Base Turret' :
               buildingKillData.towerType === 'INNER_TURRET' ? 'Inner Turret' :
               buildingKillData.towerType === 'OUTER_TURRET' ? 'Outer Turret' : 'Turret')
            : buildingKillData.buildingType === 'INHIBITOR_BUILDING' ? 'Inhibitor' : 'Building';
          
          const laneName = buildingKillData.laneType === 'TOP_LANE' ? 'Top' :
                          buildingKillData.laneType === 'MID_LANE' ? 'Mid' :
                          buildingKillData.laneType === 'BOT_LANE' ? 'Bot' : '';
          
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
                  <ChampionDisplay championId={getChampionId(buildingKillData.killerId)} size={32} teamId={getTeamId(buildingKillData.killerId)} />
                  <span>{getPlayerName(buildingKillData.killerId)}</span>
                </div>
              </div>
              {buildingKillData.assistingParticipantIds && buildingKillData.assistingParticipantIds.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Assists</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {buildingKillData.assistingParticipantIds.map((id: number) => (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ChampionDisplay championId={getChampionId(id)} size={24} teamId={getTeamId(id)} />
                        <span style={{ fontSize: '11px' }}>{getPlayerName(id)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {buildingKillData.position && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Position: ({Math.round(buildingKillData.position.x)}, {Math.round(buildingKillData.position.y)})
                  </div>
                </div>
              )}
            </div>
          );
        }
        break;
      
      case 'skill':
        const skillData = data as SkillEvent;
        const skillSlot = skillData.skillSlot === 1 ? 'Q' :
                         skillData.skillSlot === 2 ? 'W' :
                         skillData.skillSlot === 3 ? 'E' :
                         skillData.skillSlot === 4 ? 'R' : `Slot ${skillData.skillSlot}`;
        return (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color }}>
              Skill Level Up
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Player</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChampionDisplay championId={getChampionId(skillData.participantId)} size={32} teamId={getTeamId(skillData.participantId)} />
                <span>{getPlayerName(skillData.participantId)}</span>
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Skill: {skillSlot}</div>
            </div>
            {skillData.levelUpType && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Type: {skillData.levelUpType}</div>
              </div>
            )}
          </div>
        );
      
      case 'level':
        const levelData = data as LevelEvent;
        return (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color }}>
              Level Up
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Player</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChampionDisplay championId={getChampionId(levelData.participantId)} size={32} teamId={getTeamId(levelData.participantId)} />
                <span>{getPlayerName(levelData.participantId)}</span>
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>New Level: {levelData.level}</div>
            </div>
          </div>
        );
      
      case 'item':
        const itemData = data as ItemEvent;
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
                <ChampionDisplay championId={getChampionId(itemData.participantId)} size={32} teamId={getTeamId(itemData.participantId)} />
                <span>{getPlayerName(itemData.participantId)}</span>
              </div>
            </div>
            {type === 'ITEM_UNDO' ? (
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Before</div>
                  <ItemDisplay itemId={(itemData as ItemUndoEvent).beforeId} size={32} />
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>After</div>
                  <ItemDisplay itemId={(itemData as ItemUndoEvent).afterId} size={32} />
                </div>
                {(itemData as ItemUndoEvent).goldGain !== undefined && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Gold Gain: {(itemData as ItemUndoEvent).goldGain}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Item</div>
                <ItemDisplay itemId={(itemData as ItemPurchasedEvent | ItemSoldEvent | ItemDestroyedEvent).itemId} size={32} />
              </div>
            )}
          </div>
        );
      
      case 'feat':
        const featData = data as FeatUpdateEvent;
        const teamName = featData.teamId === 100 ? 'Blue' : featData.teamId === 200 ? 'Red' : `Team ${featData.teamId}`;
        let featDescription = '';
        if (featData.featType === 0) {
          if (featData.featValue === 1) featDescription = '1/3 kills for feat of warfare';
          else if (featData.featValue === 2) featDescription = '2/3 kills for feat of warfare';
          else if (featData.featValue === 3) featDescription = 'Taken feat of warfare';
          else if (featData.featValue === 1001) featDescription = 'Lost feat of warfare';
        } else if (featData.featType === 1) {
          if (featData.featValue === 1) featDescription = 'Taken first turret';
          else if (featData.featValue === 1001) featDescription = 'Lost first turret';
        } else if (featData.featType === 2) {
          if (featData.featValue === 1) featDescription = '1/3 Epic Monsters slain';
          else if (featData.featValue === 2) featDescription = '2/3 Epic Monsters slain';
          else if (featData.featValue === 3) featDescription = 'Taken feat of monster slaying';
          else if (featData.featValue === 1001) featDescription = 'Lost feat of monster slaying';
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
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Feat Type: {featData.featType}</div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Feat Value: {featData.featValue}</div>
            </div>
          </div>
        );
      
      case 'game':
        const gameEventData = data as GameEvent;
        return (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color }}>
              {type}
            </div>
            {gameEventData.winningTeam !== undefined && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Winning Team: {gameEventData.winningTeam === 100 ? 'Blue' : gameEventData.winningTeam === 200 ? 'Red' : `Team ${gameEventData.winningTeam}`}
                </div>
              </div>
            )}
            {gameEventData.gameId !== undefined && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Game ID: {gameEventData.gameId}</div>
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

