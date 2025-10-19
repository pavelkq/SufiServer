// admin-frontend/src/components/ArticleEdit/jiraConverter.js

// Конвертация HTML -> Jira Wiki
export const htmlToJira = (html) => {
  if (!html) return '';
  
  console.log('Input HTML:', html);
  
  let jiraText = html;

  // Обрабатываем изображения - ПРОСТАЯ ВЕРСИЯ: игнорируем alt полностью
  jiraText = jiraText.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, (match, src) => {
    console.log('Found image:', src);
    // Только src, без alt!
    return `!${src}!\n\n`;
  });

  // Обрабатываем блоки кода с сырым HTML
  jiraText = jiraText.replace(/<pre[^>]*data-raw-html[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (match, content) => {
    console.log('Found raw HTML code block:', content);
    return `{code}\n${content}\n{code}\n\n`;
  });

  // Обычные блоки кода (экранированные)
  jiraText = jiraText.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (match, content) => {
    console.log('Found regular code block:', content);
    const decodedContent = decodeHtmlEntities(content);
    return `{code}\n${decodedContent}\n{code}\n\n`;
  });

  // Заголовки
  jiraText = jiraText.replace(/<h1[^>]*>(.*?)<\/h1>/gi, 'h1. $1\n\n');
  jiraText = jiraText.replace(/<h2[^>]*>(.*?)<\/h2>/gi, 'h2. $1\n\n');
  jiraText = jiraText.replace(/<h3[^>]*>(.*?)<\/h3>/gi, 'h3. $1\n\n');
  jiraText = jiraText.replace(/<h4[^>]*>(.*?)<\/h4>/gi, 'h4. $1\n\n');

  // Цитаты
  jiraText = jiraText.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
    const cleanContent = content.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n').trim();
    return `{quote}\n${cleanContent}\n{quote}\n\n`;
  });

  // Списки
  jiraText = jiraText.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
    const listItems = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (match, itemContent) => {
      const cleanItem = itemContent.replace(/<[^>]*>/g, '').trim();
      return ` * ${cleanItem}\n`;
    });
    return listItems + '\n\n';
  });

  jiraText = jiraText.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
    const listItems = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (match, itemContent) => {
      const cleanItem = itemContent.replace(/<[^>]*>/g, '').trim();
      return ` # ${cleanItem}\n`;
    });
    return listItems + '\n\n';
  });

  // Inline форматирование
  jiraText = jiraText.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '*$1*');
  jiraText = jiraText.replace(/<b[^>]*>(.*?)<\/b>/gi, '*$1*');
  jiraText = jiraText.replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_');
  jiraText = jiraText.replace(/<i[^>]*>(.*?)<\/i>/gi, '_$1_');
  jiraText = jiraText.replace(/<u[^>]*>(.*?)<\/u>/gi, '+$1+');
  jiraText = jiraText.replace(/<s[^>]*>(.*?)<\/s>/gi, '-$1-');
  jiraText = jiraText.replace(/<strike[^>]*>(.*?)<\/strike>/gi, '-$1-');
  jiraText = jiraText.replace(/<del[^>]*>(.*?)<\/del>/gi, '-$1-');
  jiraText = jiraText.replace(/<code[^>]*>(.*?)<\/code>/gi, '{{$1}}');
  jiraText = jiraText.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2|$1]');

  // Абзацы и переносы
  jiraText = jiraText.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  jiraText = jiraText.replace(/<br\s*\/?>/gi, '\n');
  jiraText = jiraText.replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n');

  // Убираем оставшиеся теги
  jiraText = jiraText.replace(/<[^>]*>/g, '');
  
  // Чистка лишних переносов
  jiraText = jiraText.replace(/\n{3,}/g, '\n\n');
  jiraText = jiraText.replace(/^\s+|\s+$/g, '');

  console.log('Final Jira:', jiraText);
  return jiraText.trim();
};

