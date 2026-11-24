const modules = {
  instructions: {
    description: '比較純文字指令和有圖示提示時，兩步操作的表現。',
    steps: [
      { label: '文字提示', prompt: '先點書本，再點水杯。', order: ['book', 'cup'] },
      { label: '圖示提示', prompt: '照圖示的順序點選：🥤　接著　📗', order: ['cup', 'book'] },
    ],
  },
  switching: {
    description: '先按一個規則選圖卡，再換規則，看看操作如何改變。',
    steps: [
      { label: '按形狀', prompt: '依序點選三角形、圓形。', order: ['triangle', 'circle'] },
      { label: '按顏色', prompt: '依序點選藍色、黃色。', order: ['circle', 'triangle'] },
    ],
  },
};

const cards = {
  book: { symbol: '📗', label: '書本' },
  cup: { symbol: '🥤', label: '水杯' },
  circle: { symbol: '🔵', label: '藍色圓形' },
  triangle: { symbol: '🔺', label: '黃色三角形' },
};

const moduleSelect = document.querySelector('#module');
const task = document.querySelector('#task');
const options = document.querySelector('#task-options');
const progress = document.querySelector('#task-progress');
const next = document.querySelector('#next-step');
const undo = document.querySelector('#undo-step');
const report = document.querySelector('#task-report');

let attempt = [];
let evidence = [];
const activeModule = () => modules[moduleSelect.value];

function updateSelection() {
  options.querySelectorAll('button').forEach((button) => {
    button.setAttribute('aria-pressed', String(attempt.includes(button.dataset.card)));
  });
  progress.textContent = attempt.length
    ? '已選：' + attempt.map((id) => cards[id].label).join('、')
    : '請按順序點選兩張圖卡。';
  next.disabled = attempt.length !== 2;
  undo.disabled = attempt.length === 0;
}

function renderStep(moveFocus = false) {
  const stepNumber = evidence.length;
  const step = activeModule().steps[stepNumber];
  attempt = [];
  task.hidden = false;
  report.hidden = true;
  document.querySelector('#module-description').textContent = activeModule().description;
  document.querySelector('#task-step').textContent = `任務 ${stepNumber + 1}／2`;
  const heading = document.querySelector('#task-title');
  heading.textContent = step.label;
  document.querySelector('#task-prompt').textContent = step.prompt;
  next.textContent = stepNumber ? '查看本次結果' : '確認並繼續';
  options.replaceChildren();
  [...step.order].sort().forEach((id) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.card = id;
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = cards[id].symbol;
    if (id === 'triangle') {
      icon.className = 'yellow-triangle';
      icon.textContent = '▲';
    }
    button.append(icon, cards[id].label);
    button.addEventListener('click', () => {
      if (attempt.length === 2 || attempt.includes(id)) return;
      attempt.push(id);
      updateSelection();
    });
    options.append(button);
  });
  updateSelection();
  if (moveFocus) heading.focus();
}

function renderReport() {
  const list = document.querySelector('#report-evidence');
  list.replaceChildren();
  evidence.forEach(({ selection, matches }, index) => {
    const row = document.createElement('div');
    const label = document.createElement('dt');
    const value = document.createElement('dd');
    label.textContent = activeModule().steps[index].label;
    value.textContent = selection.map((id) => cards[id].label).join('、')
      + (matches ? '。順序符合指示。' : '。順序與指示不同。');
    row.append(label, value);
    list.append(row);
  });
  const [first, second] = evidence;
  document.querySelector('#report-summary').textContent = first.matches === second.matches
    ? '兩個任務的順序判讀相同。'
    : `本次在「${activeModule().steps[first.matches ? 0 : 1].label}」任務中，操作順序符合指示。`;
  task.hidden = true;
  report.hidden = false;
  document.querySelector('#task-report-title').focus();
}

next.addEventListener('click', () => {
  if (attempt.length !== 2) return;
  const step = activeModule().steps[evidence.length];
  evidence.push({ selection: attempt, matches: step.order.every((id, index) => id === attempt[index]) });
  if (evidence.length === activeModule().steps.length) {
    renderReport();
  } else {
    renderStep(true);
  }
});

undo.addEventListener('click', () => {
  attempt = [];
  updateSelection();
  options.querySelector('button').focus();
});

function resetDemo(moveFocus) {
  evidence = [];
  renderStep(moveFocus);
}

moduleSelect.addEventListener('change', () => resetDemo(false));
document.querySelector('#restart-demo').addEventListener('click', () => resetDemo(true));
renderStep();
