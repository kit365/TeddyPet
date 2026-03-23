const fs = require('fs');
const filePath = 'src/admin/pages/dashboard/SystemPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The original file currently contains literal \` and \${ inside JSX curly braces 
// because of how I wrote part1, part2, part3 with write_to_file.
// e.g. title={\`Chào mừng \${user.name}\`} instead of title={`Chào mừng ${user.name}`}

// We need to un-escape them.
// Replace \` with `
content = content.replace(/\\`/g, '`');
// Replace \${ with ${
content = content.replace(/\\\${/g, '${');

fs.writeFileSync(filePath, content);
console.log('Fixed escaped chars');
