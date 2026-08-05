const fs = require('fs');
const path = require('path');

function fixDarkSvg(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    const pathRegex = /<path[^>]+?\/>/g;
    const allPaths = [...content.matchAll(pathRegex)].map(m => m[0]);
    
    const holes = [];
    const solids = [];
    
    const holeColors = ['#010214', '#020114', '#080815', '#151520', '#1A1A24'];
    
    for (const p of allPaths) {
        let isHole = false;
        for (const color of holeColors) {
            if (p.includes(`fill="${color}"`)) {
                holes.push(p.replace(`fill="${color}"`, 'fill="black"'));
                isHole = true;
                break;
            }
        }
        if (!isHole) {
            solids.push(p);
        }
    }
    
    if (holes.length === 0) {
        console.log(`No holes found in ${filePath}`);
        return;
    }
    
    const mask = `
<mask id="holes">
  <rect x="-5000" y="-5000" width="10000" height="10000" fill="white"/>
  ${holes.join('\n  ')}
</mask>
`;

    const groupedSolids = `<g mask="url(#holes)">\n${solids.join('\n')}\n</g>`;
    
    const svgStartRegex = /<svg[^>]*>/;
    const svgMatch = content.match(svgStartRegex);
    
    const svgStartIdx = svgMatch.index + svgMatch[0].length;
    const svgEndIdx = content.lastIndexOf('</svg>');
    
    const beforePaths = content.substring(0, svgStartIdx);
    const afterPaths = content.substring(svgEndIdx);
    
    const newContent = beforePaths + mask + groupedSolids + afterPaths;
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Fixed ${filePath}`);
}

const darkLogoPath = path.join(__dirname, 'public', 'TaskPilotDarkMode.svg');
fixDarkSvg(darkLogoPath);
