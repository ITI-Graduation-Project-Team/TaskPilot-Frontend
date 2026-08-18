const fs = require('fs');
const path = require('path');

function fixSvg(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Extract all <path> tags
    const pathRegex = /<path[^>]+?\/>/g;
    const allPaths = [...content.matchAll(pathRegex)].map(m => m[0]);
    
    // Separate holes and solid paths
    const holes = [];
    const solids = [];
    
    for (const p of allPaths) {
        if (p.includes('fill="none"')) {
            holes.push(p.replace('fill="none"', 'fill="black"'));
        } else {
            solids.push(p);
        }
    }
    
    if (holes.length === 0) {
        console.log(`No holes found in ${filePath}`);
        return;
    }
    
    // Build the mask
    const mask = `
<mask id="holes">
  <rect x="-5000" y="-5000" width="10000" height="10000" fill="white"/>
  ${holes.join('\n  ')}
</mask>
`;

    // Group the solid paths with the mask
    const groupedSolids = `<g mask="url(#holes)">\n${solids.join('\n')}\n</g>`;
    
    // Now reconstruct the file
    const svgStartRegex = /<svg[^>]*>/;
    const svgMatch = content.match(svgStartRegex);
    
    if (!svgMatch) {
        console.error("Could not find <svg> tag in", filePath);
        return;
    }
    
    const svgStartIdx = svgMatch.index + svgMatch[0].length;
    const svgEndIdx = content.lastIndexOf('</svg>');
    
    const beforePaths = content.substring(0, svgStartIdx);
    const afterPaths = content.substring(svgEndIdx);
    
    const newContent = beforePaths + mask + groupedSolids + afterPaths;
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Fixed ${filePath}`);
}

const logoPath = path.join(__dirname, 'public', 'TaskPilotLogo.svg');
const darkLogoPath = path.join(__dirname, 'public', 'TaskPilotDarkMode.svg');

fixSvg(logoPath);
fixSvg(darkLogoPath);
