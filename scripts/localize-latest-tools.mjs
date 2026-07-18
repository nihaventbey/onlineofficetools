import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/dictionaries");
const toolKeys = [
  "findReplace", "pdfToText", "docxViewer", "docxToHtml", "htmlToDocx",
  "docxDiff", "textToPdf", "xlsxViewer", "xlsxToCsv", "csvToXlsx",
  "csvEditor", "imagesToPptx", "textToPptx", "pptxExtract", "pdfToImages",
  "imageResize", "imageCompress", "imageCrop", "imageConvert", "imageMetadata",
  "imageEnhance", "imageAiUpscale",
];

const titles = {
  tr: ["Bul ve Değiştir", "PDF'den Metne", "DOCX Görüntüleyici", "DOCX'ten HTML'ye", "HTML / Metinden DOCX'e", "DOCX Karşılaştırma", "Metinden PDF'e", "XLSX Görüntüleyici", "XLSX'ten CSV'ye", "CSV'den XLSX'e", "CSV Düzenleyici", "Görsellerden PowerPoint'e", "Metinden PowerPoint'e", "PowerPoint İçeriğini Çıkar", "PDF'den Görsellere", "Görsel Boyutlandırıcı", "Görsel Sıkıştırıcı", "Görsel Kırpma ve Döndürme", "Görsel Dönüştürücü", "Görsel Meta Verisi Temizleyici", "Görsel İyileştirici", "AI Görsel Yükseltici (Beta)"],
  de: ["Suchen und Ersetzen", "PDF in Text", "DOCX-Betrachter", "DOCX in HTML", "HTML / Text in DOCX", "DOCX vergleichen", "Text in PDF", "XLSX-Betrachter", "XLSX in CSV", "CSV in XLSX", "CSV-Editor", "Bilder in PowerPoint", "Text in PowerPoint", "PowerPoint-Inhalte extrahieren", "PDF in Bilder", "Bildgröße ändern", "Bilder komprimieren", "Bild zuschneiden und drehen", "Bildkonverter", "Bildmetadaten entfernen", "Bild verbessern", "KI-Bildvergrößerung (Beta)"],
  fr: ["Rechercher et remplacer", "PDF en texte", "Visionneuse DOCX", "DOCX en HTML", "HTML / Texte en DOCX", "Comparer des DOCX", "Texte en PDF", "Visionneuse XLSX", "XLSX en CSV", "CSV en XLSX", "Éditeur CSV", "Images en PowerPoint", "Texte en PowerPoint", "Extraire le contenu PowerPoint", "PDF en images", "Redimensionner une image", "Compresser une image", "Recadrer et pivoter une image", "Convertisseur d’images", "Nettoyer les métadonnées d’image", "Améliorer une image", "Agrandisseur d’image IA (bêta)"],
  es: ["Buscar y reemplazar", "PDF a texto", "Visor DOCX", "DOCX a HTML", "HTML / Texto a DOCX", "Comparar DOCX", "Texto a PDF", "Visor XLSX", "XLSX a CSV", "CSV a XLSX", "Editor CSV", "Imágenes a PowerPoint", "Texto a PowerPoint", "Extraer contenido de PowerPoint", "PDF a imágenes", "Redimensionar imagen", "Comprimir imagen", "Recortar y girar imagen", "Convertidor de imágenes", "Limpiar metadatos de imagen", "Mejorar imagen", "Ampliador de imágenes con IA (beta)"],
  it: ["Trova e sostituisci", "PDF in testo", "Visualizzatore DOCX", "DOCX in HTML", "HTML / Testo in DOCX", "Confronta DOCX", "Testo in PDF", "Visualizzatore XLSX", "XLSX in CSV", "CSV in XLSX", "Editor CSV", "Immagini in PowerPoint", "Testo in PowerPoint", "Estrai contenuti PowerPoint", "PDF in immagini", "Ridimensiona immagine", "Comprimi immagine", "Ritaglia e ruota immagine", "Convertitore di immagini", "Rimuovi metadati immagine", "Migliora immagine", "Ingrandimento immagini IA (beta)"],
  pt: ["Localizar e substituir", "PDF para texto", "Visualizador DOCX", "DOCX para HTML", "HTML / Texto para DOCX", "Comparar DOCX", "Texto para PDF", "Visualizador XLSX", "XLSX para CSV", "CSV para XLSX", "Editor CSV", "Imagens para PowerPoint", "Texto para PowerPoint", "Extrair conteúdo do PowerPoint", "PDF para imagens", "Redimensionar imagem", "Comprimir imagem", "Cortar e girar imagem", "Conversor de imagens", "Remover metadados da imagem", "Melhorar imagem", "Ampliador de imagem com IA (beta)"],
  ru: ["Найти и заменить", "PDF в текст", "Просмотр DOCX", "DOCX в HTML", "HTML / Текст в DOCX", "Сравнение DOCX", "Текст в PDF", "Просмотр XLSX", "XLSX в CSV", "CSV в XLSX", "Редактор CSV", "Изображения в PowerPoint", "Текст в PowerPoint", "Извлечь содержимое PowerPoint", "PDF в изображения", "Изменить размер изображения", "Сжать изображение", "Обрезать и повернуть изображение", "Конвертер изображений", "Удалить метаданные изображения", "Улучшить изображение", "ИИ-увеличение изображения (бета)"],
};

