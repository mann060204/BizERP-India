const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'routes');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && !['auth.routes.ts', 'business.routes.ts', 'public.routes.ts'].includes(f));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  if (!content.includes('checkLockedFY')) {
    content = content.replace("protect } from '../middlewares/auth.middleware'", "protect, checkLockedFY } from '../middlewares/auth.middleware'");
    // Some might have single quotes or double quotes, or different spacing
    content = content.replace(/protect(.*)} from '..\/middlewares\/auth.middleware'/, "protect, checkLockedFY$1} from '../middlewares/auth.middleware'");
    
    // Add router.use(checkLockedFY) after router.use(protect)
    content = content.replace('router.use(protect);', 'router.use(protect);\nrouter.use(checkLockedFY);');
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Modified', file);
  }
}
