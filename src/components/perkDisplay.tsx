import { getPerkImageUrl, getPerkName, useImageSize, getSizeClasses, getPerkStyleImageUrl, getPerkStyleName, getPerkDescription, getPerkStyleDescription } from "@/app/context/imageHelper";
import { parsePerkDescription } from "@/lib/textUtils";

export function PerkDisplay({ perkId , size = 48 }: { perkId: number, size?: 16 | 24 | 32 | 48 | 64 }) {
    const perkImageUrl = getPerkImageUrl(perkId);
    const perkName = getPerkName(perkId);
    const sizeClasses = getSizeClasses(size);
    const perkDescription = getPerkDescription(perkId);
    
    if (perkId === 0) {
        return (
            <div className={`${sizeClasses} rounded bg-slate-700 ring-1 ring-slate-600 flex items-center justify-center`}>
                
            </div>
        );
    }
    else if (!perkImageUrl || !perkName || !perkDescription) {
        return (
            <div className={`${sizeClasses} rounded bg-slate-700 ring-1 ring-slate-600 flex items-center justify-center`}>
                <span className="text-slate-300 text-xl">?</span>
            </div>
        );
    }
     
    const parsedDescription = parsePerkDescription(perkDescription);
    
    return (
        <div className={`relative group ${sizeClasses} rounded bg-slate-700 ring-1 ring-slate-600 flex items-center justify-center`}>
            <div className="w-full h-full rounded overflow-hidden">
                <img src={perkImageUrl} alt={perkName} className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-full left-1/2 w-48 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-slate-200 text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs">
                <div className="font-semibold mb-1">{perkName}</div>
                {perkDescription && (
                    <div className="text-slate-400 text-xs whitespace-normal">
                        {parsedDescription}
                    </div>
                )}
            </div>
        </div>
    )
}

export function PerkStyleDisplay({ perkStyleId , size = 48 }: { perkStyleId: number, size: 16 | 24 | 32 | 48 | 64 }) {
    const perkStyleImageUrl = getPerkStyleImageUrl(perkStyleId);
    const perkStyleName = getPerkStyleName(perkStyleId);
    const sizeClasses = getSizeClasses(size);
    const perkStyleDescription = getPerkStyleDescription(perkStyleId);
    
    if (perkStyleId === 0) {
        return (
            <div className={`${sizeClasses} rounded bg-slate-700 ring-1 ring-slate-600 flex items-center justify-center`}>
                
            </div>
        );
    }
    else if (!perkStyleImageUrl || !perkStyleName || !perkStyleDescription) {
        return (
            <div className={`${sizeClasses} rounded bg-slate-700 ring-1 ring-slate-600 flex items-center justify-center`}>
                <span className="text-slate-300 text-xl">?</span>
            </div>
        );
    }
    
    return (
        <div className={`relative group ${sizeClasses} rounded bg-slate-700 ring-1 ring-slate-600 flex items-center justify-center`}>
            <div className="w-full h-full rounded overflow-hidden">
                <img src={perkStyleImageUrl} alt={perkStyleName} className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-full left-1/2 w-48 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-slate-200 text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs">
                <div className="font-semibold mb-1">{perkStyleName}</div>
                {perkStyleDescription && (
                    <div className="text-slate-400 text-xs whitespace-normal">
                        {perkStyleDescription}
                    </div>
                )}
            </div>
        </div>
    )
}