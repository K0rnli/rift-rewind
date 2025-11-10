"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface item {
    id: number,
    name: string,
    description: string,
    active: boolean,
    inStore: boolean,
    from: number[],
    to: number[],
    categories: string[],
    maxStacks: number,
    requiredChampion: string,
    requiredAlly: string,
    requiredBuffCurrencyName: string,
    requiredBuffCurrencyCost: number,
    specialRecipe: number,
    isEnchantment: boolean,
    price: number,
    priceTotal: number,
    displayInItemSets: boolean,
    iconPath: string,
}

interface champion {
    id: number,
    name: string,
    description: string,
    alias: string,
    contentId: string,
    squarePortraitPath: string,
    roles: string[],
}

interface perk {
    id: number,
    name: string,
    majorChangePatchVersion: string,
    tooltip: string,
    shortDesc: string,
    longDesc: string,
    recommendationDescriptor: string,
    iconPath: string,
}

interface summonerSpell {
    id: number,
    name: string,
    description: string,
    summonerLevel: number,
    cooldown: number,
    gameModes: string[],
    iconPath: string,
}

interface perkStyle {
    id: number,
    name: string,
    tooltip: string,
    iconPath: string,
}

interface itemImageMap {
    [key: number]: item,
}

interface championImageMap {
    [key: number]: champion,
}

interface perkImageMap {
    [key: number]: perk,
}

interface perkStyleImageMap {
    [key: number]: perkStyle,
}

interface summonerSpellImageMap {
    [key: number]: summonerSpell,
}

interface ImageContextType {
    itemImageMap: itemImageMap;
    championImageMap: championImageMap;
    perkImageMap: perkImageMap;
    perkStyleImageMap: perkStyleImageMap;
    summonerSpellImageMap: summonerSpellImageMap;
    loading: boolean;
    error: string | null;
}

const ImageContext = createContext<ImageContextType | undefined>(undefined);

