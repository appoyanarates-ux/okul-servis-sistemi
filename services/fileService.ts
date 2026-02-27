/**
 * Bu servis, uygulamanın hem web tarayıcısında hem de Visual Studio (WebView/Electron) 
 * içinde çalışırken dosya indirme işlemlerini güvenli bir şekilde gerçekleştirmesini sağlar.
 */

const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[<>:"/\\|?*]/g, '-').trim();
};

export const saveBlob = (content: BlobPart, fileName: string, mimeType: string) => {
  const safeFileName = sanitizeFileName(fileName);
  const blobContent = (typeof content === 'string' && (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('msword'))) 
    ? ['\uFEFF' + content] 
    : [content];

  const blob = new Blob(blobContent, { type: `${mimeType};charset=utf-8` });

  // @ts-ignore
  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    // @ts-ignore
    window.navigator.msSaveOrOpenBlob(blob, safeFileName);
    return;
  }

  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    
    setTimeout(() => {
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 200);
    }, 50);
  } catch (err) {
    console.error("Dosya indirme hatası:", err);
  }
};

export const printWindow = () => {
  // Yazdırma işlemi için elementlerin render olmasını bekleyen güvenli metod
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.print();
    }, 250);
  }
};
