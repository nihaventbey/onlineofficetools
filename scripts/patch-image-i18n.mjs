/**
 * Patch image-related UI strings across all locale dictionaries.
 * Run: node scripts/patch-image-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/dictionaries");
const locales = ["en", "tr", "de", "fr", "es", "it", "pt", "ru"];

const imageTools = [
  "imageResize",
  "imageCompress",
  "imageCrop",
  "imageConvert",
  "imageMetadata",
  "imageEnhance",
  "imageAiUpscale",
];

const relatedTools = ["ocr", "imagesToPdf", "pdfToImages", "imagesToPptx"];

/** @type {Record<string, {
 *  dropImage: string;
 *  dropImages: string;
 *  dropPdf: string;
 *  selectImage: string;
 *  selectImages: string;
 *  selectPdf: string;
 *  limitImage: string;
 *  limitImages: string;
 *  limitPdf: string;
 *  cropWidth: string;
 *  cropHeight: string;
 *  before: string;
 *  after: string;
 *  pagesLabel: string;
 *  pageAlt: string;
 *  unknownType: string;
 *  ocrDrop: string;
 *  ocrSelect: string;
 * }>} */
const L = {
  en: {
    dropImage: "Drop an image here or click to select",
    dropImages: "Drop images here or click to select",
    dropPdf: "Drop a PDF here or click to select",
    selectImage: "PNG, JPG, WEBP — up to 25 MB",
    selectImages: "PNG, JPG, WEBP — up to 25 MB each",
    selectPdf: "PDF — up to 25 MB",
    limitImage: "Files stay on your device. Max 25 MB.",
    limitImages: "Files stay on your device. Max 25 MB per image.",
    limitPdf: "Files stay on your device. Max 25 MB.",
    cropWidth: "Crop width",
    cropHeight: "Crop height",
    before: "Before",
    after: "After",
    pagesLabel: "{count} pages",
    pageAlt: "Page {n}",
    unknownType: "unknown",
    ocrDrop: "Drop an image here or click to select",
    ocrSelect: "PNG, JPG, WEBP supported",
  },
  tr: {
    dropImage: "Görseli buraya bırakın veya seçmek için tıklayın",
    dropImages: "Görselleri buraya bırakın veya seçmek için tıklayın",
    dropPdf: "PDF'yi buraya bırakın veya seçmek için tıklayın",
    selectImage: "PNG, JPG, WEBP — en fazla 25 MB",
    selectImages: "PNG, JPG, WEBP — görsel başı 25 MB",
    selectPdf: "PDF — en fazla 25 MB",
    limitImage: "Dosyalar cihazınızda kalır. En fazla 25 MB.",
    limitImages: "Dosyalar cihazınızda kalır. Görsel başı 25 MB.",
    limitPdf: "Dosyalar cihazınızda kalır. En fazla 25 MB.",
    cropWidth: "Kırpma genişliği",
    cropHeight: "Kırpma yüksekliği",
    before: "Önce",
    after: "Sonra",
    pagesLabel: "{count} sayfa",
    pageAlt: "Sayfa {n}",
    unknownType: "bilinmiyor",
    ocrDrop: "Görseli buraya bırakın veya seçmek için tıklayın",
    ocrSelect: "PNG, JPG, WEBP desteklenir",
  },
  de: {
    dropImage: "Bild hier ablegen oder zum Auswählen klicken",
    dropImages: "Bilder hier ablegen oder zum Auswählen klicken",
    dropPdf: "PDF hier ablegen oder zum Auswählen klicken",
    selectImage: "PNG, JPG, WEBP — max. 25 MB",
    selectImages: "PNG, JPG, WEBP — max. 25 MB je Bild",
    selectPdf: "PDF — max. 25 MB",
    limitImage: "Dateien bleiben auf Ihrem Gerät. Max. 25 MB.",
    limitImages: "Dateien bleiben auf Ihrem Gerät. Max. 25 MB je Bild.",
    limitPdf: "Dateien bleiben auf Ihrem Gerät. Max. 25 MB.",
    cropWidth: "Zuschnittbreite",
    cropHeight: "Zuschnitthöhe",
    before: "Vorher",
    after: "Nachher",
    pagesLabel: "{count} Seiten",
    pageAlt: "Seite {n}",
    unknownType: "unbekannt",
    ocrDrop: "Bild hier ablegen oder zum Auswählen klicken",
    ocrSelect: "PNG, JPG, WEBP unterstützt",
  },
  fr: {
    dropImage: "Déposez une image ici ou cliquez pour sélectionner",
    dropImages: "Déposez des images ici ou cliquez pour sélectionner",
    dropPdf: "Déposez un PDF ici ou cliquez pour sélectionner",
    selectImage: "PNG, JPG, WEBP — jusqu’à 25 Mo",
    selectImages: "PNG, JPG, WEBP — 25 Mo par image",
    selectPdf: "PDF — jusqu’à 25 Mo",
    limitImage: "Les fichiers restent sur votre appareil. Max. 25 Mo.",
    limitImages: "Les fichiers restent sur votre appareil. 25 Mo par image.",
    limitPdf: "Les fichiers restent sur votre appareil. Max. 25 Mo.",
    cropWidth: "Largeur du recadrage",
    cropHeight: "Hauteur du recadrage",
    before: "Avant",
    after: "Après",
    pagesLabel: "{count} pages",
    pageAlt: "Page {n}",
    unknownType: "inconnu",
    ocrDrop: "Déposez une image ici ou cliquez pour sélectionner",
    ocrSelect: "PNG, JPG, WEBP pris en charge",
  },
  es: {
    dropImage: "Suelta una imagen aquí o haz clic para seleccionar",
    dropImages: "Suelta imágenes aquí o haz clic para seleccionar",
    dropPdf: "Suelta un PDF aquí o haz clic para seleccionar",
    selectImage: "PNG, JPG, WEBP — hasta 25 MB",
    selectImages: "PNG, JPG, WEBP — 25 MB por imagen",
    selectPdf: "PDF — hasta 25 MB",
    limitImage: "Los archivos permanecen en tu dispositivo. Máx. 25 MB.",
    limitImages: "Los archivos permanecen en tu dispositivo. 25 MB por imagen.",
    limitPdf: "Los archivos permanecen en tu dispositivo. Máx. 25 MB.",
    cropWidth: "Ancho de recorte",
    cropHeight: "Alto de recorte",
    before: "Antes",
    after: "Después",
    pagesLabel: "{count} páginas",
    pageAlt: "Página {n}",
    unknownType: "desconocido",
    ocrDrop: "Suelta una imagen aquí o haz clic para seleccionar",
    ocrSelect: "Compatible con PNG, JPG, WEBP",
  },
  it: {
    dropImage: "Trascina un’immagine qui o fai clic per selezionare",
    dropImages: "Trascina le immagini qui o fai clic per selezionare",
    dropPdf: "Trascina un PDF qui o fai clic per selezionare",
    selectImage: "PNG, JPG, WEBP — fino a 25 MB",
    selectImages: "PNG, JPG, WEBP — 25 MB per immagine",
    selectPdf: "PDF — fino a 25 MB",
    limitImage: "I file rimangono sul tuo dispositivo. Max 25 MB.",
    limitImages: "I file rimangono sul tuo dispositivo. 25 MB per immagine.",
    limitPdf: "I file rimangono sul tuo dispositivo. Max 25 MB.",
    cropWidth: "Larghezza ritaglio",
    cropHeight: "Altezza ritaglio",
    before: "Prima",
    after: "Dopo",
    pagesLabel: "{count} pagine",
    pageAlt: "Pagina {n}",
    unknownType: "sconosciuto",
    ocrDrop: "Trascina un’immagine qui o fai clic per selezionare",
    ocrSelect: "Supportati PNG, JPG, WEBP",
  },
  pt: {
    dropImage: "Solte uma imagem aqui ou clique para selecionar",
    dropImages: "Solte imagens aqui ou clique para selecionar",
    dropPdf: "Solte um PDF aqui ou clique para selecionar",
    selectImage: "PNG, JPG, WEBP — até 25 MB",
    selectImages: "PNG, JPG, WEBP — 25 MB por imagem",
    selectPdf: "PDF — até 25 MB",
    limitImage: "Os arquivos permanecem no seu dispositivo. Máx. 25 MB.",
    limitImages: "Os arquivos permanecem no seu dispositivo. 25 MB por imagem.",
    limitPdf: "Os arquivos permanecem no seu dispositivo. Máx. 25 MB.",
    cropWidth: "Largura do corte",
    cropHeight: "Altura do corte",
    before: "Antes",
    after: "Depois",
    pagesLabel: "{count} páginas",
    pageAlt: "Página {n}",
    unknownType: "desconhecido",
    ocrDrop: "Solte uma imagem aqui ou clique para selecionar",
    ocrSelect: "PNG, JPG, WEBP compatíveis",
  },
  ru: {
    dropImage: "Перетащите изображение сюда или нажмите для выбора",
    dropImages: "Перетащите изображения сюда или нажмите для выбора",
    dropPdf: "Перетащите PDF сюда или нажмите для выбора",
    selectImage: "PNG, JPG, WEBP — до 25 МБ",
    selectImages: "PNG, JPG, WEBP — до 25 МБ на изображение",
    selectPdf: "PDF — до 25 МБ",
    limitImage: "Файлы остаются на вашем устройстве. Макс. 25 МБ.",
    limitImages: "Файлы остаются на вашем устройстве. Макс. 25 МБ на изображение.",
    limitPdf: "Файлы остаются на вашем устройстве. Макс. 25 МБ.",
    cropWidth: "Ширина обрезки",
    cropHeight: "Высота обрезки",
    before: "До",
    after: "После",
    pagesLabel: "{count} стр.",
    pageAlt: "Страница {n}",
    unknownType: "неизвестно",
    ocrDrop: "Перетащите изображение сюда или нажмите для выбора",
    ocrSelect: "Поддерживаются PNG, JPG, WEBP",
  },
};

