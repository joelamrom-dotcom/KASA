const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function fixRouteFiles() {
  // Find all route.ts files with dynamic segments
  const routeFiles = await glob('app/api/**/[*]/route.ts', { cwd: process.cwd() });
  
  for (const file of routeFiles) {
    const filePath = path.join(process.cwd(), file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Pattern 1: Single param like { params }: { params: { id: string } }
    const singleParamPattern = /\{ params \}: \{ params: \{ (\w+): string \} \}/g;
    if (singleParamPattern.test(content)) {
      content = content.replace(
        /\{ params \}: \{ params: \{ (\w+): string \} \}/g,
        '{ params }: { params: Promise<{ $1: string }> }'
      );
      
      // Add await params at the start of each function
      const functionPattern = /(export async function (GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\{ params \}: \{ params: Promise<\{ (\w+): string \} \} \}[^)]*\)\s*\{)/g;
      content = content.replace(functionPattern, (match, funcStart, method, paramName) => {
        return funcStart + `\n    const { ${paramName} } = await params\n`;
      });
      
      // Replace params.paramName with just paramName
      const paramName = content.match(/\{ params \}: \{ params: Promise<\{ (\w+): string \} \}/)?.[1];
      if (paramName) {
        content = content.replace(new RegExp(`params\\.${paramName}`, 'g'), paramName);
      }
      modified = true;
    }
    
    // Pattern 2: Multiple params like { params }: { params: { id: string; memberId: string } }
    const multiParamPattern = /\{ params \}: \{ params: \{ ([^}]+) \} \}/g;
    if (multiParamPattern.test(content) && !content.includes('Promise<')) {
      content = content.replace(
        /\{ params \}: \{ params: \{ ([^}]+) \} \}/g,
        '{ params }: { params: Promise<{ $1 }> }'
      );
      
      // Extract param names
      const paramMatch = content.match(/\{ params \}: \{ params: Promise<\{ ([^}]+) \} \}/);
      if (paramMatch) {
        const paramString = paramMatch[1];
        const paramNames = paramString.split(';').map(p => p.trim().split(':')[0].trim()).filter(Boolean);
        
        // Add await params
        content = content.replace(
          /(export async function (GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\{ params \}: \{ params: Promise<\{ [^}]+\} \} \}[^)]*\)\s*\{)/g,
          (match) => {
            const destructure = `const { ${paramNames.join(', ')} } = await params`;
            return match + `\n    ${destructure}\n`;
          }
        );
        
        // Replace params.paramName with just paramName
        paramNames.forEach(paramName => {
          content = content.replace(new RegExp(`params\\.${paramName}`, 'g'), paramName);
        });
      }
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${file}`);
    }
  }
  
  console.log('Done!');
}

fixRouteFiles().catch(console.error);

