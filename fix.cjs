const fs = require('fs');
let lines = fs.readFileSync('src/modules/dashboard/DashboardPage.tsx', 'utf8').split('\n');

const topProductsStart = 494; // line 495 is index 494
const topProductsEnd = 555; // line 556 is index 555

const topProductsBlock = lines.slice(topProductsStart, topProductsEnd);

// Remove Top Products from the end
lines.splice(topProductsStart, topProductsEnd - topProductsStart);

// Now find where to insert the columns
const bottomGridsIndex = lines.findIndex(l => l.includes('{/* -- BOTTOM GRIDS -- */}'));
const criticalStockIndex = lines.findIndex(l => l.includes('{/* Critical Stock */}'));
const latestClientsIndex = lines.findIndex(l => l.includes('{/* Latest Clients */}'));
const endOfSplitGridIndex = lines.findIndex(l => l.includes('            </div>') && lines[l.indexOf('            </div>') + 2] && lines[lines.findIndex(l2 => l2 === l) + 2].includes('<ProductRequestModal'));

// Wait, since we removed lines, we should recalculate indices.
let newLines = [...lines];

const insertColumn1Start = newLines.findIndex(l => l.includes('<div className="dashboard-grid split-grid">')) + 1;
newLines.splice(insertColumn1Start, 0, '                {/* --- COL 1 --- */}', '                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>');

const insertColumn1End = newLines.findIndex(l => l.includes('{/* Critical Stock */}'));
// insert top products right before column 1 end
newLines.splice(insertColumn1End, 0, ...topProductsBlock, '                </div>', '', '                {/* --- COL 2 --- */}', '                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>');

const insertColumn2End = newLines.findIndex(l => l.includes('{/* Latest Clients */}'));
newLines.splice(insertColumn2End, 0, '                </div>', '', '                {/* --- COL 3 --- */}', '                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>');

// find the closing div of split grid. It's the one before <ProductRequestModal
const insertColumn3End = newLines.findIndex(l => l.includes('<ProductRequestModal')) - 2;
newLines.splice(insertColumn3End, 0, '                </div>');

fs.writeFileSync('src/modules/dashboard/DashboardPage.tsx', newLines.join('\n'));
console.log("Fixed layout");
