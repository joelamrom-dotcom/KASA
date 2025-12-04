import fs from 'fs';
import path from 'path';

function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts' && filePath.includes('[') && filePath.includes(']')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

async function fixRouteFiles() {
  const routeFiles = findRouteFiles('app/api');
  
  for (const file of routeFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    
    // Match params type definitions (without Promise - we want to fix these)
    const paramTypeRegex = /\{ params \}: \{ params: \{ ([^}]+) \} \}/g;
    const matches = [...content.matchAll(paramTypeRegex)];
    
    // Skip if already fixed (has Promise) or no matches
    if (matches.length === 0 || content.includes('params: Promise<')) continue;
    
    // Extract param names from first match
    const paramString = matches[0][1];
    const paramNames = paramString
      .split(';')
      .map(p => p.trim().split(':')[0].trim())
      .filter(Boolean);
    
    // Replace params type with Promise
    content = content.replace(
      paramTypeRegex,
      '{ params }: { params: Promise<{ $1 }> }'
    );
    
    // Add await params at start of each function
    const functionRegex = /(export async function (GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\{ params \}: \{ params: Promise<\{ [^}]+\} \} \}[^)]*\)\s*\{)/g;
    content = content.replace(functionRegex, (match) => {
      const destructure = `const { ${paramNames.join(', ')} } = await params`;
      return match + `\n    ${destructure}\n`;
    });
    
    // Replace params.paramName with just paramName
    paramNames.forEach(paramName => {
      const regex = new RegExp(`params\\.${paramName}\\b`, 'g');
      content = content.replace(regex, paramName);
    });
    
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Fixed: ${file}`);
    }
  }
  
  console.log('Done fixing route files!');
}

fixRouteFiles().catch(console.error);

