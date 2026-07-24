const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('src', function(filePath) {
    if (filePath.endsWith('.tsx') && !filePath.includes('CustomSelect.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Match `onChange={e =>`
        let newContent = content.replace(/onChange=\{e\s*=>/g, 'onChange={(e: any) =>');
        // Match `onChange={val =>`
        newContent = newContent.replace(/onChange=\{val\s*=>/g, 'onChange={(val: any) =>');
        
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent);
            console.log('Fixed types in', filePath);
        }
    }
});
