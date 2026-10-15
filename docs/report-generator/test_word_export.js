import fs from 'fs';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { execSync } from 'child_process';
import path from 'path';

const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      new Paragraph({
        text: 'InsureFlow Project Report Test',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'This is a test paragraph verifying Word docx creation and PDF conversion.',
            font: 'Times New Roman',
            size: 24
          })
        ]
      })
    ]
  }]
});

const docxPath = path.resolve('test_report.docx');
const pdfPath = path.resolve('test_report.pdf');

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(docxPath, buffer);
console.log('Docx created, size:', buffer.length);

const psScript = `
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('${docxPath.replace(/\\/g, '\\\\')}')
$doc.SaveAs([ref]'${pdfPath.replace(/\\/g, '\\\\')}', [ref]17)
$doc.Close()
$word.Quit()
`;

fs.writeFileSync('test_export.ps1', psScript);
execSync('powershell -ExecutionPolicy Bypass -File test_export.ps1', { stdio: 'inherit' });
console.log('PDF export completed! PDF exists:', fs.existsSync(pdfPath), 'Size:', fs.existsSync(pdfPath) ? fs.statSync(pdfPath).size : 0);

// Clean up
if (fs.existsSync('test_export.ps1')) fs.unlinkSync('test_export.ps1');
if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);
if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
