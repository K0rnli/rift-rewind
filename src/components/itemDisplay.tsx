import { getItemImageUrl, getItemName, getItemDescription, getSizeClasses, useImageContext } from "@/app/context/imageHelper";
import { parseItemDescription } from "@/lib/textUtils";

export function ItemDisplay({ itemId , size = 48 }: { itemId: number, size: 16 | 32 | 48 | 64 }) {
    const { itemImageMap } = useImageContext();
    const itemImageUrl = getItemImageUrl(itemId, itemImageMap);
    const itemName = getItemName(itemId, itemImageMap);
    const sizeClasses = getSizeClasses(size);
    const itemDescription = getItemDescription(itemId, itemImageMap);
    
    if (itemId === 0) {
        return (
            <div className={`${sizeClasses} rounded bg-slate-700 ring-1 ring-slate-600 flex items-center justify-center`}>
                
            </div>
        );
    }
    else if (!itemImageUrl || !itemName || !itemDescription) {
        return (
            <div className={`${sizeClasses} rounded bg-slate-700 ring-1 ring-slate-600 flex items-center justify-center`}>
                <span className="text-slate-300 text-xl">?</span>
            </div>
        );
    }
    
    const parsedDescription = parseItemDescription(itemDescription);
    
    return (
        <div className={`relative group ${sizeClasses} rounded bg-slate-700 ring-1 ring-slate-600 flex items-center justify-center`}>
            <div className="w-full h-full rounded overflow-hidden">
                <img src={itemImageUrl} alt={itemName} className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-full left-1/2 w-48 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-slate-200 text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs">
                <div className="font-semibold mb-1">{itemName}</div>
                {itemDescription && (
                    <div className="text-slate-400 text-xs whitespace-normal">
                        {parsedDescription}
                    </div>
                )}
            </div>
        </div>
    )
}