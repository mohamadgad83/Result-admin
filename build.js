const fs = require('fs');
const path = require('path');
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) { console.error('❌ مفاتيح Supabase مفقودة'); process.exit(1); }

function inject(p) {
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/\{\{SUPABASE_URL\}\}/g, SUPABASE_URL)
       .replace(/\{\{SUPABASE_ANON_KEY\}\}/g, SUPABASE_ANON_KEY);
  fs.writeFileSync(p, c);
  console.log('✅', path.basename(p));
}

fs.readdirSync(__dirname).filter(f => f.endsWith('.html')).forEach(f => inject(path.join(__dirname, f)));
const libDir = path.join(__dirname, 'lib');
if (fs.existsSync(libDir)) fs.readdirSync(libDir).filter(f => f.endsWith('.js')).forEach(f => inject(path.join(libDir, f)));
console.log('✅ Build complete');
