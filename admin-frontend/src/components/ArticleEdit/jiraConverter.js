// admin-frontend/src/components/ArticleEdit/jiraConverter.js

// Конвертация HTML -> Jira Wiki
export const htmlToJira = (html) => {
  if (!html) return '';
  
  let jiraText = html;

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

  // Маркированные списки - улучшенная обработка
  jiraText = jiraText.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
    const listItems = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (match, itemContent) => {
      const cleanItem = itemContent.replace(/<[^>]*>/g, '').trim();
      return ` * ${cleanItem}\n`;
    });
    return listItems + '\n';
  });

  // Нумерованные списки - улучшенная обработка
  jiraText = jiraText.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
    const listItems = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (match, itemContent) => {
      const cleanItem = itemContent.replace(/<[^>]*>/g, '').trim();
      return ` # ${cleanItem}\n`;
    });
    return listItems + '\n';
  });

  // Жирный текст
  jiraText = jiraText.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '*$1*');
  jiraText = jiraText.replace(/<b[^>]*>(.*?)<\/b>/gi, '*$1*');

  // Курсив
  jiraText = jiraText.replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_');
  jiraText = jiraText.replace(/<i[^>]*>(.*?)<\/i>/gi, '_$1_');

  // Подчеркнутый
  jiraText = jiraText.replace(/<u[^>]*>(.*?)<\/u>/gi, '+$1+');

  // Зачеркнутый
  jiraText = jiraText.replace(/<s[^>]*>(.*?)<\/s>/gi, '-$1-');
  jiraText = jiraText.replace(/<strike[^>]*>(.*?)<\/strike>/gi, '-$1-');
  jiraText = jiraText.replace(/<del[^>]*>(.*?)<\/del>/gi, '-$1-');

  // Код
  jiraText = jiraText.replace(/<code[^>]*>(.*?)<\/code>/gi, '{{$1}}');

  // Ссылки
  jiraText = jiraText.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2|$1]');

  // Абзацы
  jiraText = jiraText.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  jiraText = jiraText.replace(/<br\s*\/?>/gi, '\n');
  jiraText = jiraText.replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n');

  // Убираем все оставшиеся HTML теги
  jiraText = jiraText.replace(/<[^>]*>/g, '');
  
  // Чистка лишних переносов
  jiraText = jiraText.replace(/\n\s*\n\s*\n/g, '\n\n');
  jiraText = jiraText.replace(/^\s+|\s+$/g, '');
  jiraText = jiraText.replace(/\n{3,}/g, '\n\n');

  return jiraText.trim();
};

// Конвертация Jira Wiki -> HTML (ПЕРЕПИСАНА!)
export const jiraToHtml = (jiraText) => {
  if (!jiraText) return '';
  
  let html = jiraText;

  // Разбиваем на строки для правильной обработки
  const lines = html.split('\n');
  let inList = false;
  let listType = ''; // 'ul' или 'ol'
  let result = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Пропускаем пустые строки
    if (!line) {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }
      result.push('');
      continue;
    }

    // Заголовки
    if (line.match(/^h[1-4]\. /)) {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }
      const level = line.match(/^h([1-4])\. /)[1];
      const content = line.replace(/^h[1-4]\. /, '');
      result.push(`<h${level}>${processInlineFormatting(content)}</h${level}>`);
      continue;
    }

    // Цитаты
    if (line === '{quote}') {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }
      let quoteContent = '';
      i++;
      while (i < lines.length && lines[i].trim() !== '{quote}') {
        quoteContent += lines[i] + '\n';
        i++;
      }
      result.push(`<blockquote><p>${processInlineFormatting(quoteContent.trim())}</p></blockquote>`);
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

    // Обычный текст
    if (inList) {
      result.push(`</${listType}>`);
      inList = false;
    }
    result.push(`<p>${processInlineFormatting(line)}</p>`);
  }

  // Закрываем последний список если нужно
  if (inList) {
    result.push(`</${listType}>`);
  }

  // Функция для обработки inline-форматирования
  function processInlineFormatting(text) {
    return text
      // Жирный
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      // Курсив
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      // Подчеркнутый
      .replace(/\+([^+]+)\+/g, '<u>$1</u>')
      // Зачеркнутый
      .replace(/-([^-]+)-/g, '<s>$1</s>')
      // Код
      .replace(/\{\{([^}]+)\}\}/g, '<code>$1</code>')
      // Ссылки
      .replace(/\[([^|\]]+)\|([^]]+)\]/g, '<a href="$2" target="_blank" rel="noopener noreferrer nofollow">$1</a>');
  }

  html = result.join('\n');
  
  // Очистка лишних тегов
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p><p>/g, '<p>');
  html = html.replace(/<\/p><\/p>/g, '</p>');

  return html;
};