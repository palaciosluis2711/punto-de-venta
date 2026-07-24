const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const filesToProcess = [];
walkDir('src', function(filePath) {
    if (filePath.endsWith('.tsx') && 
        !filePath.includes('DashboardPage.tsx') && 
        !filePath.includes('MainLayout.tsx') &&
        !filePath.includes('CustomSelect.tsx')) {
        filesToProcess.push(filePath);
    }
});

filesToProcess.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('<select')) return;

    // Import CustomSelect if not present
    if (!content.includes('CustomSelect')) {
        // Find last import
        const lastImportIndex = content.lastIndexOf('import ');
        const endOfLastImport = content.indexOf('\n', lastImportIndex);
        
        // Calculate relative path to src/shared/components/CustomSelect
        const depth = file.split(path.sep).length - 2; // src/ is depth 1
        const prefix = depth === 0 ? './' : '../'.repeat(depth);
        const importStr = `\nimport { CustomSelect } from '${prefix}shared/components/CustomSelect';`;
        
        content = content.slice(0, endOfLastImport) + importStr + content.slice(endOfLastImport);
    }

    // Replace <select ...> to <CustomSelect ...>
    content = content.replace(/<select\b/g, '<CustomSelect');
    content = content.replace(/<\/select>/g, '</CustomSelect>');

    // Replace onChange={(e) => ...e.target.value...} to onChange={(e: any) => ...(e.target ? e.target.value : e)...}
    // A robust way is to inject a wrapper function in onChange, but regex is tricky.
    // Instead of regexing onChange, we can modify CustomSelect to ALWAYS return a string.
    // And in the files, we regex:
    // onChange={(e) => setSomething(e.target.value)}
    // Let's do a simple replace for common patterns:
    content = content.replace(/onChange=\{\(e\) => ([A-Za-z0-9_]+)\(e\.target\.value( as [A-Za-z0-9_]+)?\)\}/g, 'onChange={(val: any) => $1(val.target ? val.target.value : val)}');
    content = content.replace(/onChange=\{\(e\) => set([A-Za-z0-9_]+)\(\{\s*\.\.\.([^,]+),\s*([A-Za-z0-9_]+):\s*e\.target\.value\s*\}\)\}/g, 'onChange={(val: any) => set$1({ ...$2, $3: val.target ? val.target.value : val })}');
    content = content.replace(/onChange=\{([A-Za-z0-9_]+)\}/g, 'onChange={(val: any) => $1(val.target ? val : { target: { value: val } } as any)}');

    // Also replace className="input" with fullWidth={true} for CustomSelect
    // CustomSelect uses className, so we can just let it keep className="input" but we should add fullWidth to CustomSelect component.
    
    fs.writeFileSync(file, content);
    console.log('Processed', file);
});
