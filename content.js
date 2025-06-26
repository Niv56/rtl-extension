// הוספת CSS ישירות לעמוד
function injectCSS() {
  const css = `
    textarea, div[contenteditable="true"] {
      transition: text-align 0.2s ease, direction 0.2s ease !important;
    }
    
    [style*="unicode-bidi: plaintext"] {
      white-space: pre-wrap !important;
      word-wrap: break-word !important;
    }
    
    .rtl-helper-mixed {
      unicode-bidi: plaintext !important;
      text-align: start !important;
    }
  `;
  
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

// פונקציות עזר לזיהוי שפה
function isHebrew(text) {
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
}

function isEnglish(text) {
  const englishRegex = /[a-zA-Z]/;
  return englishRegex.test(text);
}

function isMixed(text) {
  return isHebrew(text) && isEnglish(text);
}

function getTextDirection(text) {
  if (!text.trim()) return 'ltr';
  
  if (isMixed(text)) {
    return 'auto'; // עבור טקסט מעורב
  } else if (isHebrew(text)) {
    return 'rtl';
  } else if (isEnglish(text)) {
    return 'ltr';
  }
  
  return 'ltr'; // ברירת מחדל
}

function updateTextDirection(element) {
  const text = element.value || element.textContent || '';
  const direction = getTextDirection(text);
  
  if (direction === 'auto') {
    // עבור טקסט מעורב - הגדרת כיוון בסיסי RTL אבל עם אפשרות למילים לזרום טבעי
    element.style.direction = 'rtl';
    element.style.textAlign = 'right';
    element.style.unicodeBidi = 'plaintext';
  } else {
    element.style.direction = direction;
    element.style.textAlign = direction === 'rtl' ? 'right' : 'left';
    element.style.unicodeBidi = 'normal';
  }
}

// פונקציה לחיפוש אלמנטי קלט
function findChatInputs() {
  const selectors = [
    'textarea[placeholder*="Message"]',
    'textarea[data-id="root"]',
    'div[contenteditable="true"]',
    'textarea',
    '#prompt-textarea',
    '[data-testid="textbox"]'
  ];
  
  const inputs = [];
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el.offsetParent !== null) { // אלמנט נראה
        inputs.push(el);
      }
    });
  });
  
  return inputs;
}

// מעקב אחר שינויים בטקסט
function attachListeners() {
  const inputs = findChatInputs();
  
  inputs.forEach(input => {
    if (input.hasAttribute('data-rtl-processed')) return;
    input.setAttribute('data-rtl-processed', 'true');
    
    // עדכון כיוון בזמן הקלדה
    input.addEventListener('input', function() {
      updateTextDirection(this);
    });
    
    // עדכון כיוון בעת פוקוס
    input.addEventListener('focus', function() {
      updateTextDirection(this);
    });
    
    // עדכון כיוון בעת איבוד פוקוס
    input.addEventListener('blur', function() {
      updateTextDirection(this);
    });
    
    // עדכון ראשוני
    updateTextDirection(input);
  });
}

// מעקב אחר שינויים בעמוד
function observePageChanges() {
  const observer = new MutationObserver(function(mutations) {
    let shouldReattach = false;
    
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // Element node
            const hasTextarea = node.querySelector && node.querySelector('textarea');
            const hasContentEditable = node.querySelector && node.querySelector('[contenteditable="true"]');
            if (hasTextarea || hasContentEditable || node.tagName === 'TEXTAREA') {
              shouldReattach = true;
            }
          }
        });
      }
    });
    
    if (shouldReattach) {
      setTimeout(attachListeners, 100);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// התחלה
function init() {
  // הוספת CSS
  injectCSS();
  
  // המתנה קצרה לטעינת העמוד
  setTimeout(() => {
    attachListeners();
    observePageChanges();
  }, 1000);
  
  // ניסיון נוסף אחרי זמן רב יותר
  setTimeout(() => {
    attachListeners();
  }, 3000);
}

// הפעלה כשהעמוד נטען
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// הפעלה נוספת כשהעמוד מסיים להיטען לחלוטין
window.addEventListener('load', () => {
  setTimeout(attachListeners, 500);
});