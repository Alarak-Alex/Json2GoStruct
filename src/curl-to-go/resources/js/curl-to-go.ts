/**
 * cURL to Go converter
 * Converts cURL commands to Go HTTP client code
 */

interface ParsedCurl {
    url: string;
    method: string;
    headers: { [key: string]: string };
    data: string;
    params: { [key: string]: string };
}

export function curlToGo(curlCommand: string): string {
    try {
        const parsed = parseCurl(curlCommand);
        return generateGoCode(parsed);
    } catch (error: any) {
        return `// Error parsing cURL command: ${error.message}`;
    }
}

function parseCurl(curlCommand: string): ParsedCurl {
    const result: ParsedCurl = {
        url: '',
        method: 'GET',
        headers: {},
        data: '',
        params: {}
    };
    
    // Remove 'curl' from the beginning
    let command = curlCommand.trim();
    if (command.startsWith('curl ')) {
        command = command.substring(5);
    }
    
    // Parse URL
    const urlMatch = command.match(/(['"]?)([^'"\s]+)\1/);
    if (urlMatch) {
        result.url = urlMatch[2];
    }
    
    // Parse method
    const methodMatch = command.match(/-X\s+([A-Z]+)/);
    if (methodMatch) {
        result.method = methodMatch[1];
    }
    
    // Parse headers
    const headerMatches = command.matchAll(/-H\s+['"]([^'"]+)['"]/g);
    for (const match of headerMatches) {
        const headerParts = match[1].split(':');
        if (headerParts.length >= 2) {
            const key = headerParts[0].trim();
            const value = headerParts.slice(1).join(':').trim();
            result.headers[key] = value;
        }
    }
    
    // Parse data
    const dataMatch = command.match(/-d\s+['"]([^'"]+)['"]/);
    if (dataMatch) {
        result.data = dataMatch[1];
        if (!result.method || result.method === 'GET') {
            result.method = 'POST';
        }
    }
    
    return result;
}

function generateGoCode(parsed: ParsedCurl): string {
    let code = `package main\n\n`;
    code += `import (\n`;
    code += `\t"fmt"\n`;
    code += `\t"net/http"\n`;
    if (parsed.data) {
        code += `\t"strings"\n`;
    }
    code += `)\n\n`;
    
    code += `func main() {\n`;
    
    // Create request
    if (parsed.data) {
        code += `\tpayload := strings.NewReader(\`${parsed.data}\`)\n`;
        code += `\treq, err := http.NewRequest("${parsed.method}", "${parsed.url}", payload)\n`;
    } else {
        code += `\treq, err := http.NewRequest("${parsed.method}", "${parsed.url}", nil)\n`;
    }
    
    code += `\tif err != nil {\n`;
    code += `\t\tfmt.Println(err)\n`;
    code += `\t\treturn\n`;
    code += `\t}\n\n`;
    
    // Add headers
    for (const [key, value] of Object.entries(parsed.headers)) {
        code += `\treq.Header.Add("${key}", "${value}")\n`;
    }
    
    if (Object.keys(parsed.headers).length > 0) {
        code += `\n`;
    }
    
    // Execute request
    code += `\tclient := &http.Client{}\n`;
    code += `\tres, err := client.Do(req)\n`;
    code += `\tif err != nil {\n`;
    code += `\t\tfmt.Println(err)\n`;
    code += `\t\treturn\n`;
    code += `\t}\n`;
    code += `\tdefer res.Body.Close()\n\n`;
    
    code += `\t// Handle response\n`;
    code += `\tfmt.Println("Status:", res.Status)\n`;
    code += `}\n`;
    
    return code;
}

// Export is handled by the export keyword above