for (const locale of locales) {
  const file = path.join(root, `${locale}.json`);
  const dict = JSON.parse(fs.readFileSync(file, "utf8"));
  const t = L[locale];

  for (const key of imageTools) {
    const tool = dict.tools[key];
    if (!tool) continue;
    tool.dropHint = t.dropImage;
    tool.selectHint = t.selectImage;
    tool.limitHint = t.limitImage;
  }

  // Multi-image tools
  for (const key of ["imagesToPdf", "imagesToPptx"]) {
    const tool = dict.tools[key];
    if (!tool) continue;
    tool.dropHint = t.dropImages;
    tool.selectHint = t.selectImages;
    tool.limitHint = t.limitImages;
  }

  if (dict.tools.pdfToImages) {
    Object.assign(dict.tools.pdfToImages, {
      dropHint: t.dropPdf,
      selectHint: t.selectPdf,
      limitHint: t.limitPdf,
      pagesLabel: t.pagesLabel,
      pageAlt: t.pageAlt,
    });
  }

  if (dict.tools.imageCrop) {
    Object.assign(dict.tools.imageCrop, {
      cropWidth: t.cropWidth,
      cropHeight: t.cropHeight,
    });
  }

  if (dict.tools.imageEnhance) {
    Object.assign(dict.tools.imageEnhance, {
      before: t.before,
      after: t.after,
    });
  }

  if (dict.tools.imageMetadata) {
    Object.assign(dict.tools.imageMetadata, {
      unknownType: t.unknownType,
    });
  }

  if (dict.tools.ocr) {
    Object.assign(dict.tools.ocr, {
      dropHint: t.ocrDrop,
      selectImage: t.ocrSelect,
    });
  }

  fs.writeFileSync(file, `${JSON.stringify(dict, null, 2)}\n`);
  console.log(`patched ${locale}`);
}

console.log("done", { imageTools, relatedTools });