export function ImageProvider({ children }: { children: ReactNode }) {
    const [itemImageMap, setItemImageMap] = useState<itemImageMap>({});
    const [championImageMap, setChampionImageMap] = useState<championImageMap>({});
    const [perkImageMap, setPerkImageMap] = useState<perkImageMap>({});
    const [perkStyleImageMap, setPerkStyleImageMap] = useState<perkStyleImageMap>({});
    const [summonerSpellImageMap, setSummonerSpellImageMap] = useState<summonerSpellImageMap>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const itemResponse = await fetch(
                    'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/items.json'
                );
                
                if (!itemResponse.ok) {
                    throw new Error(`Failed to fetch items: ${itemResponse.statusText}`);
                }
                
                const items: item[] = await itemResponse.json();
                
                // Create a map indexed by item ID
                const map: itemImageMap = {};
                items.forEach((item) => {
                    map[item.id] = item;
                });
                
                setItemImageMap(map);

                const championResponse = await fetch(
                    'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json'
                );
                
                if (!championResponse.ok) {
                    throw new Error(`Failed to fetch champions: ${championResponse.statusText}`);
                }
                
                const champions: champion[] = await championResponse.json();
                
                // Create a map indexed by champion ID
                const championMap: championImageMap = {};
                champions.forEach((champion) => {
                    championMap[champion.id] = champion;
                });
                setChampionImageMap(championMap);

                const perkResponse = await fetch(
                    'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perks.json'
                );
                
                if (!perkResponse.ok) {
                    throw new Error(`Failed to fetch perks: ${perkResponse.statusText}`);
                }
                
                const perks: perk[] = await perkResponse.json();
                
                const perkMap: perkImageMap = {};
                perks.forEach((perk) => {
                    perkMap[perk.id] = perk;
                });
                setPerkImageMap(perkMap);

                const perkStyleResponse = await fetch(
                    'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perkstyles.json'
                );
                
                if (!perkStyleResponse.ok) {
                    throw new Error(`Failed to fetch perk styles: ${perkStyleResponse.statusText}`);
                }
                const perkStylesData: { schemaVersion: number; styles: perkStyle[] } = await perkStyleResponse.json();
                const perkStyleMap: perkStyleImageMap = {};
                perkStylesData.styles.forEach((perkStyle) => {
                    perkStyleMap[perkStyle.id] = perkStyle;
                });

                setPerkStyleImageMap(perkStyleMap);

                const summonerSpellResponse = await fetch(
                    'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/summoner-spells.json'
                );
                
                if (!summonerSpellResponse.ok) {
                    throw new Error(`Failed to fetch summoner spells: ${summonerSpellResponse.statusText}`);
                }
                const summonerSpells: summonerSpell[] = await summonerSpellResponse.json();
                const summonerSpellMap: summonerSpellImageMap = {};
                summonerSpells.forEach((summonerSpell) => {
                    summonerSpellMap[summonerSpell.id] = summonerSpell;
                });
                setSummonerSpellImageMap(summonerSpellMap);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch items');
                console.error('Error fetching items:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, []);

    return (
        <ImageContext.Provider value={{ itemImageMap, championImageMap, perkImageMap, perkStyleImageMap, summonerSpellImageMap, loading, error }}>
            {children}
        </ImageContext.Provider>
    );
}

export function getItemImageUrl(itemId: number, itemImageMap: itemImageMap) {
    return "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/items/icons2d/" + itemImageMap[itemId]?.iconPath.slice(43).toLowerCase() ;
}

export function getItemName(itemId: number, itemImageMap: itemImageMap) {
    return itemImageMap[itemId]?.name;
}

export function getItemDescription(itemId: number, itemImageMap: itemImageMap) {
    return itemImageMap[itemId]?.description;
}

export function getChampionImageUrl(championId: number, championImageMap: championImageMap) {
    return "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/" + championImageMap[championId]?.squarePortraitPath.slice(40).toLowerCase() ;
}

export function getPerkImageUrl(perkId: number, perkImageMap: perkImageMap) {
    return "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/styles/" + perkImageMap[perkId]?.iconPath.slice(44).toLowerCase() ;
}

export function getPerkName(perkId: number, perkImageMap: perkImageMap) {
    return perkImageMap[perkId]?.name;
}

export function getPerkDescription(perkId: number, perkImageMap: perkImageMap) {
    return perkImageMap[perkId]?.longDesc;
}

export function getPerkStyleImageUrl(perkStyleId: number, perkStyleImageMap: perkStyleImageMap) {
    return "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/styles/" + perkStyleImageMap[perkStyleId]?.iconPath.slice(44).toLowerCase() ;
}

export function getPerkStyleName(perkStyleId: number, perkStyleImageMap: perkStyleImageMap) {
    return perkStyleImageMap[perkStyleId]?.name;
}

export function getPerkStyleDescription(perkStyleId: number, perkStyleImageMap: perkStyleImageMap) {
    return perkStyleImageMap[perkStyleId]?.tooltip;
}

export function getChampionName(championId: number, championImageMap: championImageMap) {
    return championImageMap[championId]?.name;
}

export function getSummonerImageUrl(summonerId: number, summonerSpellImageMap: summonerSpellImageMap) {
    return "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/data/spells/icons2d/" + summonerSpellImageMap[summonerId]?.iconPath.slice(42).toLowerCase() ;
}

export function getSummonerName(summonerId: number, summonerSpellImageMap: summonerSpellImageMap) {
    return summonerSpellImageMap[summonerId]?.name;
}

export function getSummonerDescription(summonerId: number, summonerSpellImageMap: summonerSpellImageMap) {
    return summonerSpellImageMap[summonerId]?.description;
}

export function useImageContext() {
    const context = useContext(ImageContext);
    if (context === undefined) {
        throw new Error('useImageContext must be used within an ImageProvider');
    }
    return context;
}

// Image Size Context
type ImageSize = 16 | 24 | 32 | 48 | 64;

interface ImageSizeContextType {
    imageSize: ImageSize;
    setImageSize: (size: ImageSize) => void;
}

const ImageSizeContext = createContext<ImageSizeContextType | undefined>(undefined);

export function ImageSizeProvider({ children }: { children: ReactNode }) {
    const [imageSize, setImageSize] = useState<ImageSize>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('imageSize');
            if (saved && ['16', '32', '48', '64'].includes(saved)) {
                return parseInt(saved) as ImageSize;
            }
        }
        return 48; // Default to 48x48
    });

    const handleSetImageSize = (size: ImageSize) => {
        setImageSize(size);
        if (typeof window !== 'undefined') {
            localStorage.setItem('imageSize', size.toString());
        }
    };

    return (
        <ImageSizeContext.Provider value={{ imageSize, setImageSize: handleSetImageSize }}>
            {children}
        </ImageSizeContext.Provider>
    );
}

export function useImageSize() {
    const context = useContext(ImageSizeContext);
    if (context === undefined) {
        throw new Error('useImageSize must be used within an ImageSizeProvider');
    }
    return context;
}

export function getSizeClasses(size: ImageSize): string {
    const sizeMap: Record<ImageSize, string> = {
        16: 'w-4 h-4',
        24: 'w-6 h-6',
        32: 'w-8 h-8',
        48: 'w-12 h-12',
        64: 'w-16 h-16',
    };
    return sizeMap[size];
}