// Конвертация Jira Wiki -> HTML
export const jiraToHtml = (jiraText) => {
  if (!jiraText) return '';
  
  let html = jiraText;
  const lines = html.split('\n');
  let result = [];
  let inList = false;
  let inCodeBlock = false;
  let inQuote = false;
  let listType = '';
  let codeContent = '';
  let quoteContent = '';

  // Функция для обработки ссылок в тексте
  const processLinks = (text) => {
    const linkRegex = /\[([^\|\]]+)\|([^\]]+)\]/g;
    return text.replace(linkRegex, 
      (match, linkText, linkUrl) => {
        return `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer nofollow">${linkText}</a>`;
      }
    );
  };

  // Функция для обработки изображений - ПРОСТАЯ ВЕРСИЯ
  const processImages = (text) => {
    // Обрабатываем оба формата, но игнорируем alt
    const imageRegex = /!([^!]+)!/g;
    let processedText = text.replace(imageRegex,
      (match, srcWithPossibleAlt) => {
        console.log('Found image:', srcWithPossibleAlt);
        // Извлекаем только src (игнорируем часть после | если есть)
        const src = srcWithPossibleAlt.split('|')[0];
        const fileName = src.split('/').pop() || 'image';
        return `<img src="${src}" alt="${fileName}" style="max-width: 100%; height: auto;" />`;
      }
    );

    // Также обрабатываем формат с экранированием (на случай если он уже есть)
    const escapedImageRegex = /!([^|!]+)\|alt=([^!]+)!/g;
    processedText = processedText.replace(escapedImageRegex,
      (match, src, alt) => {
        console.log('Found escaped image:', src);
        const fileName = src.split('/').pop() || 'image';
        return `<img src="${src}" alt="${fileName}" style="max-width: 100%; height: auto;" />`;
      }
    );
    
    return processedText;
  };

  // Функция для обработки inline-форматирования
  const processInlineFormatting = (text) => {
    // Сначала обрабатываем изображения
    let processedText = processImages(text);
    // Потом ссылки
    processedText = processLinks(processedText);
    
    // Остальное форматирование
    processedText = processedText
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/\+([^+]+)\+/g, '<u>$1</u>')
      .replace(/-([^-]+)-/g, '<s>$1</s>')
      .replace(/\{\{([^}]+)\}\}/g, '<code>$1</code>');
    
    return processedText;
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Пропускаем пустые строки
    if (!line) {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }
      if (inQuote) {
        result.push('</blockquote>');
        inQuote = false;
      }
      result.push('');
      continue;
    }

    // Блоки кода
    if (line === '{code}') {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }
      if (inQuote) {
        result.push('</blockquote>');
        inQuote = false;
      }
      inCodeBlock = true;
      codeContent = '';
      i++;
      while (i < lines.length && lines[i].trim() !== '{code}') {
        codeContent += lines[i] + '\n';
        i++;
      }
      result.push(`<pre data-raw-html="true"><code class="code-block">${codeContent.trim()}</code></pre>`);
      continue;
    }

    // Цитаты
    if (line === '{quote}') {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }
      if (inCodeBlock) inCodeBlock = false;
      inQuote = true;
      quoteContent = '';
      i++;
      while (i < lines.length && lines[i].trim() !== '{quote}') {
        quoteContent += lines[i] + '\n';
        i++;
      }
      result.push(`<blockquote><p>${processInlineFormatting(quoteContent.trim())}</p></blockquote>`);
      inQuote = false;
      continue;
    }

    // Заголовки
    if (line.match(/^h[1-4]\. /)) {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }
      if (inQuote) {
        result.push('</blockquote>');
        inQuote = false;
      }
      const level = line.match(/^h([1-4])\. /)[1];
      const content = line.replace(/^h[1-4]\. /, '');
      result.push(`<h${level}>${processInlineFormatting(content)}</h${level}>`);
      continue;
    }

    // Маркированные списки
    if (line.startsWith('* ')) {
      if (!inList || listType !== 'ul') {
        if (inList) result.push(`</${listType}>`);
        result.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      const content = line.substring(2);
      result.push(`<li>${processInlineFormatting(content)}</li>`);
      continue;
    }

    // Нумерованные списки
    if (line.startsWith('# ')) {
      if (!inList || listType !== 'ol') {
        if (inList) result.push(`</${listType}>`);
        result.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      const content = line.substring(2);
      result.push(`<li>${processInlineFormatting(content)}</li>`);
      continue;
    }

    // Изображения (отдельная строка начинающаяся с !)
    if (line.startsWith('!') && line.endsWith('!')) {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }
      if (inQuote) {
        result.push('</blockquote>');
        inQuote = false;
      }
      // Обрабатываем изображение
      const imageHtml = processImages(line);
      result.push(imageHtml);
      continue;
    }

    // Обычный текст
    if (inList) {
      result.push(`</${listType}>`);
      inList = false;
    }
    if (inQuote) {
      result.push('</blockquote>');
      inQuote = false;
    }
    
    result.push(`<p>${processInlineFormatting(line)}</p>`);
  }

  if (inList) result.push(`</${listType}>`);
  if (inQuote) result.push('</blockquote>');

  html = result.join('\n');
  
  // Очистка лишних тегов
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p><p>/g, '<p>');
  html = html.replace(/<\/p><\/p>/g, '</p>');
  html = html.replace(/<p><img/g, '<img');
  html = html.replace(/<\/p><\/img>/g, '</img>');
  html = html.replace(/<img([^>]*)><\/p>/g, '<img$1>');

  console.log('Final HTML:', html);
  return html;
};

// Функция для декодирования HTML entities
function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}