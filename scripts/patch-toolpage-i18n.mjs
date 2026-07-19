/**
 * Adds toolPage FAQ/HowTo templates to all locale dictionaries.
 * Run: node scripts/patch-toolpage-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/dictionaries");

const toolPage = {
  en: {
    howToTitle: "How to use {tool}",
    howToStep1: "Open {tool} and paste text or drop your file.",
    howToStep2: "Adjust options if needed, then run the tool in your browser.",
    howToStep3: "Copy or download the result. Nothing is uploaded to our servers.",
    faqTitle: "Frequently asked questions",
    faq1q: "Is {tool} free?",
    faq1a: "Yes. {tool} is free to use in your browser with no account required.",
    faq2q: "Are my files uploaded?",
    faq2a: "No. Processing happens on your device. Your files stay private.",
    faq3q: "Which formats are supported?",
    faq3a: "Supported formats for this tool: {formats}.",
    faq4q: "Do I need to install anything?",
    faq4a: "No installation. Open {tool} in a modern browser and start.",
  },
  tr: {
    howToTitle: "{tool} nasıl kullanılır?",
    howToStep1: "{tool} sayfasını açın; metni yapıştırın veya dosyanızı bırakın.",
    howToStep2: "Gerekirse seçenekleri ayarlayın, ardından aracı tarayıcınızda çalıştırın.",
    howToStep3: "Sonucu kopyalayın veya indirin. Sunucularımıza hiçbir şey yüklenmez.",
    faqTitle: "Sık sorulan sorular",
    faq1q: "{tool} ücretsiz mi?",
    faq1a: "Evet. {tool} hesabı olmadan, tarayıcınızda ücretsiz kullanılabilir.",
    faq2q: "Dosyalarım yükleniyor mu?",
    faq2a: "Hayır. İşlem cihazınızda yapılır; dosyalarınız gizli kalır.",
    faq3q: "Hangi biçimler destekleniyor?",
    faq3a: "Bu araç için desteklenen biçimler: {formats}.",
    faq4q: "Bir şey yüklemem gerekir mi?",
    faq4a: "Hayır. Modern bir tarayıcıda {tool} sayfasını açıp kullanmaya başlayın.",
  },
  de: {
    howToTitle: "So verwenden Sie {tool}",
    howToStep1: "Öffnen Sie {tool} und fügen Sie Text ein oder legen Sie Ihre Datei ab.",
    howToStep2: "Passen Sie bei Bedarf Optionen an und starten Sie das Tool im Browser.",
    howToStep3: "Kopieren oder laden Sie das Ergebnis herunter. Nichts wird hochgeladen.",
    faqTitle: "Häufig gestellte Fragen",
    faq1q: "Ist {tool} kostenlos?",
    faq1a: "Ja. {tool} ist im Browser kostenlos und ohne Konto nutzbar.",
    faq2q: "Werden meine Dateien hochgeladen?",
    faq2a: "Nein. Die Verarbeitung erfolgt auf Ihrem Gerät. Ihre Dateien bleiben privat.",
    faq3q: "Welche Formate werden unterstützt?",
    faq3a: "Unterstützte Formate für dieses Tool: {formats}.",
    faq4q: "Muss ich etwas installieren?",
    faq4a: "Nein. Öffnen Sie {tool} in einem modernen Browser und starten Sie.",
  },
  fr: {
    howToTitle: "Comment utiliser {tool}",
    howToStep1: "Ouvrez {tool} et collez du texte ou déposez votre fichier.",
    howToStep2: "Ajustez les options si besoin, puis lancez l’outil dans votre navigateur.",
    howToStep3: "Copiez ou téléchargez le résultat. Rien n’est envoyé sur nos serveurs.",
    faqTitle: "Questions fréquentes",
    faq1q: "{tool} est-il gratuit ?",
    faq1a: "Oui. {tool} est gratuit dans votre navigateur, sans compte.",
    faq2q: "Mes fichiers sont-ils téléversés ?",
    faq2a: "Non. Le traitement se fait sur votre appareil. Vos fichiers restent privés.",
    faq3q: "Quels formats sont pris en charge ?",
    faq3a: "Formats pris en charge pour cet outil : {formats}.",
    faq4q: "Dois-je installer quelque chose ?",
    faq4a: "Non. Ouvrez {tool} dans un navigateur moderne et commencez.",
  },
  es: {
    howToTitle: "Cómo usar {tool}",
    howToStep1: "Abre {tool} y pega texto o suelta tu archivo.",
    howToStep2: "Ajusta las opciones si hace falta y ejecuta la herramienta en el navegador.",
    howToStep3: "Copia o descarga el resultado. No se sube nada a nuestros servidores.",
    faqTitle: "Preguntas frecuentes",
    faq1q: "¿{tool} es gratis?",
    faq1a: "Sí. {tool} es gratis en el navegador y no requiere cuenta.",
    faq2q: "¿Se suben mis archivos?",
    faq2a: "No. El procesamiento ocurre en tu dispositivo. Tus archivos siguen privados.",
    faq3q: "¿Qué formatos se admiten?",
    faq3a: "Formatos admitidos para esta herramienta: {formats}.",
    faq4q: "¿Necesito instalar algo?",
    faq4a: "No. Abre {tool} en un navegador moderno y empieza.",
  },
  it: {
    howToTitle: "Come usare {tool}",
    howToStep1: "Apri {tool} e incolla il testo o trascina il file.",
    howToStep2: "Regola le opzioni se serve, poi avvia lo strumento nel browser.",
    howToStep3: "Copia o scarica il risultato. Nulla viene caricato sui nostri server.",
    faqTitle: "Domande frequenti",
    faq1q: "{tool} è gratis?",
    faq1a: "Sì. {tool} è gratuito nel browser e non richiede un account.",
    faq2q: "I miei file vengono caricati?",
    faq2a: "No. L’elaborazione avviene sul tuo dispositivo. I file restano privati.",
    faq3q: "Quali formati sono supportati?",
    faq3a: "Formati supportati per questo strumento: {formats}.",
    faq4q: "Devo installare qualcosa?",
    faq4a: "No. Apri {tool} in un browser moderno e inizia.",
  },
  pt: {
    howToTitle: "Como usar {tool}",
    howToStep1: "Abra {tool} e cole o texto ou solte o arquivo.",
    howToStep2: "Ajuste as opções se precisar e execute a ferramenta no navegador.",
    howToStep3: "Copie ou baixe o resultado. Nada é enviado aos nossos servidores.",
    faqTitle: "Perguntas frequentes",
    faq1q: "{tool} é gratuito?",
    faq1a: "Sim. {tool} é gratuito no navegador e não exige conta.",
    faq2q: "Meus arquivos são enviados?",
    faq2a: "Não. O processamento ocorre no seu dispositivo. Seus arquivos ficam privados.",
    faq3q: "Quais formatos são suportados?",
    faq3a: "Formatos suportados nesta ferramenta: {formats}.",
    faq4q: "Preciso instalar algo?",
    faq4a: "Não. Abra {tool} em um navegador moderno e comece.",
  },
  ru: {
    howToTitle: "Как пользоваться «{tool}»",
    howToStep1: "Откройте «{tool}» и вставьте текст или перетащите файл.",
    howToStep2: "При необходимости настройте параметры и запустите инструмент в браузере.",
    howToStep3: "Скопируйте или скачайте результат. На наши серверы ничего не загружается.",
    faqTitle: "Частые вопросы",
    faq1q: "«{tool}» бесплатен?",
    faq1a: "Да. «{tool}» можно бесплатно использовать в браузере без аккаунта.",
    faq2q: "Загружаются ли мои файлы?",
    faq2a: "Нет. Обработка выполняется на вашем устройстве. Файлы остаются приватными.",
    faq3q: "Какие форматы поддерживаются?",
    faq3a: "Поддерживаемые форматы для этого инструмента: {formats}.",
    faq4q: "Нужно ли что-то устанавливать?",
    faq4a: "Нет. Откройте «{tool}» в современном браузере и начните работу.",
  },
};

for (const [locale, block] of Object.entries(toolPage)) {
  const file = path.join(root, `${locale}.json`);
  const dict = JSON.parse(fs.readFileSync(file, "utf8"));
  dict.toolPage = block;
  fs.writeFileSync(file, `${JSON.stringify(dict, null, 2)}\n`);
  console.log("patched", locale);
}
