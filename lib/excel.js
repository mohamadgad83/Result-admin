window.Excel = {
  read(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = e => {
        try {
          const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true });
          const ws = wb.Sheets[wb.SheetNames[0]];
          // raw:false يحافظ على الأصفار البادئة
          resolve(XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' }));
        } catch (err) { reject(err); }
      };
      r.onerror = () => reject(new Error('فشل قراءة الملف'));
      r.readAsArrayBuffer(file);
    });
  },
  download(aoa, filename, sheet = 'Sheet1') {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), sheet);
    XLSX.writeFile(wb, filename);
  }
};
