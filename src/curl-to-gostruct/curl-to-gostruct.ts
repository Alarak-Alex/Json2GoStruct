/**
 * cURL to Go struct converter
 * Extracts JSON from cURL commands and converts to Go structs
 */

import { jsonToGo } from '../json-to-go/json-to-go';

export function curlToGoStruct(curlCommand: string): string {
    try {
        const jsonData = extractJsonFromCurl(curlCommand);
        if (!jsonData) {
            return '// No JSON data found in curl command';
        }
        
        const result = jsonToGo(jsonData, 'RequestStruct', 'main', false);
        if (result.error) {
            return `// Error generating struct: ${result.error}`;
        }
        
        return result.go;
    } catch (error: any) {
        return `// Error processing curl command: ${error.message}`;
    }
}

function extractJsonFromCurl(curlCommand: string): string | null {
    // Extract data from -d or --data flags
    const dataMatches = [
        curlCommand.match(/-d\s+["']([^"']*)["']/),
        curlCommand.match(/--data\s+["']([^"']*)["']/),
        curlCommand.match(/-d\s+([^\s]+)/),
        curlCommand.match(/--data\s+([^\s]+)/)
    ];
    
    for (const match of dataMatches) {
        if (match && match[1]) {
            const data = match[1];
            // Check if it's valid JSON
            try {
                JSON.parse(data);
                return data;
            } catch (e) {
                // Not valid JSON, continue searching
            }
        }
    }
    
    // Extract from --data-raw flag
    const dataRawMatch = curlCommand.match(/--data-raw\s+["']([^"']*)["']/);
    if (dataRawMatch && dataRawMatch[1]) {
        try {
            JSON.parse(dataRawMatch[1]);
            return dataRawMatch[1];
        } catch (e) {
            // Not valid JSON
        }
    }
    
    // Look for JSON-like patterns in the command
    const jsonPattern = /\{[^}]*\}/g;
    const jsonMatches = curlCommand.match(jsonPattern);
    
    if (jsonMatches) {
        for (const jsonMatch of jsonMatches) {
            try {
                JSON.parse(jsonMatch);
                return jsonMatch;
            } catch (e) {
                // Not valid JSON, continue
            }
        }
    }
    
    return null;
}

// Export is handled by the export keyword above