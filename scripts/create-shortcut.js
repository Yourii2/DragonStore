import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  // Resolve absolute project root dynamically
  const projectRoot = path.resolve(__dirname, '..');
  
  // Potential icon locations within the project
  const candidateIconPaths = [
    path.join(projectRoot, 'dragon-logo.ico'),
    path.join(projectRoot, 'public', 'dragon-logo.ico')
  ];

  let resolvedIconPath = '';
  for (const p of candidateIconPaths) {
    if (fs.existsSync(p)) {
      resolvedIconPath = path.resolve(p);
      break;
    }
  }

  const targetBat = path.resolve(path.join(projectRoot, 'Start.bat'));
  const userProfile = process.env.USERPROFILE || 'C:\\Users\\' + (process.env.USERNAME || 'mamdo');
  const desktopDir = path.join(userProfile, 'Desktop');

  console.log(`[INFO] Project Root Detected: ${projectRoot}`);
  console.log(`[INFO] Target Start Script: ${targetBat}`);
  console.log(`[INFO] Exact Icon File Resolved: ${resolvedIconPath}`);

  const shortcutPath = path.join(desktopDir, 'Dragon Store.lnk');

  // In VBScript strings, backslashes do not need double escaping
  const vbsContent = [
    'Set oWS = CreateObject("WScript.Shell")',
    `sLinkFile = "${shortcutPath.replace(/"/g, '""')}"`,
    'Set oLink = oWS.CreateShortcut(sLinkFile)',
    `oLink.TargetPath = "${targetBat.replace(/"/g, '""')}"`,
    `oLink.WorkingDirectory = "${projectRoot.replace(/"/g, '""')}"`,
    'oLink.Description = "Dragon Store for Electronics and Freelance Work - Dragon Security Systems"',
    `oLink.IconLocation = "${resolvedIconPath.replace(/"/g, '""')},0"`,
    'oLink.Save'
  ].join('\r\n');

  const tempVbs = path.join(projectRoot, 'scripts', '_temp_shortcut.vbs');
  fs.writeFileSync(tempVbs, vbsContent, 'utf8');

  execSync(`cscript //nologo "${tempVbs}"`, { encoding: 'utf8' });
  console.log(`[SUCCESS] Desktop Shortcut created and verified: ${shortcutPath}`);

  if (fs.existsSync(tempVbs)) {
    fs.unlinkSync(tempVbs);
  }

} catch (err) {
  console.error('[ERROR] Failed to establish shortcut:', err);
  process.exit(1);
}
