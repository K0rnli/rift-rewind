import { getChampionImageUrl, getChampionName, useImageSize, getSizeClasses } from "@/app/context/imageHelper";

export function ChampionDisplay({ championId , size = 48, teamId }: { championId: number, size: 16 | 24 | 32 | 48 | 64, teamId?: number }) {
    const championImageUrl = getChampionImageUrl(championId);
    const championName = getChampionName(championId);
    const sizeClasses = getSizeClasses(size);
    
    // Determine ring color based on teamId
    let ringColorClass = 'ring-slate-600'; // default
    if (teamId === 100) {
        ringColorClass = 'ring-blue-500';
    } else if (teamId === 200) {
        ringColorClass = 'ring-red-500';
    }
    
    if (championId === 0) {
        return (
            <div className={`${sizeClasses} rounded bg-slate-700 ring-1 ${ringColorClass} flex items-center justify-center`}>
                
            </div>
        );
    }
    else if (!championImageUrl || !championName) {
        return (
            <div className={`${sizeClasses} rounded bg-slate-700 ring-1 ${ringColorClass} flex items-center justify-center`}>
                <span className="text-slate-300 text-xl">?</span>
            </div>
        );
    }
    return (
        <div className={`relative group ${sizeClasses} rounded bg-slate-700 ring-1 ${ringColorClass} flex items-center justify-center`}>
            <div className="w-full h-full rounded overflow-hidden">
                <img src={championImageUrl} alt={championName} className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-slate-200 text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                <div className="font-semibold mb-1">{championName}</div>
            </div>
        </div>
    )
}