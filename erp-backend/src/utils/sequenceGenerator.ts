export const generateSequenceNumber = (format: string, nextNumber: number, financialYearStartMonth: number = 4): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  
  const yyyy = year.toString();
  const yy = yyyy.slice(2);
  
  const mm = month.toString().padStart(2, '0');
  const mmm = date.toLocaleString('default', { month: 'short' }); // e.g. "Jan"
  
  // Calculate Financial Year (e.g. 26-27)
  let fyStartYear = year;
  if (month < financialYearStartMonth) {
    fyStartYear -= 1;
  }
  const fyEndYear = (fyStartYear + 1).toString().slice(2);
  const fyStartStr = fyStartYear.toString().slice(2);
  const fy = `${fyStartStr}-${fyEndYear}`;

  // 4-digit padding for the sequence
  const seq = nextNumber.toString().padStart(4, '0');

  // Default fallback if format is empty
  let result = format || 'SEQ';

  // Replace keywords (Order matters to avoid partial replacements)
  result = result.replace(/YYYY/g, yyyy);
  result = result.replace(/YY/g, yy);
  result = result.replace(/FY/g, fy);
  result = result.replace(/MMM/g, mmm);
  result = result.replace(/MM/g, mm);
  result = result.replace(/SEQ/g, seq);

  return result;
};