const localeText = {
  tr: {
    description: (title) => `${title} işlemini ücretsiz ve doğrudan tarayıcınızda yapın.`,
    metaTitle: (title) => `${title} — Ücretsiz Online Araç`,
    metaDescription: (title) => `${title} aracını yükleme yapmadan tarayıcınızda kullanın.`,
    fields: ["Metninizi buraya yapıştırın…","Bul","Şununla değiştir","Tümünü değiştir","Satırları kırp","Yinelenen satırları kaldır","Satırları sırala","Kopyala","Kopyalandı!","Temizle","Dosyaları buraya bırakın veya seçmek için tıklayın","Desteklenen biçimler aşağıda listelenmiştir","Kaldır","İndir","İşleniyor…","Desteklenmeyen dosya türü.","Dosya boyut sınırını aşıyor.","Bir hata oluştu.","Dosyalar cihazınızda kalır.","Çıkarılabilir metin bulunamadı.","sayfa","Metni çıkar","Sol belge","Sağ belge","Karşılaştır","Belgeler aynı.","fark","Sayfa","satır","Satır ekle","Sütun ekle","Tümünü indir","Genişlik","Yükseklik","En-boy oranını koru","Yüzde","Kalite","Sonuç boyutu","Döndür","Yatay çevir","Dikey çevir","Biçim","Meta verileri kaldır","Bilgi","Ölçek","Keskinlik","Kontrast","Başlat","Bu cihaz AI modelini çalıştıramıyor. Bunun yerine Görsel İyileştirici'yi deneyin.","Model indiriliyor…","Model herkese açık bir CDN'den yüklenir. Görseliniz bu cihazda kalır."],
    html: ["Korumalı önizleme","İsteğe bağlı korumalı iframe önizlemesini göster","Merhaba","HTML kodunu düzenleyin; sonucu burada görün."],
    ai: ["Beta: Başlattığınızda AI modeli CDN'den yüklenir. Kullanılamazsa Canvas 2× kullanılır.","Bunun yerine Canvas 2× büyütme kullanılacak.","AI modeli kullanılamadığı için Canvas 2× yöntemi kullanıldı."],
  },
  de: {
    description: (title) => `${title} kostenlos und direkt im Browser verwenden.`,
    metaTitle: (title) => `${title} — Kostenloses Online-Tool`,
    metaDescription: (title) => `${title} ohne Upload direkt im Browser nutzen.`,
    fields: ["Text hier einfügen…","Suchen","Ersetzen durch","Alle ersetzen","Zeilen bereinigen","Doppelte Zeilen entfernen","Zeilen sortieren","Kopieren","Kopiert!","Leeren","Dateien hier ablegen oder zum Auswählen klicken","Unterstützte Formate sind unten aufgeführt","Entfernen","Herunterladen","Verarbeitung…","Nicht unterstützter Dateityp.","Datei überschreitet das Größenlimit.","Etwas ist schiefgelaufen.","Dateien bleiben auf Ihrem Gerät.","Kein extrahierbarer Text gefunden.","Seiten","Text extrahieren","Linkes Dokument","Rechtes Dokument","Vergleichen","Die Dokumente sind identisch.","Unterschiede","Tabelle","Zeilen","Zeile hinzufügen","Spalte hinzufügen","Alle herunterladen","Breite","Höhe","Seitenverhältnis beibehalten","Prozent","Qualität","Ergebnisgröße","Drehen","Horizontal spiegeln","Vertikal spiegeln","Format","Metadaten entfernen","Informationen","Skalierung","Schärfe","Kontrast","Starten","Dieses Gerät kann das KI-Modell nicht ausführen. Verwenden Sie stattdessen den Bildverbesserer.","Modell wird heruntergeladen…","Das Modell wird von einem öffentlichen CDN geladen. Ihr Bild bleibt auf diesem Gerät."],
    html: ["Sandbox-Vorschau","Optionale Sandbox-iframe-Vorschau anzeigen","Hallo","Bearbeiten Sie links das HTML und sehen Sie hier die Vorschau."],
    ai: ["Beta: Das KI-Modell wird beim Start vom CDN geladen. Falls es nicht verfügbar ist, wird Canvas 2× verwendet.","Stattdessen wird Canvas 2× verwendet.","Canvas 2× wurde verwendet, da das KI-Modell nicht verfügbar war."],
  },
  fr: {
    description: (title) => `Utilisez ${title} gratuitement et directement dans votre navigateur.`,
    metaTitle: (title) => `${title} — Outil en ligne gratuit`,
    metaDescription: (title) => `Utilisez ${title} dans votre navigateur, sans téléversement.`,
    fields: ["Collez votre texte…","Rechercher","Remplacer par","Tout remplacer","Nettoyer les lignes","Supprimer les doublons","Trier les lignes","Copier","Copié !","Effacer","Déposez les fichiers ici ou cliquez pour les sélectionner","Les formats pris en charge sont indiqués ci-dessous","Supprimer","Télécharger","Traitement…","Type de fichier non pris en charge.","Le fichier dépasse la taille autorisée.","Une erreur s’est produite.","Les fichiers restent sur votre appareil.","Aucun texte extractible trouvé.","pages","Extraire le texte","Document gauche","Document droit","Comparer","Les documents sont identiques.","différences","Feuille","lignes","Ajouter une ligne","Ajouter une colonne","Tout télécharger","Largeur","Hauteur","Conserver les proportions","Pourcentage","Qualité","Taille du résultat","Pivoter","Retourner horizontalement","Retourner verticalement","Format","Supprimer les métadonnées","Informations","Échelle","Netteté","Contraste","Démarrer","Cet appareil ne peut pas exécuter le modèle IA. Essayez plutôt l’améliorateur d’image.","Téléchargement du modèle…","Le modèle est chargé depuis un CDN public. Votre image reste sur cet appareil."],
    html: ["Aperçu sécurisé","Afficher l’aperçu iframe sécurisé facultatif","Bonjour","Modifiez le HTML à gauche pour afficher l’aperçu ici."],
    ai: ["Bêta : le modèle IA est chargé depuis le CDN au démarrage. Canvas 2× est utilisé s’il est indisponible.","L’agrandissement Canvas 2× sera utilisé à la place.","Canvas 2× a été utilisé car le modèle IA était indisponible."],
  },
  es: {
    description: (title) => `Usa ${title} gratis y directamente en tu navegador.`,
    metaTitle: (title) => `${title} — Herramienta online gratis`,
    metaDescription: (title) => `Usa ${title} en tu navegador sin subir archivos.`,
    fields: ["Pega tu texto…","Buscar","Reemplazar por","Reemplazar todo","Limpiar líneas","Eliminar líneas duplicadas","Ordenar líneas","Copiar","¡Copiado!","Borrar","Suelta los archivos aquí o haz clic para seleccionarlos","Los formatos compatibles se indican abajo","Eliminar","Descargar","Procesando…","Tipo de archivo no compatible.","El archivo supera el límite de tamaño.","Algo salió mal.","Los archivos permanecen en tu dispositivo.","No se encontró texto extraíble.","páginas","Extraer texto","Documento izquierdo","Documento derecho","Comparar","Los documentos son idénticos.","diferencias","Hoja","filas","Añadir fila","Añadir columna","Descargar todo","Ancho","Alto","Mantener proporción","Porcentaje","Calidad","Tamaño del resultado","Girar","Voltear horizontalmente","Voltear verticalmente","Formato","Eliminar metadatos","Información","Escala","Nitidez","Contraste","Iniciar","Este dispositivo no puede ejecutar el modelo de IA. Prueba el mejorador de imágenes.","Descargando modelo…","El modelo se carga desde una CDN pública. Tu imagen permanece en este dispositivo."],
    html: ["Vista previa segura","Mostrar vista previa iframe segura opcional","Hola","Edita el HTML de la izquierda para ver aquí el resultado."],
    ai: ["Beta: el modelo de IA se carga desde la CDN al iniciar. Si no está disponible, se usa Canvas 2×.","Se usará la ampliación Canvas 2× en su lugar.","Se usó Canvas 2× porque el modelo de IA no estaba disponible."],
  },
  it: {
    description: (title) => `Usa ${title} gratuitamente e direttamente nel browser.`,
    metaTitle: (title) => `${title} — Strumento online gratuito`,
    metaDescription: (title) => `Usa ${title} nel browser senza caricare file.`,
    fields: ["Incolla il testo…","Trova","Sostituisci con","Sostituisci tutto","Pulisci righe","Rimuovi righe duplicate","Ordina righe","Copia","Copiato!","Cancella","Trascina qui i file o fai clic per selezionarli","I formati supportati sono elencati sotto","Rimuovi","Scarica","Elaborazione…","Tipo di file non supportato.","Il file supera il limite di dimensione.","Si è verificato un errore.","I file rimangono sul tuo dispositivo.","Nessun testo estraibile trovato.","pagine","Estrai testo","Documento sinistro","Documento destro","Confronta","I documenti sono identici.","differenze","Foglio","righe","Aggiungi riga","Aggiungi colonna","Scarica tutto","Larghezza","Altezza","Mantieni proporzioni","Percentuale","Qualità","Dimensione risultato","Ruota","Rifletti orizzontalmente","Rifletti verticalmente","Formato","Rimuovi metadati","Informazioni","Scala","Nitidezza","Contrasto","Avvia","Questo dispositivo non può eseguire il modello IA. Prova invece Migliora immagine.","Download del modello…","Il modello viene caricato da una CDN pubblica. L’immagine rimane su questo dispositivo."],
    html: ["Anteprima protetta","Mostra l’anteprima iframe protetta facoltativa","Ciao","Modifica l’HTML a sinistra per vedere qui l’anteprima."],
    ai: ["Beta: il modello IA viene caricato dalla CDN all’avvio. Se non è disponibile, viene usato Canvas 2×.","Verrà usato l’ingrandimento Canvas 2×.","È stato usato Canvas 2× perché il modello IA non era disponibile."],
  },
  pt: {
    description: (title) => `Use ${title} gratuitamente e diretamente no navegador.`,
    metaTitle: (title) => `${title} — Ferramenta online gratuita`,
    metaDescription: (title) => `Use ${title} no navegador sem enviar arquivos.`,
    fields: ["Cole seu texto…","Localizar","Substituir por","Substituir tudo","Limpar linhas","Remover linhas duplicadas","Ordenar linhas","Copiar","Copiado!","Limpar","Solte os arquivos aqui ou clique para selecionar","Os formatos compatíveis estão listados abaixo","Remover","Baixar","Processando…","Tipo de arquivo não compatível.","O arquivo excede o limite de tamanho.","Algo deu errado.","Os arquivos permanecem no seu dispositivo.","Nenhum texto extraível encontrado.","páginas","Extrair texto","Documento esquerdo","Documento direito","Comparar","Os documentos são idênticos.","diferenças","Planilha","linhas","Adicionar linha","Adicionar coluna","Baixar tudo","Largura","Altura","Manter proporção","Porcentagem","Qualidade","Tamanho do resultado","Girar","Virar horizontalmente","Virar verticalmente","Formato","Remover metadados","Informações","Escala","Nitidez","Contraste","Iniciar","Este dispositivo não pode executar o modelo de IA. Tente o melhorador de imagem.","Baixando modelo…","O modelo é carregado de uma CDN pública. Sua imagem permanece neste dispositivo."],
    html: ["Pré-visualização protegida","Mostrar pré-visualização iframe protegida opcional","Olá","Edite o HTML à esquerda para ver a prévia aqui."],
    ai: ["Beta: o modelo de IA é carregado da CDN ao iniciar. Se indisponível, o Canvas 2× será usado.","A ampliação Canvas 2× será usada no lugar.","O Canvas 2× foi usado porque o modelo de IA estava indisponível."],
  },
  ru: {
    description: (title) => `Используйте «${title}» бесплатно прямо в браузере.`,
    metaTitle: (title) => `${title} — бесплатный онлайн-инструмент`,
    metaDescription: (title) => `Используйте «${title}» в браузере без загрузки файлов.`,
    fields: ["Вставьте текст…","Найти","Заменить на","Заменить всё","Очистить строки","Удалить дубликаты строк","Сортировать строки","Копировать","Скопировано!","Очистить","Перетащите файлы сюда или нажмите для выбора","Поддерживаемые форматы указаны ниже","Удалить","Скачать","Обработка…","Неподдерживаемый тип файла.","Файл превышает допустимый размер.","Произошла ошибка.","Файлы остаются на вашем устройстве.","Текст для извлечения не найден.","страниц","Извлечь текст","Левый документ","Правый документ","Сравнить","Документы идентичны.","различия","Лист","строк","Добавить строку","Добавить столбец","Скачать всё","Ширина","Высота","Сохранять пропорции","Процент","Качество","Размер результата","Повернуть","Отразить по горизонтали","Отразить по вертикали","Формат","Удалить метаданные","Информация","Масштаб","Резкость","Контраст","Начать","Это устройство не может запустить модель ИИ. Используйте улучшение изображения.","Загрузка модели…","Модель загружается из общедоступной CDN. Изображение остаётся на этом устройстве."],
    html: ["Безопасный предпросмотр","Показать дополнительный предпросмотр в защищённом iframe","Привет","Измените HTML слева, чтобы увидеть результат здесь."],
    ai: ["Бета: модель ИИ загружается из CDN после запуска. Если она недоступна, используется Canvas 2×.","Вместо этого будет использовано увеличение Canvas 2×.","Использован Canvas 2×, так как модель ИИ недоступна."],
  },
};

