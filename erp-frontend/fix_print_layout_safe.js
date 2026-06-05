const fs = require('fs');

const files = [
    "d:/ERP WEBSITE/erp-frontend/app/print/invoice/[id]/page.tsx",
    "d:/ERP WEBSITE/erp-frontend/app/print/purchase/[id]/page.tsx",
    "d:/ERP WEBSITE/erp-frontend/app/print/quotation/[id]/page.tsx",
    "d:/ERP WEBSITE/erp-frontend/app/print/purchase-order/[id]/page.tsx"
];

const newOptions = `<option value="Original Copy">Original Copy</option>
                  <option value="Duplicate Copy">Duplicate Copy</option>
                  <option value="1st Copy">1st Copy</option>
                  <option value="2nd Copy">2nd Copy</option>
                  <option value="Extra Copy">Extra Copy</option>`;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Remove floating buttons
    content = content.replace(/<div className="print:hidden fixed bottom-8 right-8 flex flex-col gap-2">[\s\S]*?<\/div>/g, '');
    content = content.replace(/<div className="fixed bottom-6 right-6 flex flex-col gap-3 no-print z-50">[\s\S]*?<\/div>/g, '');
    content = content.replace(/<div className="fixed bottom-6 right-6 flex flex-col gap-3 no-print z-50">[\s\S]*?<\/div>/g, '');

    // 2. Options text
    content = content.replace(/useState\('Original for Recipient'\)/g, "useState('Original Copy')");
    content = content.replace(/useState\('Original'\)/g, "useState('Original Copy')");
    content = content.replace(/<option value="Original for Recipient">Original<\/option>[\s\S]*?<\/select>/g, newOptions + '\n                </select>');
    content = content.replace(/<option value="Original">Original<\/option>[\s\S]*?<\/select>/g, newOptions + '\n                </select>');

    // 3. Table wrapping divs
    const oldWrapperPattern = /<div className="flex-1 flex flex-col min-h-\[200px\] overflow-hidden">\s*<div className="overflow-x-auto w-full">\s*<table className="w-full text-center border-collapse h-full text-\[10px\] table-fixed font-semibold text-gray-800">/g;
    const newWrapperText = '<div className="flex-1 border-b-2 border-gray-800">\n            <table className="w-full h-full text-center border-collapse text-[10px] table-fixed font-semibold text-gray-800">';
    content = content.replace(oldWrapperPattern, newWrapperText);

    const oldWrapperPattern2 = /<div className="flex-1 flex flex-col min-h-\[200px\] overflow-x-auto">\s*<table className="w-full text-center border-collapse h-full text-\[10px\] table-fixed font-semibold text-gray-800">/g;
    content = content.replace(oldWrapperPattern2, newWrapperText);

    // Close tag for table wrapper
    content = content.replace(/<\/table>\s*<\/div>\s*<\/div>\s*\{\/\* Footer \*\//g, '</table>\n          </div>\n\n          {/* Footer */');
    content = content.replace(/<\/table>\s*<\/div>\s*\{\/\* Footer \*\//g, '</table>\n          </div>\n\n          {/* Footer */');

    // 4. Filler tr fix
    content = content.replace(/<tr className="flex-1 h-full">/g, '<tr className="h-full">');

    // 5. Swap Filler and Total Row
    // First, check if Filler is BEFORE Total Row
    const fillerRegex = /(\{[\s*/]*Filler space[\s*/]*\}[\s\S]*?<\/tr>)\s*(\{[\s*/]*Total Row[\s*/]*\}[\s\S]*?<\/tr>)/g;
    content = content.replace(fillerRegex, (match, filler, total) => {
        // Add border-b-2 to Total Row
        let newTotal = total.replace('className="border-t-2 border-gray-800', 'className="border-t-2 border-b-2 border-gray-800');
        // If it already had border-b-2, avoid double
        newTotal = newTotal.replace('border-b-2 border-b-2', 'border-b-2');
        return newTotal + '\n                ' + filler;
    });

    // What if Total Row is already BEFORE Filler space? (Like in purchase if it was copied over)
    const totalRegex = /(\{[\s*/]*Total Row[\s*/]*\}[\s\S]*?<\/tr>)\s*(\{[\s*/]*Filler space[\s*/]*\}[\s\S]*?<\/tr>)/g;
    content = content.replace(totalRegex, (match, total, filler) => {
        let newTotal = total.replace('className="border-t-2 border-gray-800', 'className="border-t-2 border-b-2 border-gray-800');
        newTotal = newTotal.replace('border-b-2 border-b-2', 'border-b-2');
        return newTotal + '\n                ' + filler;
    });

    fs.writeFileSync(file, content);
    console.log("Fixed " + file);
});
