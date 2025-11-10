"use client"
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CombinedGameData, GameEvent, SkillEvent, KillEvent, LevelEvent, ItemEvent, FeatUpdateEvent } from '@/types/combinedGameData';
import { ChampionDisplay } from './championDisplay';
import { ItemDisplay } from './itemDisplay';

export interface TimelineEvent {
  timestamp: number;
  type: string;
  eventType: 'game' | 'skill' | 'kill' | 'level' | 'item' | 'feat';
  data: any;
}

interface TimelineControllerProps {
  gameData: CombinedGameData | null;
  currentTime: number;
  onTimeChange: (time: number) => void;
  onEventSelect?: (event: TimelineEvent) => void;
}

export default function TimelineController({
  gameData,
  currentTime,
  onTimeChange,
  onEventSelect
}: TimelineControllerProps) {
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Event type visibility toggles (all enabled by default)
  const [eventVisibility, setEventVisibility] = useState({
    game: true,
    skill: true,
    kill: true,
    level: true,
    item: true,
    feat: true
  });

  // Player filter - only one can be selected at a time (null = all players)
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  // Combine all events and sort by timestamp
  const allEvents = useMemo(() => {
    if (!gameData) return [];

    const events: TimelineEvent[] = [];

    // Add game events
    gameData.game_events?.forEach(event => {
      events.push({
        timestamp: event.timestamp,
        type: event.type,
        eventType: 'game',
        data: event
      });
    });

    // Add skill events
    gameData.skill_events?.forEach(event => {
      events.push({
        timestamp: event.timestamp,
        type: event.type,
        eventType: 'skill',
        data: event
      });
    });

    // Add kill events
    gameData.kill_events?.forEach(event => {
      events.push({
        timestamp: event.timestamp,
        type: event.type,
        eventType: 'kill',
        data: event
      });
    });

    // Add level events
    gameData.level_events?.forEach(event => {
      events.push({
        timestamp: event.timestamp,
        type: event.type,
        eventType: 'level',
        data: event
      });
    });

    // Add item events
    gameData.item_events?.forEach(event => {
      events.push({
        timestamp: event.timestamp,
        type: event.type,
        eventType: 'item',
        data: event
      });
    });

    // Add feat events
    gameData.feat_events?.forEach(event => {
      events.push({
        timestamp: event.timestamp,
        type: event.type,
        eventType: 'feat',
        data: event
      });
    });

    return events.sort((a, b) => a.timestamp - b.timestamp);
  }, [gameData]);

  // Filter events based on visibility toggles and player filter
  const visibleEvents = useMemo(() => {
    return allEvents.filter(event => {
      if (!eventVisibility[event.eventType]) return false;
      
      // If no player is selected, show all events
      if (selectedPlayerId === null) return true;
      
      const { eventType, data } = event;
      
      switch (eventType) {
        case 'kill':
          // Check if player is killer, victim, or assistant
          if (data.killerId === selectedPlayerId || data.victimId === selectedPlayerId) return true;
          
          // Check assisting participant IDs (for all kill types that support it)
          if (data.assistingParticipantIds && Array.isArray(data.assistingParticipantIds)) {
            if (data.assistingParticipantIds.includes(selectedPlayerId)) return true;
          }
          
          // Check if player dealt damage (support through damage)
          if (data.victimDamageReceived && Array.isArray(data.victimDamageReceived)) {
            const playerDealtDamage = data.victimDamageReceived.some(
              (damage: any) => damage.participantId === selectedPlayerId
            );
            if (playerDealtDamage) return true;
          }
          
          // Check if player received damage from victim (for counter-attacks)
          if (data.victimDamageDealt && Array.isArray(data.victimDamageDealt)) {
            const playerReceivedDamage = data.victimDamageDealt.some(
              (damage: any) => damage.participantId === selectedPlayerId
            );
            if (playerReceivedDamage) return true;
          }
          
          return false;
        case 'skill':
        case 'level':
        case 'item':
          return data.participantId === selectedPlayerId;
        case 'feat':
          // Show feat events if they're for the player's team
          if (!gameData) return false;
          const player = gameData.match_data?.participants?.find(p => p.participantId === selectedPlayerId);
          return player?.teamId === data.teamId;
        case 'game':
          // Show all game events regardless of player filter
          return true;
        default:
          return true;
      }
    });
  }, [allEvents, eventVisibility, selectedPlayerId, gameData]);

  // Create a map of event -> index for O(1) lookups
  const eventIndexMap = useMemo(() => {
    const map = new Map<TimelineEvent, number>();
    allEvents.forEach((event, index) => {
      map.set(event, index);
    });
    return map;
  }, [allEvents]);

  // Calculate event counts by type
  const eventCounts = useMemo(() => {
    return {
      game: allEvents.filter(e => e.eventType === 'game').length,
      skill: allEvents.filter(e => e.eventType === 'skill').length,
      kill: allEvents.filter(e => e.eventType === 'kill').length,
      level: allEvents.filter(e => e.eventType === 'level').length,
      item: allEvents.filter(e => e.eventType === 'item').length,
      feat: allEvents.filter(e => e.eventType === 'feat').length
    };
  }, [allEvents]);

  // Calculate game duration
  const gameDuration = useMemo(() => {
    if (!gameData || allEvents.length === 0) return 0;
    const lastEvent = allEvents[allEvents.length - 1];
    return Math.max(
      lastEvent.timestamp,
      gameData.match_data?.gameDuration ? gameData.match_data.gameDuration * 1000 : 0
    );
  }, [gameData, allEvents]);

  // Get event color based on type
  const getEventColor = (eventType: string, type: string): string => {
    switch (eventType) {
      case 'kill':
        if (type === 'CHAMPION_KILL') return '#ef4444'; // Red
        if (type === 'CHAMPION_SPECIAL_KILL') return '#f59e0b'; // Orange
        if (type === 'ELITE_MONSTER_KILL') return '#8b5cf6'; // Purple
        if (type === 'BUILDING_KILL') return '#ec4899'; // Pink
        return '#dc2626';
      case 'skill':
        return '#3b82f6'; // Blue
      case 'level':
        return '#10b981'; // Green
      case 'item':
        return '#f59e0b'; // Amber
      case 'feat':
        return '#6366f1'; // Indigo
      case 'game':
        if (type === 'GAME_END') return '#000000'; // Black
        if (type === 'PAUSE_END') return '#6b7280'; // Gray
        return '#9ca3af';
      default:
        return '#6b7280';
    }
  };

  // Format time - defined before useMemo that uses it
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPlayerName = (id: number) => {
    return gameData?.match_data?.participants?.find(p => p.participantId === id)?.riotIdGameName || `P${id}`;
  }

  const getChampionId = (id: number) => {
    return gameData?.match_data?.participants?.find(p => p.participantId === id)?.championId || -1;
  }

  const getTeamId = (id: number) => {
    return gameData?.match_data?.participants?.find(p => p.participantId === id)?.teamId;
  }

  // Parse label string and replace <ChampionImage=ID>, <ItemImage=ID>, and <PlayerName=ID> tags with display components
  // Also supports <ChampionImage=CHAMPION_ID:PARTICIPANT_ID> format for teamId lookup
  const parseLabelWithImages = (label: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Match ChampionImage, ItemImage, and PlayerName tags, with optional participantId after colon for ChampionImage
    const regex = /<(ChampionImage|ItemImage|PlayerName)=(-?\d+)(?::(-?\d+))?>/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    // Find all matches and sort by position
    const matches: Array<{ index: number; type: string; id: number; participantId?: number; endIndex: number }> = [];
    while ((match = regex.exec(label)) !== null) {
      matches.push({
        index: match.index,
        type: match[1],
        id: parseInt(match[2], 10),
        participantId: match[3] ? parseInt(match[3], 10) : undefined,
        endIndex: regex.lastIndex
      });
    }

    // Process matches in order
    matches.forEach((matchInfo) => {
      // Add text before the tag
      if (matchInfo.index > lastIndex) {
        const text = label.substring(lastIndex, matchInfo.index);
        if (text) {
          parts.push(text);
        }
      }
      
      // Add appropriate display component or styled element
      if (matchInfo.type === 'ChampionImage' && matchInfo.id > 0) {
        // Get teamId if participantId is provided
        const teamId = matchInfo.participantId ? getTeamId(matchInfo.participantId) : undefined;
        parts.push(
          <ChampionDisplay 
            key={`champ-${key++}`} 
            championId={matchInfo.id} 
            size={24}
            teamId={teamId}
          />
        );
      } else if (matchInfo.type === 'ItemImage' && matchInfo.id > 0) {
        parts.push(
          <ItemDisplay 
            key={`item-${key++}`} 
            itemId={matchInfo.id} 
            size={32}
          />
        );
      } else if (matchInfo.type === 'PlayerName' && matchInfo.id > 0) {
        // Style player name based on teamId
        const teamId = getTeamId(matchInfo.id);
        const playerName = getPlayerName(matchInfo.id);
        let borderColor = 'rgba(255, 255, 255, 0.2)'; // default
        if (teamId === 100) {
          borderColor = '#3b82f6'; // blue
        } else if (teamId === 200) {
          borderColor = '#ef4444'; // red
        }
        parts.push(
          <span
            key={`player-${key++}`}
            style={{
              display: 'inline-block',
              padding: '2px 6px',
              borderRadius: '4px',
              border: `1px solid ${borderColor}`,
              backgroundColor: teamId === 100 ? 'rgba(59, 130, 246, 0.1)' : teamId === 200 ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
            }}
          >
            {playerName}
          </span>
        );
      }
      
      lastIndex = matchInfo.endIndex;
    });

    // Add remaining text after the last tag
    if (lastIndex < label.length) {
      const text = label.substring(lastIndex);
      if (text) {
        parts.push(text);
      }
    }

    // If no tags were found, return the original label as a string
    return parts.length > 0 ? parts : [label];
  }

  // Pre-compute event labels and titles to avoid recalculating on every render
  const eventLabels = useMemo(() => {
    return allEvents.map((event) => {
      const { type, eventType, data } = event;
      let label: string = type; // Default to type
      
      switch (eventType) {
        case 'kill':
          if (type === 'CHAMPION_KILL') {
            label = `Kill: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}> → <PlayerName=${data.victimId}> <ChampionImage=${getChampionId(data.victimId)}:${data.victimId}>`;
          } else if (type === 'CHAMPION_SPECIAL_KILL') {
            if (data.killType === 'KILL_FIRST_BLOOD') {
              label = `First Blood: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}>`;
            } else if (data.killType === 'KILL_MULTI') {
              let multiKillLabel = '';
              switch (data.multiKillLength) {
                case 2:
                  multiKillLabel = `Double Kill`;
                  break;
                case 3:
                  multiKillLabel = `Triple Kill`;
                  break;
                case 4:
                  multiKillLabel = `Quadra Kill`;
                  break;
                case 5:
                  multiKillLabel = `Penta Kill`;
                  break;
                default:
                  multiKillLabel = `Multi Kill`;
                  break;
              }
              label = `${multiKillLabel}: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}> `;
            } else {
              label = `Kill: P${data.killerId} → P${data.victimId}`;
            }
          } else if (type === 'ELITE_MONSTER_KILL') {
            if (data.monsterType === 'DRAGON') {
              if (data.monsterSubType === 'AIR_DRAGON') {
                label = `Air Dragon Slain: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}> `;
              } else if (data.monsterSubType === 'EARTH_DRAGON') {
                label = `Earth Dragon Slain: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}> `;
              } else if (data.monsterSubType === 'FIRE_DRAGON') {
                label = `Fire Dragon Slain: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}> `;
              } else if (data.monsterSubType === 'WATER_DRAGON') {
                label = `Water Dragon Slain: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}> `;
              } else if (data.monsterSubType === 'CHEMTECH_DRAGON') {
                label = `Chemtech Dragon Slain: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}> `;
              } else if (data.monsterSubType === 'HEXTECH_DRAGON') {
                label = `Hextech Dragon Slain: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}> `;
              } else if (data.monsterSubType === 'ELDER_DRAGON') {
                label = `Elder Dragon Slain: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}> `;
              } else {
                label = `Dragon Slain: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}> `;
              }
            } else if (data.monsterType === 'RIFTHERALD') {
              label = `Rift Herald Slain: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}>}`;
            } else if (data.monsterType === 'BARON_NASHOR') {
              label = `Baron Nashor Slain: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}>`;
            } else if (data.monsterType === 'HORDE') {
              label = `Void Grub Slain: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}> `;
            } else {
              label = `Monster Slain: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}> ${data.monsterType} ${data.monsterSubType ? ` (${data.monsterSubType})` : ''}`;
            }
          } else if (type === 'BUILDING_KILL') {
            if (data.buildingType === 'TOWER_BUILDING') {
              if (data.towerType === 'NEXUS_TURRET') {
                label = `Nexus Turret Destroyed: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}>`;
              } else {
                let position = '';
                if (data.laneType === 'TOP_LANE') {
                  position = 'Top';
                } else if (data.laneType === 'MID_LANE') {
                  position = 'Mid';
                } else if (data.laneType === 'BOT_LANE') {
                  position = 'Bot';
                }
                let tier = '';
                if (data.towerType === 'OUTER_TURRET') {
                  tier = 'I';
                } else if (data.towerType === 'INNER_TURRET') {
                  tier = 'II';
                } else if (data.towerType === 'BASE_TURRET') {
                  tier = 'III';
                }
                label = `${position} Tier ${tier} Turret Destroyed: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}>`;
              }
            } else if (data.buildingType === 'INHIBITOR_BUILDING') {
              label = `Inhibitor Destroyed: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}>`;
            } else {
              label = `Building Destroyed: <PlayerName=${data.killerId}> <ChampionImage=${getChampionId(data.killerId)}:${data.killerId}> ${data.buildingType}`;
            }
          }
          break;
        case 'skill':
          let slot = '';
          if (data.skillSlot === 1) {
            slot = 'Q';
          } else if (data.skillSlot === 2) {
            slot = 'W';
          } else if (data.skillSlot === 3) {
            slot = 'E';
          } else if (data.skillSlot === 4) {
            slot = 'R';
          }
          label = `<PlayerName=${data.participantId}> <ChampionImage=${getChampionId(data.participantId)}:${data.participantId}> Level Up: ${slot}`;
          break;
        case 'level':
          label = `<PlayerName=${data.participantId}> <ChampionImage=${getChampionId(data.participantId)}:${data.participantId}> Leveled Up: Level ${data.level}`;
          break;
        case 'item':
          if (type === 'ITEM_PURCHASED') label = `<PlayerName=${data.participantId}> <ChampionImage=${getChampionId(data.participantId)}:${data.participantId}> Buy: <ItemImage=${data.itemId}>`;
          else if (type === 'ITEM_SOLD') label = `<PlayerName=${data.participantId}> <ChampionImage=${getChampionId(data.participantId)}:${data.participantId}> Sell: <ItemImage=${data.itemId}>`;
          else if (type === 'ITEM_DESTROYED') label = `<PlayerName=${data.participantId}> <ChampionImage=${getChampionId(data.participantId)}:${data.participantId}> Item Destroyed: <ItemImage=${data.itemId}>`;
          else if (type === 'ITEM_UNDO') label = `<PlayerName=${data.participantId}> <ChampionImage=${getChampionId(data.participantId)}:${data.participantId}> Undo`;
          else label = type;
          break;
        case 'feat':
          let team = '';
          if (data.teamId === 100) {
            team = 'Blue';
          } else if (data.teamId === 200) {
            team = 'Red';
          }
          if (data.featType === 0) {
            if (data.featValue === 1) {
              label = `${team} team 1/3 kills for the feat of warfare`;
            } else if (data.featValue === 2) {
              label = `${team} team 2/3 kills for the feat of warfare`;
            } else if (data.featValue === 3) {
              label = `${team} team has taken the feat of warfare`;
            } else if (data.featValue === 1001) {
              label = `${team} team has lost the feat of warfare`;
            }
          }
          else if (data.featType === 1) {
            if (data.featValue === 1) {
              label = `${team} team has taken the first turret`;
            } else if (data.featValue === 1001) {
              label = `${team} team has lost the first turret`;
            }
          }
          else if (data.featType === 2) {
            if (data.featValue === 1) {
              label = `${team} team 1/3 Epic Monsters slain`;
            } else if (data.featValue === 2) {
              label = `${team} team 2/3 Epic Monsters slain for the feat of domination`;
            } else if (data.featValue === 3) {
              label = `${team} team has taken the feat of monster slaying`;
            } else if (data.featValue === 1001) {
              label = `${team} team has lost the feat of monster slaying`;
            }
          }
          else {
            label = `Feat: Team ${data.teamId} Type ${data.featType}`;
          }
          break;
        case 'game':
          label = type;
          break;
        default:
          label = type;
      }
      
      return label;
    });
  }, [allEvents]);

  // Pre-compute event titles (label + timestamp) to avoid function calls during render
  const eventTitles = useMemo(() => {
    return allEvents.map((event, index) => {
      const label = eventLabels[index] || event.type;
      const timeStr = formatTime(event.timestamp);
      return `${label} - ${timeStr}`;
    });
  }, [allEvents, eventLabels]);

  // Get event label - now just a lookup by index
  const getEventLabel = (index: number): string => {
    return eventLabels[index] || 'Unknown';
  };

  // Handle timeline click
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || gameDuration === 0) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * gameDuration;
    onTimeChange(newTime);
  };

  // Handle mouse move for dragging
  const handleMouseMove = useRef((e: MouseEvent) => {
    if (!isDragging || !timelineRef.current || gameDuration === 0) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * gameDuration;
    onTimeChange(newTime);
  });

  // Update the ref when dependencies change
  useEffect(() => {
    handleMouseMove.current = (e: MouseEvent) => {
      if (!isDragging || !timelineRef.current || gameDuration === 0) return;
      
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * gameDuration;
      onTimeChange(newTime);
    };
  }, [isDragging, gameDuration, onTimeChange]);

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const mouseMoveHandler = (e: MouseEvent) => handleMouseMove.current(e);
      window.addEventListener('mousemove', mouseMoveHandler);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', mouseMoveHandler);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Generate time markers every 5 minutes
  // This must be before the early return to maintain hook order
  const timeMarkers = useMemo(() => {
    if (gameDuration === 0) return [0];
    
    const markers: number[] = [];
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    for (let time = 0; time <= gameDuration; time += fiveMinutes) {
      markers.push(time);
    }
    
    // Ensure we always have at least the start marker
    if (markers.length === 0) {
      markers.push(0);
    }
    
    return markers;
  }, [gameDuration]);

  if (!gameData || gameDuration === 0) {
    return null;
  }

  const currentPercentage = gameDuration > 0 ? (currentTime / gameDuration) * 100 : 0;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        maxWidth: '1200px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderRadius: '8px',
        padding: '15px 20px',
        zIndex: 1000,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
        <div style={{ color: 'white', fontSize: '14px', fontFamily: 'monospace' }}>
          {formatTime(currentTime)} / {formatTime(gameDuration)}
        </div>

        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
          {visibleEvents.length} / {allEvents.length} events
        </div>
      </div>

      {/* Timeline */}
      <div
        ref={timelineRef}
        onClick={handleTimelineClick}
        onMouseDown={() => setIsDragging(true)}
        style={{
          position: 'relative',
          width: '100%',
          height: '90px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          cursor: 'pointer',
          overflow: 'hidden'
        }}
      >
        {/* Event markers */}
        {(() => {
          // Group events by timestamp to handle simultaneous events
          const eventsByTimestamp = new Map<number, TimelineEvent[]>();
          visibleEvents.forEach(event => {
            const timestamp = event.timestamp;
            if (!eventsByTimestamp.has(timestamp)) {
              eventsByTimestamp.set(timestamp, []);
            }
            eventsByTimestamp.get(timestamp)!.push(event);
          });

          // Render events with offsets for simultaneous ones
          const renderedMarkers: React.ReactElement[] = [];
          let visibleIndex = 0;

          eventsByTimestamp.forEach((events, timestamp) => {
            const percentage = (timestamp / gameDuration) * 100;
            const eventCount = events.length;
            
            events.forEach((event, indexInGroup) => {
              const color = getEventColor(event.eventType, event.type);
              // Get the original index using O(1) lookup
              const originalIndex = eventIndexMap.get(event);
              // Use pre-computed title - no function calls during render
              const title = originalIndex !== undefined ? eventTitles[originalIndex] : formatTime(event.timestamp);
              
              // Calculate offsets for simultaneous events
              // Dynamically space events based on how many are at the same timestamp
              // Maximum of 4 rows, evenly distributed with proper spacing to prevent overlap
              let verticalOffset = 0;
              if (eventCount > 1) {
                const numRows = Math.min(eventCount, 4); // Cap at 4 rows
                const rowIndex = indexInGroup % numRows; // Wrap if more than 4 events
                if (numRows === 1) {
                  verticalOffset = 0;
                } else if (numRows === 2) {
                  verticalOffset = rowIndex === 0 ? -24 : 24;
                } else if (numRows === 3) {
                  verticalOffset = rowIndex === 0 ? -24 : rowIndex === 1 ? 0 : 24;
                } else { // 4 rows - increased spacing to prevent overlap (markers are 20px tall)
                  verticalOffset = rowIndex === 0 ? -30 : rowIndex === 1 ? -10 : rowIndex === 2 ? 10 : 30;
                }
              }
              
              const isHovered = hoveredEvent === event;
              renderedMarkers.push(
                <div
                  key={`${timestamp}-${indexInGroup}`}
                  onMouseEnter={() => setHoveredEvent(event)}
                  onMouseLeave={() => setHoveredEvent(null)}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent timeline click
                    if (onEventSelect) {
                      onEventSelect(event);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: `${percentage}%`,
                    top: `calc(50% + ${verticalOffset}px)`,
                    transform: 'translate(-50%, -50%)',
                    width: isHovered && onEventSelect ? '6px' : '4px',
                    height: isHovered && onEventSelect ? '24px' : '20px',
                    backgroundColor: color,
                    borderRadius: '2px',
                    cursor: onEventSelect ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    zIndex: isHovered ? 10 : 1,
                    boxShadow: isHovered ? `0 0 8px ${color}` : 'none'
                  }}
                  title={title + (onEventSelect ? ' (Click to select)' : '')}
                />
              );
              visibleIndex++;
            });
          });

          return renderedMarkers;
        })()}

        {/* Current time indicator */}
        <div
          style={{
            position: 'absolute',
            left: `${currentPercentage}%`,
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: '#ffffff',
            transform: 'translateX(-50%)',
            zIndex: 5,
            boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '8px solid #ffffff'
            }}
          />
        </div>

        {/* Time markers - every 5 minutes */}
        {timeMarkers.map((markerTime) => {
          const percentage = (markerTime / gameDuration) * 100;
          return (
            <div
              key={markerTime}
              style={{
                position: 'absolute',
                left: `${percentage}%`,
                top: 0,
                bottom: 0,
                width: '1px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                transform: 'translateX(-50%)'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: '4px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '10px',
                  whiteSpace: 'nowrap'
                }}
              >
                {formatTime(markerTime)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Event info tooltip */}
      {hoveredEvent && (() => {
        const hoveredIndex = eventIndexMap.get(hoveredEvent);
        return (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: `${(hoveredEvent.timestamp / gameDuration) * 100}%`,
              transform: 'translateX(-50%)',
              marginBottom: '10px',
              padding: '8px 12px',
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              color: 'white',
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              border: `1px solid ${getEventColor(hoveredEvent.eventType, hoveredEvent.type)}`,
              zIndex: 1001
            }}
          >
            <div style={{ fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {hoveredIndex !== undefined 
                ? parseLabelWithImages(getEventLabel(hoveredIndex))
                : hoveredEvent.type}
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px' }}>
              {formatTime(hoveredEvent.timestamp)}
            </div>
          </div>
        );
      })()}

      {/* Legend with toggles */}
      <div style={{ display: 'flex', gap: '15px', marginTop: '10px', flexWrap: 'wrap', fontSize: '11px' }}>
        {/* Kills toggle */}
        <button
          onClick={() => setEventVisibility(prev => ({ ...prev, kill: !prev.kill }))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: eventVisibility.kill ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            opacity: eventVisibility.kill ? 1 : 0.5
          }}
          title="Toggle kill events"
        >
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#ef4444', 
            borderRadius: '2px',
            opacity: eventVisibility.kill ? 1 : 0.3
          }} />
          <span style={{ textDecoration: eventVisibility.kill ? 'none' : 'line-through' }}>Kills</span>
          <span style={{ fontSize: '10px', marginLeft: '4px' }}>
            ({eventCounts.kill})
          </span>
        </button>

        {/* Skills toggle */}
        <button
          onClick={() => setEventVisibility(prev => ({ ...prev, skill: !prev.skill }))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: eventVisibility.skill ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            opacity: eventVisibility.skill ? 1 : 0.5
          }}
          title="Toggle skill events"
        >
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#3b82f6', 
            borderRadius: '2px',
            opacity: eventVisibility.skill ? 1 : 0.3
          }} />
          <span style={{ textDecoration: eventVisibility.skill ? 'none' : 'line-through' }}>Skills</span>
          <span style={{ fontSize: '10px', marginLeft: '4px' }}>
            ({eventCounts.skill})
          </span>
        </button>

        {/* Levels toggle */}
        <button
          onClick={() => setEventVisibility(prev => ({ ...prev, level: !prev.level }))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: eventVisibility.level ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            opacity: eventVisibility.level ? 1 : 0.5
          }}
          title="Toggle level events"
        >
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#10b981', 
            borderRadius: '2px',
            opacity: eventVisibility.level ? 1 : 0.3
          }} />
          <span style={{ textDecoration: eventVisibility.level ? 'none' : 'line-through' }}>Levels</span>
          <span style={{ fontSize: '10px', marginLeft: '4px' }}>
            ({eventCounts.level})
          </span>
        </button>

        {/* Items toggle */}
        <button
          onClick={() => setEventVisibility(prev => ({ ...prev, item: !prev.item }))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: eventVisibility.item ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            opacity: eventVisibility.item ? 1 : 0.5
          }}
          title="Toggle item events"
        >
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#f59e0b', 
            borderRadius: '2px',
            opacity: eventVisibility.item ? 1 : 0.3
          }} />
          <span style={{ textDecoration: eventVisibility.item ? 'none' : 'line-through' }}>Items</span>
          <span style={{ fontSize: '10px', marginLeft: '4px' }}>
            ({eventCounts.item})
          </span>
        </button>

        {/* Feats toggle */}
        <button
          onClick={() => setEventVisibility(prev => ({ ...prev, feat: !prev.feat }))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: eventVisibility.feat ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            opacity: eventVisibility.feat ? 1 : 0.5
          }}
          title="Toggle feat events"
        >
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#6366f1', 
            borderRadius: '2px',
            opacity: eventVisibility.feat ? 1 : 0.3
          }} />
          <span style={{ textDecoration: eventVisibility.feat ? 'none' : 'line-through' }}>Feats</span>
          <span style={{ fontSize: '10px', marginLeft: '4px' }}>
            ({eventCounts.feat})
          </span>
        </button>

        {/* Game events toggle */}
        <button
          onClick={() => setEventVisibility(prev => ({ ...prev, game: !prev.game }))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: eventVisibility.game ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            opacity: eventVisibility.game ? 1 : 0.5
          }}
          title="Toggle game events"
        >
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#9ca3af', 
            borderRadius: '2px',
            opacity: eventVisibility.game ? 1 : 0.3
          }} />
          <span style={{ textDecoration: eventVisibility.game ? 'none' : 'line-through' }}>Game</span>
          <span style={{ fontSize: '10px', marginLeft: '4px' }}>
            ({eventCounts.game})
          </span>
        </button>
      </div>

      {/* Player filters - only one selectable at a time */}
      {gameData?.match_data?.participants && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', fontSize: '11px', alignItems: 'center' }}>
          
          {/* All players button */}
          <button
            onClick={() => setSelectedPlayerId(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: selectedPlayerId === null ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
              backgroundColor: selectedPlayerId === null ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              border: selectedPlayerId === null ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              opacity: selectedPlayerId === null ? 1 : 0.6
            }}
            title="Show all players"
          >
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%',
              backgroundColor: selectedPlayerId === null ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
              border: selectedPlayerId === null ? '2px solid #ffffff' : '2px solid rgba(255, 255, 255, 0.3)'
            }} />
            <span>All</span>
          </button>

          {/* Individual player buttons */}
          {gameData.match_data.participants
            .sort((a, b) => {
              // Sort by team (blue first), then by participantId
              if (a.teamId !== b.teamId) {
                return (a.teamId || 0) - (b.teamId || 0);
              }
              return a.participantId - b.participantId;
            })
            .map((participant) => {
              const isSelected = selectedPlayerId === participant.participantId;
              const teamId = participant.teamId;
              const borderColor = teamId === 100 
                ? '#3b82f6' // blue
                : teamId === 200 
                ? '#ef4444' // red
                : 'rgba(255, 255, 255, 0.2)';
              const bgColor = teamId === 100 
                ? 'rgba(59, 130, 246, 0.15)' 
                : teamId === 200 
                ? 'rgba(239, 68, 68, 0.15)' 
                : 'transparent';

              return (
                <button
                  key={participant.participantId}
                  onClick={() => setSelectedPlayerId(participant.participantId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: isSelected ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
                    backgroundColor: isSelected ? bgColor : 'transparent',
                    border: isSelected ? `1px solid ${borderColor}` : '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: isSelected ? 1 : 0.6
                  }}
                  title={`Filter events for ${participant.riotIdGameName || `Player ${participant.participantId}`}`}
                >
                  <div style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%',
                    backgroundColor: isSelected ? borderColor : 'rgba(255, 255, 255, 0.3)',
                    border: isSelected ? `2px solid ${borderColor}` : '2px solid rgba(255, 255, 255, 0.3)'
                  }} />
                  <ChampionDisplay 
                    championId={participant.championId} 
                    size={16}
                    teamId={teamId}
                  />
                  <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {participant.riotIdGameName || `P${participant.participantId}`}
                  </span>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}

