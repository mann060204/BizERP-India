const fs = require('fs');
const path = require('path');

const files = [
  'app/dashboard/suppliers/[id]/page.tsx',
  'app/dashboard/suppliers/new/page.tsx',
  'app/dashboard/customers/[id]/page.tsx',
  'app/dashboard/customers/new/page.tsx',
  'components/modals/QuickAddCustomerModal.tsx',
  'components/modals/QuickAddSupplierModal.tsx'
];

for (const relPath of files) {
  const file = path.join(__dirname, 'erp-frontend', relPath);
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Add facingMode state if not present
  if (!content.includes('const [facingMode')) {
    content = content.replace(
      /const \[cameraError, setCameraError\] = useState\(''\);/,
      "const [cameraError, setCameraError] = useState('');\n  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');"
    );
  }

  // Replace startCamera
  if (!content.includes('facingMode: mode')) {
    const oldStartCamera = /const startCamera = useCallback\(async \(\) => \{[\s\S]*?\}, \[\]\);/;
    const newStartCamera = `const startCamera = useCallback(async (mode: 'user' | 'environment' = 'user') => {
    setCameraError('');
    setShowCamera(true);
    setFacingMode(mode);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch (err: any) {
      setCameraError(err.name === 'NotAllowedError' ? 'Camera permission denied.' : 'Could not access camera.');
    }
  }, []);`;
    content = content.replace(oldStartCamera, newStartCamera);
  }

  // Add flip button next to Capture
  if (!content.includes('title="Flip Camera"')) {
    // We will find the Capture button block.
    // In some files, it's: 
    // <button onClick={capturePhoto} className="flex-1 flex items-center justify-center gap-1 text-xs text-white bg-[#1e3a8a] hover:bg-action-600 py-1.5 rounded border border-[#1e3a8a] transition font-semibold">
    //   <Camera className="w-4 h-4" /> Capture
    // </button>
    
    // We can replace exactly this button string with the button + flip button.
    const buttonRegex = /(<button onClick={capturePhoto}[\s\S]*?<Camera className="w-4 h-4" \/> Capture\s*<\/button>)/;
    
    content = content.replace(buttonRegex, `$1
                      <button onClick={() => startCamera(facingMode === 'user' ? 'environment' : 'user')} className="px-3 flex items-center justify-center text-slate-600 bg-white hover:bg-slate-50 py-1.5 rounded border border-slate-200 transition" title="Flip Camera">
                        <RefreshCw className="w-4 h-4" />
                      </button>`);
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Patched', relPath);
  } else {
    console.log('No changes made to', relPath);
  }
}
