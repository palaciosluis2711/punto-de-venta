const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let modifiedFiles = 0;

walkDir('src', function(filePath) {
    if (!filePath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // We want to find <CustomSelect ... onChange={(e: any) => setX(e.target.value)} ... >
    // Since regex over multiple lines for JSX is hard, we can just replace `.target.value` with `?? e`? No, it's safer to just replace `.target.value` with `` (nothing) if the argument is `e`.
    // Wait, let's just make the CustomSelect emit a fake event object and change DashboardPage/MainLayout to use it!
    // That's much easier to implement and less prone to regex errors.
});
