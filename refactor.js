const fs = require('fs');
const path = 'c:/Users/nht_anh.BRYCENVN/Documents/geography/src/app/admin/AdminClient.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove body style
content = content.replace(/<style>\{\`\n\s*body \{ background: linear-gradient\([\s\S]*?\n\s*\`\}<\/style>\n\n/g, '');

// 2. Fix Header
content = content.replace(/<div className="min-h-screen flex flex-col">\n\s*\{\/\* ── Top header ── \*\/\}\n\s*<header className="sticky top-0 z-50 bg-white\/80 backdrop-blur-\[24px\]\n\s*border-b border-white shadow-\[0_4px_24px_rgba\(14,165,233,0\.10\)\]">/g, 
  '<div className="min-h-screen flex flex-col relative z-10">\n        {/* ── Top header ── */}\n        <header className="sticky top-0 z-50 bg-white/50 backdrop-blur-[24px]\n          border-b border-white/80 shadow-[0_4px_32px_rgba(14,165,233,0.15)]">');

// 3. Fix Cards and Modals
content = content.replace(/bg-white\/75 backdrop-blur-\[20px\] border border-white/g, 'bg-white/65 backdrop-blur-[24px] border border-white/80');
content = content.replace(/bg-white\/90 backdrop-blur-\[20px\] border border-white/g, 'bg-[rgba(255,255,255,0.75)] backdrop-blur-[24px] border border-white/80');
content = content.replace(/rounded-\[24px\]/g, 'rounded-[32px]');
content = content.replace(/rounded-\[20px\]/g, 'rounded-[32px]');

// 4. Update fldCls variables
content = content.replace(/fldCls = 'w-full px-3 py-2\\.5 rounded-\\[12px\\] border border-slate-200/g, "fldCls = 'w-full px-4 py-3 rounded-full border-2 border-white/60 bg-white/40 backdrop-blur-md");

// 5. Textareas fix (replace className={fldCls} or similar for textareas)
content = content.replace(/<textarea([^>]*?)className=\{fldCls\}/g, "<textarea$1className={fldCls.replace('rounded-full', 'rounded-[20px]')}");
content = content.replace(/<textarea([^>]*?)className=\{fldCls \+ ' resize-none'\}/g, "<textarea$1className={fldCls.replace('rounded-full', 'rounded-[20px]') + ' resize-none'}");

// Fix JSON textarea (which has explicit className)
content = content.replace(/className={\`w-full px-4 py-3 rounded-\[12px\] border bg-slate-900 text-green-300/g, 'className={`w-full px-4 py-4 rounded-[24px] border bg-slate-900 text-green-300');

// 6. Fix generic buttons
content = content.replace(/rounded-\[12px\]/g, 'rounded-full');
content = content.replace(/rounded-\[10px\]/g, 'rounded-full');
content = content.replace(/rounded-\[8px\]/g, 'rounded-full');
content = content.replace(/rounded-\[14px\]/g, 'rounded-[20px]');
content = content.replace(/rounded-\[16px\]/g, 'rounded-[24px]');

// 7. Fix tables and hover states for transparency
content = content.replace(/bg-slate-50\/60/g, 'bg-white/40 backdrop-blur-md');
content = content.replace(/border-slate-50 hover:bg-cyan-50\/30/g, 'border-white/50 hover:bg-cyan-50/50');
content = content.replace(/border-slate-50 hover:bg-violet-50\/30/g, 'border-white/50 hover:bg-violet-50/50');

// 8. Fix mobile menu
content = content.replace(/<div className="lg:hidden border-t border-slate-100 bg-white\/95 px-4 py-3 flex gap-2">/g, '<div className="lg:hidden border-t border-white/40 bg-white/65 backdrop-blur-[24px] px-4 py-3 flex gap-2 shadow-lg rounded-b-[24px]">');

// 9. Buttons inside mobile menu
content = content.replace(/bg-slate-50 hover:bg-slate-100/g, 'bg-white/50 hover:bg-white/80 border border-white/80');
content = content.replace(/shadow-md/g, 'shadow-[0_8px_20px_rgba(6,182,212,0.4)]');

fs.writeFileSync(path, content);
console.log('Refactor completed cleanly!');
