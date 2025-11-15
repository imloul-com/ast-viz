import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export interface ShareableState {
  grammar: string;
  programText?: string;
}

/**
 * Encodes grammar and program text into a compressed URL-safe string
 */
export const encodeStateToUrl = (state: ShareableState): string => {
  const json = JSON.stringify(state);
  const compressed = compressToEncodedURIComponent(json);
  
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#share=${compressed}`;
};

/**
 * Decodes grammar and program text from URL hash
 * Returns null if no valid share data is found
 */
export const decodeStateFromUrl = (): ShareableState | null => {
  try {
    const hash = window.location.hash;
    
    if (!hash || !hash.includes('share=')) {
      return null;
    }
    
    // Extract the share parameter
    const shareMatch = hash.match(/share=([^&]+)/);
    if (!shareMatch) {
      return null;
    }
    
    const compressed = shareMatch[1];
    const decompressed = decompressFromEncodedURIComponent(compressed);
    
    if (!decompressed) {
      console.error('Failed to decompress share data');
      return null;
    }
    
    const state = JSON.parse(decompressed) as ShareableState;
    
    // Validate the state has required fields
    if (!state.grammar) {
      console.error('Invalid share data: missing grammar');
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Error decoding state from URL:', error);
    return null;
  }
};

/**
 * Clears the share data from the URL without reloading the page
 */
export const clearShareUrl = (): void => {
  // Remove the hash without reloading
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
};

