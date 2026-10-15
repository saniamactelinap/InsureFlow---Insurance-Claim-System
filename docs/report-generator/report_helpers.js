import fs from 'fs';
import path from 'path';
import {
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImageRun,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  ShadingType,
  VerticalAlign,
} from 'docx';

export const FONT_FAMILY = 'Times New Roman';
export const FONT_CODE = 'Consolas';
export const COLOR_BLACK = '000000';

// Standard 1.5 line spacing (360) and 6pt space after (120 dxa)
export function bodyParagraph(text, options = {}) {
  const runs = Array.isArray(text)
    ? text
    : [
        new TextRun({
          text,
          font: FONT_FAMILY,
          size: options.size || 24,
          bold: options.bold || false,
          italics: options.italics || false,
          color: COLOR_BLACK,
        }),
      ];

  return new Paragraph({
    alignment: options.alignment || AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: options.spaceAfter !== undefined ? options.spaceAfter : 120, before: options.spaceBefore || 0 },
    children: runs,
  });
}

export function chapterHeading(chapterNum, title) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: `CHAPTER ${chapterNum}`,
          font: FONT_FAMILY,
          size: 32, // 16pt
          bold: true,
          color: COLOR_BLACK,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 360 },
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: title.toUpperCase(),
          font: FONT_FAMILY,
          size: 28, // 14pt
          bold: true,
          color: COLOR_BLACK,
        }),
      ],
    }),
  ];
}

export function sectionHeading(secNum, title) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 280, after: 140 },
    heading: HeadingLevel.HEADING_2,
    children: [
      new TextRun({
        text: `${secNum} ${title}`,
        font: FONT_FAMILY,
        size: 26, // 13pt
        bold: true,
        color: COLOR_BLACK,
      }),
    ],
  });
}

export function subSectionHeading(secNum, title) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 100 },
    heading: HeadingLevel.HEADING_3,
    children: [
      new TextRun({
        text: `${secNum} ${title}`,
        font: FONT_FAMILY,
        size: 24, // 12pt
        bold: true,
        color: COLOR_BLACK,
      }),
    ],
  });
}

export function bulletItem(label, text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    bullet: { level: 0 },
    spacing: { line: 360, after: 80 },
    children: [
      new TextRun({ text: `${label}: `, font: FONT_FAMILY, size: 24, bold: true, color: COLOR_BLACK }),
      new TextRun({ text, font: FONT_FAMILY, size: 24, color: COLOR_BLACK }),
    ],
  });
}

export function codeBlock(codeString, caption = '') {
  const lines = codeString.trim().split('\n');
  const paragraphs = lines.map((line) =>
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 240, after: 0, before: 0 },
      children: [
        new TextRun({
          text: line,
          font: FONT_CODE,
          size: 19, // ~9.5pt
          color: COLOR_BLACK,
        }),
      ],
    })
  );

  const cell = new TableCell({
    shading: { fill: 'F2F2F2', type: ShadingType.CLEAR },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '888888' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '888888' },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BLACK },
      right: { style: BorderStyle.SINGLE, size: 1, color: '888888' },
    },
    margins: { top: 140, bottom: 140, left: 180, right: 180 },
    children: paragraphs,
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [cell] })],
  });

  const elements = [table];
  if (caption) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 180 },
        children: [
          new TextRun({
            text: `Listing: ${caption}`,
            font: FONT_FAMILY,
            size: 20,
            italics: true,
            color: COLOR_BLACK,
          }),
        ],
      })
    );
  }
  return elements;
}

export function createFigure(imagePath, caption, width = 600, height = 360) {
  if (!fs.existsSync(imagePath)) {
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 180, after: 180 },
        children: [
          new TextRun({
            text: `[IMAGE PLACEHOLDER: ${path.basename(imagePath)}]`,
            font: FONT_FAMILY,
            size: 22,
            bold: true,
            color: COLOR_BLACK,
          }),
        ],
      }),
    ];
  }

  const imageBuffer = fs.readFileSync(imagePath);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: [
        new ImageRun({
          data: imageBuffer,
          transformation: { width, height },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 240 },
      children: [
        new TextRun({
          text: caption,
          font: FONT_FAMILY,
          size: 22, // 11pt
          bold: true,
          italics: true,
          color: COLOR_BLACK,
        }),
      ],
    }),
  ];
}

export function createStyledTable(headers, rows, colWidthPercentages = [], tableCaption = '') {
  const borderConfig = {
    top: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BLACK },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BLACK },
    left: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BLACK },
    right: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BLACK },
  };

  const headerCells = headers.map((h, i) => {
    return new TableCell({
      width: colWidthPercentages[i] ? { size: colWidthPercentages[i], type: WidthType.PERCENTAGE } : undefined,
      shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 120, bottom: 120, left: 120, right: 120 },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 240, after: 0 },
          children: [new TextRun({ text: h, font: FONT_FAMILY, size: 21, bold: true, color: COLOR_BLACK })],
        }),
      ],
      borders: borderConfig,
    });
  });

  const tableRows = [new TableRow({ children: headerCells, tableHeader: true })];

  rows.forEach((row, rIdx) => {
    const isEven = rIdx % 2 === 1;
    const cells = row.map((cellText, cIdx) => {
      return new TableCell({
        width: colWidthPercentages[cIdx] ? { size: colWidthPercentages[cIdx], type: WidthType.PERCENTAGE } : undefined,
        shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: [
          new Paragraph({
            alignment: cIdx === 0 ? AlignmentType.LEFT : AlignmentType.LEFT,
            spacing: { line: 280, after: 0 },
            children: [new TextRun({ text: String(cellText), font: FONT_FAMILY, size: 20, color: COLOR_BLACK })],
          }),
        ],
        borders: borderConfig,
      });
    });
    tableRows.push(new TableRow({ children: cells }));
  });

  const elements = [];
  if (tableCaption) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({
            text: tableCaption,
            font: FONT_FAMILY,
            size: 22,
            bold: true,
            color: COLOR_BLACK,
          }),
        ],
      })
    );
  }

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    })
  );

  elements.push(new Paragraph({ spacing: { after: 180 } }));
  return elements;
}
