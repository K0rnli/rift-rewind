import React from "react";

export function parseItemDescription(description: string, keyPrefix: string = ''): React.ReactNode[] {
    if (!description) return [];
    
    let keyCounter = 0;
    
    // Regex to match tags like <tag> or </tag>
    const tagRegex = /<\/?([^>]+)>/g;
    const matches: Array<{ fullMatch: string; tagName: string; index: number; isClosing: boolean }> = [];
    
    let match;
    while ((match = tagRegex.exec(description)) !== null) {
        matches.push({
            fullMatch: match[0],
            tagName: match[1],
            index: match.index,
            isClosing: match[0].startsWith('</')
        });
    }
    
    // Process tags recursively
    function processTags(startIndex: number, endIndex: number): React.ReactNode[] {
        const result: React.ReactNode[] = [];
        let pos = startIndex;
        
        // Find tags within this range
        const relevantTags = matches.filter(m => m.index >= startIndex && m.index < endIndex);
        
        for (let i = 0; i < relevantTags.length; i++) {
            const tag = relevantTags[i];
            
            // Add text before the tag
            if (tag.index > pos) {
                const text = description.substring(pos, tag.index);
                if (text.trim()) {
                    result.push(text);
                }
            }
            
            // Handle self-closing tags like <br>
            if (tag.tagName === 'br' && !tag.isClosing) {
                result.push(<br key={`${keyPrefix}-br-${keyCounter++}`} />);
                pos = tag.index + tag.fullMatch.length;
                continue;
            }
            
            // Handle opening tags - find matching closing tag
            if (!tag.isClosing) {
                let depth = 1;
                let closingIndex = -1;
                
                for (let j = i + 1; j < relevantTags.length; j++) {
                    const nextTag = relevantTags[j];
                    if (nextTag.tagName === tag.tagName) {
                        if (nextTag.isClosing) {
                            depth--;
                            if (depth === 0) {
                                closingIndex = j;
                                break;
                            }
                        } else {
                            depth++;
                        }
                    }
                }
                
                if (closingIndex !== -1) {
                    const closingTag = relevantTags[closingIndex];
                    const contentStart = tag.index + tag.fullMatch.length;
                    const contentEnd = closingTag.index;
                    const contentParts = processTags(contentStart, contentEnd);
                    
                    // Apply styling based on tag
                    const tagKey = `${keyPrefix}-${tag.tagName}-${keyCounter++}`;
                    switch (tag.tagName) {
                        case 'mainText':
                            result.push(<span key={tagKey} className="text-slate-300">{contentParts}</span>);
                            break;
                        case 'stats':
                            result.push(<span key={tagKey} className="text-[#0e5e6b] font-semibold">{contentParts}</span>);
                            break;
                        case 'passive':
                            result.push(<span key={tagKey} className="text-[#857450]">{contentParts}</span>);
                            break;
                        case 'li':
                            result.push(<li key={tagKey} className="ml-4 list-disc">{contentParts}</li>);
                            break;
                        case 'rules':
                            result.push(<span key={tagKey} className="text-slate-500 italic">{contentParts}</span>);
                            break;
                        default:
                            result.push(...contentParts);
                    }
                    
                    pos = closingTag.index + closingTag.fullMatch.length;
                    i = closingIndex; // Skip to after closing tag
                } else {
                    // No closing tag found, treat as text
                    pos = tag.index + tag.fullMatch.length;
                }
            } else {
                // Closing tag without opening - skip
                pos = tag.index + tag.fullMatch.length;
            }
        }
        
        // Add remaining text
        if (pos < endIndex) {
            const text = description.substring(pos, endIndex);
            if (text.trim()) {
                result.push(text);
            }
        }
        
        return result;
    }
    
    const parsed = processTags(0, description.length);
    return parsed.length > 0 ? parsed : [description];
}

export function parsePerkDescription(description: string): React.ReactNode[] {
    if (!description) return [];
    
    let keyCounter = 0;
    
    // Regex to match tags like <tag> or </tag>
    const tagRegex = /<\/?([^>]+)>/g;
    const matches: Array<{ fullMatch: string; tagName: string; index: number; isClosing: boolean }> = [];
    
    let match;
    while ((match = tagRegex.exec(description)) !== null) {
        matches.push({
            fullMatch: match[0],
            tagName: match[1],
            index: match.index,
            isClosing: match[0].startsWith('</')
        });
    }
    
    // Process tags recursively
    function processTags(startIndex: number, endIndex: number): React.ReactNode[] {
        const result: React.ReactNode[] = [];
        let pos = startIndex;
        
        // Find tags within this range
        const relevantTags = matches.filter(m => m.index >= startIndex && m.index < endIndex);
        
        for (let i = 0; i < relevantTags.length; i++) {
            const tag = relevantTags[i];
            
            // Add text before the tag
            if (tag.index > pos) {
                const text = description.substring(pos, tag.index);
                if (text.trim()) {
                    result.push(text);
                }
            }
            
            // Handle self-closing tags like <br>
            if (tag.tagName === 'br' && !tag.isClosing) {
                result.push(<br key={`br-${keyCounter++}`} />);
                pos = tag.index + tag.fullMatch.length;
                continue;
            }
            
            // Handle opening tags - find matching closing tag
            if (!tag.isClosing) {
                let depth = 1;
                let closingIndex = -1;
                
                for (let j = i + 1; j < relevantTags.length; j++) {
                    const nextTag = relevantTags[j];
                    if (nextTag.tagName === tag.tagName) {
                        if (nextTag.isClosing) {
                            depth--;
                            if (depth === 0) {
                                closingIndex = j;
                                break;
                            }
                        } else {
                            depth++;
                        }
                    }
                }
                
                if (closingIndex !== -1) {
                    const closingTag = relevantTags[closingIndex];
                    const contentStart = tag.index + tag.fullMatch.length;
                    const contentEnd = closingTag.index;
                    const contentParts = processTags(contentStart, contentEnd);
                    
                    // Apply styling based on tag
                    const tagKey = `${tag.tagName}-${keyCounter++}`;
                    switch (tag.tagName) {
                        case 'mainText':
                            result.push(<span key={tagKey} className="text-slate-300">{contentParts}</span>);
                            break;
                        case 'stats':
                            result.push(<span key={tagKey} className="text-[#0e5e6b] font-semibold">{contentParts}</span>);
                            break;
                        case 'passive':
                            result.push(<span key={tagKey} className="text-[#857450]">{contentParts}</span>);
                            break;
                        case 'li':
                            result.push(<li key={tagKey} className="ml-4 list-disc">{contentParts}</li>);
                            break;
                        case 'rules':
                            result.push(<span key={tagKey} className="text-slate-500 italic">{contentParts}</span>);
                            break;
                        default:
                            result.push(...contentParts);
                    }
                    
                    pos = closingTag.index + closingTag.fullMatch.length;
                    i = closingIndex; // Skip to after closing tag
                } else {
                    // No closing tag found, treat as text
                    pos = tag.index + tag.fullMatch.length;
                }
            } else {
                // Closing tag without opening - skip
                pos = tag.index + tag.fullMatch.length;
            }
        }
        
        // Add remaining text
        if (pos < endIndex) {
            const text = description.substring(pos, endIndex);
            if (text.trim()) {
                result.push(text);
            }
        }
        
        return result;
    }
    
    const parsed = processTags(0, description.length);
    return parsed.length > 0 ? parsed : [description];
}