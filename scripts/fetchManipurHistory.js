import fs from 'fs';
import path from 'path';

async function parseManipurHtml() {
  const htmlPath = path.resolve(process.cwd(), 'manipur.html');
  let html = '';
  if (fs.existsSync(htmlPath)) {
    console.log('Reading from local manipur.html ...');
    html = fs.readFileSync(htmlPath, 'utf8');
  } else {
    console.log('Fetching from https://satta1.net/manipur-panel-chart.php ...');
    const res = await fetch('https://satta1.net/manipur-panel-chart.php');
    html = await res.text();
  }

  console.log('HTML length:', html.length);

  // Extract table rows
  const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  console.log('Total <tr> found:', trMatches.length);

  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const records = [];

  const cleanPana = (val) => {
    if (!val) return '***';
    const text = val.replace(/<[^>]*>/g, '').replace(/[\r\n\s]/g, '').trim();
    if (!text || text.includes('*')) return '***';
    return text.slice(0, 3);
  };

  const cleanJodi = (val) => {
    if (!val) return '**';
    const text = val.replace(/<[^>]*>/g, '').replace(/[\r\n\s]/g, '').trim();
    if (!text || text.includes('*') || text === 'XX' || text === '--') {
      if (text === 'XX' || text === '--') return text;
      return '**';
    }
    return text.slice(0, 2);
  };

  for (const tr of trMatches) {
    if (!tr.includes('id="date"')) continue;

    const dateMatch = tr.match(/<td\s+id=["']date["']>([\s\S]*?)<\/td>/i);
    if (!dateMatch) continue;

    const rawDate = dateMatch[1]
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Standardize "DD-MM-YY to DD-MM-YY"
    const weekStr = rawDate.replace(/\s*to\s*/i, ' to ');

    // Extract all <td>...</td> in this row
    const tdMatches = Array.from(tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map((m) => m[1]);
    const dayCells = tdMatches.slice(1);

    const record = {
      week: weekStr,
      mon: { openPana: '***', jodi: '**', closePana: '***' },
      tue: { openPana: '***', jodi: '**', closePana: '***' },
      wed: { openPana: '***', jodi: '**', closePana: '***' },
      thu: { openPana: '***', jodi: '**', closePana: '***' },
      fri: { openPana: '***', jodi: '**', closePana: '***' },
      sat: { openPana: '***', jodi: '**', closePana: '***' },
    };

    for (let d = 0; d < 6; d++) {
      const dName = days[d];
      const baseIdx = d * 3;
      const op = cleanPana(dayCells[baseIdx]);
      const jd = cleanJodi(dayCells[baseIdx + 1]);
      const cp = cleanPana(dayCells[baseIdx + 2]);

      record[dName] = {
        openPana: op,
        jodi: jd,
        closePana: cp,
      };
    }

    records.push(record);
  }

  console.log(`Parsed ${records.length} total week records for Manipur.`);
  if (records.length > 0) {
    console.log('Sample Record 0 (First Week):', JSON.stringify(records[0], null, 2));
    console.log('Sample Record Last (Current Week):', JSON.stringify(records[records.length - 1], null, 2));

    const outPath = path.resolve(process.cwd(), 'src/data/manipurHistorical.json');
    fs.writeFileSync(outPath, JSON.stringify(records, null, 2), 'utf8');
    console.log(`Successfully written to ${outPath}`);
  }
}

parseManipurHtml().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