const fieldKeys = [
  "placeholder", "find", "replace", "apply", "trim", "dedupe", "sort", "copy",
  "copied", "clear", "dropHint", "selectHint", "remove", "download", "processing",
  "invalidFile", "tooLarge", "error", "limitHint", "empty", "pages", "extract",
  "left", "right", "compare", "identical", "differences", "sheet", "rows", "addRow",
  "addCol", "downloadAll", "width", "height", "keepRatio", "percent", "quality",
  "resultSize", "rotate", "flipH", "flipV", "format", "strip", "info", "scale",
  "sharpen", "contrast", "start", "unsupported", "loadingModel", "privacyNote",
];

const privacyAi = {
  tr: "\n\nCihaz içi AI özellikleri\nİsteğe bağlı AI görsel yükseltici, ONNX modelini yalnızca aracı başlattığınızda herkese açık bir CDN'den indirir. Görseliniz cihazınızdan ayrılmaz; ancak model dosyasını sunan CDN standart bağlantı bilgilerini (ör. IP adresi ve kullanıcı aracısı) işleyebilir.",
  de: "\n\nKI-Funktionen auf dem Gerät\nDie optionale KI-Bildvergrößerung lädt das ONNX-Modell erst beim Start des Werkzeugs von einem öffentlichen CDN. Ihr Bild verlässt Ihr Gerät nicht; der CDN-Anbieter kann jedoch übliche Verbindungsdaten wie IP-Adresse und User-Agent verarbeiten.",
  fr: "\n\nFonctions d’IA sur l’appareil\nL’agrandisseur d’image IA facultatif télécharge le modèle ONNX depuis un CDN public uniquement lorsque vous lancez l’outil. Votre image ne quitte pas votre appareil ; le fournisseur du CDN peut toutefois traiter les données de connexion habituelles, telles que l’adresse IP et l’agent utilisateur.",
  es: "\n\nFunciones de IA en el dispositivo\nEl ampliador de imágenes con IA opcional descarga el modelo ONNX desde una CDN pública solo al iniciar la herramienta. La imagen no sale de tu dispositivo; no obstante, el proveedor de la CDN puede procesar datos de conexión habituales, como la dirección IP y el agente de usuario.",
  it: "\n\nFunzioni IA sul dispositivo\nLa funzione facoltativa di ingrandimento IA scarica il modello ONNX da una CDN pubblica solo quando avvii lo strumento. L’immagine non lascia il dispositivo; il fornitore della CDN può tuttavia elaborare i normali dati di connessione, come indirizzo IP e user agent.",
  pt: "\n\nRecursos de IA no dispositivo\nO ampliador de imagem com IA opcional baixa o modelo ONNX de uma CDN pública somente quando a ferramenta é iniciada. Sua imagem não sai do dispositivo; contudo, o provedor da CDN pode processar dados comuns de conexão, como endereço IP e agente do usuário.",
  ru: "\n\nФункции ИИ на устройстве\nДополнительный инструмент ИИ-увеличения загружает модель ONNX из общедоступной CDN только после запуска. Изображение не покидает устройство, однако поставщик CDN может обрабатывать стандартные данные соединения, например IP-адрес и user-agent.",
};

