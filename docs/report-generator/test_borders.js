import fs from 'fs';
import { execSync } from 'child_process';
import { Document, Packer, Paragraph, PageBorderOffsetFrom, PageBorderZOrder, PageBorderDisplay, BorderStyle } from 'docx';

const doc = new Document({
  sections: [{
    properties: {
      page: {
        borders: {
          pageBorders: {
            offsetFrom: PageBorderOffsetFrom.PAGE,
            zOrder: PageBorderZOrder.FRONT,
            display: PageBorderDisplay.ALL_PAGES,
          },
          pageBorderTop: { style: BorderStyle.SINGLE, size: 4, space: 24, color: '000000' },
          pageBorderBottom: { style: BorderStyle.SINGLE, size: 4, space: 24, color: '000000' },
          pageBorderLeft: { style: BorderStyle.SINGLE, size: 4, space: 24, color: '000000' },
          pageBorderRight: { style: BorderStyle.SINGLE, size: 4, space: 24, color: '000000' }
        }
      }
    },
    children: [new Paragraph('Testing page border with exact docx options')]
  }]
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync('test_border.zip', buf);

const ps = `
Expand-Archive -Path test_border.zip -DestinationPath test_border_unpacked -Force
Get-Content test_border_unpacked/word/document.xml
`;
fs.writeFileSync('test_unzip.ps1', ps);
const out = execSync('powershell -ExecutionPolicy Bypass -File test_unzip.ps1', { encoding: 'utf8' });
const match = out.match(/<w:pgBorders[\s\S]*?<\/w:pgBorders>/);
console.log('MATCHED PG BORDERS:');
console.log(match ? match[0] : 'NOT FOUND');

// Cleanup
fs.rmSync('test_border_unpacked', { recursive: true, force: true });
fs.unlinkSync('test_border.zip');
fs.unlinkSync('test_unzip.ps1');
