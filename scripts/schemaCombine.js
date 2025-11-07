const fs = require('fs');
const path = require('path');

// Look directly in prisma/ folder
const prismaDir = path.join(__dirname, '../prisma');
const schemaFile = path.join(prismaDir, 'schema.prisma');

// Read current schema.prisma to extract generator and datasource
const currentSchema = fs.readFileSync(schemaFile, 'utf8');

// Extract generator and datasource blocks
const generatorMatch = currentSchema.match(/generator\s+\w+\s*{[^}]*}/s);
const datasourceMatch = currentSchema.match(/datasource\s+\w+\s*{[^}]*}/s);

const generator = generatorMatch ? generatorMatch[0] : '';
const datasource = datasourceMatch ? datasourceMatch[0] : '';

// Read all .prisma files from prisma directory, excluding schema.prisma
const files = fs.readdirSync(prismaDir)
  .filter(file => file.endsWith('.prisma') && file !== 'schema.prisma')
  .sort((a, b) => a.localeCompare(b));

// Start with generator and datasource
let mergedSchema = '';

if (generator) {
  mergedSchema += generator + '\n\n';
}

if (datasource) {
  mergedSchema += datasource + '\n\n';
}

// Add all model files
files.forEach(file => {
  const filePath = path.join(prismaDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  mergedSchema += `// ========================================\n`;
  mergedSchema += `// ${file}\n`;
  mergedSchema += `// ========================================\n\n`;
  mergedSchema += content;
  mergedSchema += '\n\n';
});

// Write merged schema to schema.prisma
fs.writeFileSync(schemaFile, mergedSchema);

console.log('✅ Schemas merged successfully!');
console.log(`📝 Merged ${files.length} model file(s) into schema.prisma`);