for (const [locale, localizedTitles] of Object.entries(titles)) {
  const file = path.join(root, `${locale}.json`);
  const dict = JSON.parse(fs.readFileSync(file, "utf8"));
  const text = localeText[locale];
  const translatedFields = Object.fromEntries(fieldKeys.map((key, index) => [key, text.fields[index]]));

  toolKeys.forEach((toolKey, index) => {
    const current = dict.tools[toolKey];
    const title = localizedTitles[index];
    for (const key of Object.keys(current)) {
      if (translatedFields[key]) current[key] = translatedFields[key];
    }
    current.title = title;
    current.description = text.description(title);
    current.metaTitle = text.metaTitle(title);
    current.metaDescription = text.metaDescription(title);
  });

  Object.assign(dict.tools.htmlEditor, {
    sandboxPreview: text.html[0],
    showSandbox: text.html[1],
    sampleTitle: text.html[2],
    sampleText: text.html[3],
  });
  Object.assign(dict.tools.imageAiUpscale, {
    betaNote: text.ai[0],
    fallbackNote: text.ai[1],
    fallbackUsed: text.ai[2],
  });
  if (!dict.legal.privacy.body.includes("ONNX")) {
    dict.legal.privacy.body += privacyAi[locale];
  }

  fs.writeFileSync(file, `${JSON.stringify(dict, null, 2)}\n`);
}

const enFile = path.join(root, "en.json");
const en = JSON.parse(fs.readFileSync(enFile, "utf8"));
Object.assign(en.tools.htmlEditor, {
  sandboxPreview: "Sandbox preview",
  showSandbox: "Show optional sandbox iframe preview",
  sampleTitle: "Hello",
  sampleText: "Edit HTML on the left to preview here.",
});
Object.assign(en.tools.imageAiUpscale, {
  betaNote: "Beta: the AI model loads from the CDN when you start. Canvas 2× is used if unavailable.",
  fallbackNote: "Canvas 2× upscale will be used instead.",
  fallbackUsed: "Canvas 2× fallback was used because the AI model was unavailable.",
});
fs.writeFileSync(enFile, `${JSON.stringify(en, null, 2)}\n`);
