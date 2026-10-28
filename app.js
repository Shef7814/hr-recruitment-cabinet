(() => {
  const STORE = 'kadroviy-kabinet-demo-v1';
  const stages = ['Новый', 'На рассмотрении', 'Интервью', 'Предложение', 'Нанят'];
  const stageClass = ['stage-new', 'stage-review', 'stage-interview', 'stage-offer', 'stage-hired'];
  const onboardingSteps = ['Документы получены', 'Договор подготовлен', 'Доступы настроены', 'Рабочее место готово', 'Встреча с командой'];
  const todayISO = new Date().toISOString().slice(0, 10);
  const seed = {
    contacts: { phone: '', email: '' },
    vacancies: [
      { id: 'v1', title: 'Дизайнер продукта', department: 'Продукт и дизайн', mode: 'Гибридный', status: 'Открыта' },
      { id: 'v2', title: 'Менеджер по работе с клиентами', department: 'Коммерческий отдел', mode: 'В офисе', status: 'Открыта' },
      { id: 'v3', title: 'Аналитик данных', department: 'Аналитика', mode: 'Удалённо', status: 'Открыта' },
    ],
    candidates: [
      { id: 'c1', name: 'Алина Примерова', email: 'alina@example.kz', phone: '+7 700 000 00 01', position: 'Дизайнер продукта', vacancyId: 'v1', experience: 4, notes: 'Портфолио и продуктовый опыт. Демонстрационная запись.', stage: 'Интервью', addedAt: '2026-10-27', interviewAt: '10:30', signer: 'Алина Примерова', signedAt: '2026-10-27', consent: true, signature: '', documents: ['Резюме_пример.pdf'] },
      { id: 'c2', name: 'Дамир Тестов', email: 'damir@example.kz', phone: '+7 700 000 00 02', position: 'Аналитик данных', vacancyId: 'v3', experience: 2, notes: 'Знаком с SQL и визуализацией данных. Демо.', stage: 'На рассмотрении', addedAt: '2026-10-26', signer: 'Дамир Тестов', signedAt: '2026-10-26', consent: true, signature: '', documents: [] },
      { id: 'c3', name: 'София Образцова', email: 'sofia@example.kz', phone: '+7 700 000 00 03', position: 'Менеджер по работе с клиентами', vacancyId: 'v2', experience: 3, notes: 'Опыт работы с клиентами. Демонстрационная запись.', stage: 'Новый', addedAt: '2026-10-25', signer: 'София Образцова', signedAt: '2026-10-25', consent: true, signature: '', documents: ['CV_demo.docx'] },
      { id: 'c4', name: 'Ерлан Макетов', email: 'erlan@example.kz', phone: '+7 700 000 00 04', position: 'Дизайнер продукта', vacancyId: 'v1', experience: 5, notes: 'Опыт работы в команде. Демо.', stage: 'Предложение', addedAt: '2026-10-24', signer: 'Ерлан Макетов', signedAt: '2026-10-24', consent: true, signature: '', documents: [] },
      { id: 'c5', name: 'Мира Учебная', email: 'mira@example.kz', phone: '+7 700 000 00 05', position: 'Аналитик данных', vacancyId: 'v3', experience: 1, notes: 'Учебный пример профиля.', stage: 'Нанят', addedAt: '2026-10-23', signer: 'Мира Учебная', signedAt: '2026-10-23', consent: true, signature: '', documents: [] },
    ],
    onboardings: [],
  };
  let data = loadData();
  let currentFiles = [];
  let editingId = null;
  let toastTimer;

  function loadData() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE));
      if (saved && Array.isArray(saved.candidates) && Array.isArray(saved.vacancies)) {
        return { ...seed, ...saved, contacts: { ...seed.contacts, ...saved.contacts }, onboardings: saved.onboardings || [] };
      }
    } catch (_) { /* Start with the safe demo records if storage is unavailable. */ }
    return structuredClone(seed);
  }
  function persist() {
    try { localStorage.setItem(STORE, JSON.stringify(data)); }
    catch (_) { showToast('Не удалось сохранить', 'Локальное хранилище заполнено.'); }
  }
  const byId = id => data.candidates.find(c => c.id === id);
  const vacancyById = id => data.vacancies.find(v => v.id === id);
  const initials = name => (name || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const formatDate = iso => { if (!iso) return 'Дата не указана'; const d = new Date(`${iso}T12:00:00`); return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(d); };
  const plural = (n, one, few, many) => n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many;

  function showToast(title, copy = 'Изменения сохранены') {
    const toast = document.getElementById('toast');
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-copy').textContent = copy;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }
  function openDialog(id) { document.getElementById(id).showModal(); }
  function closeDialog(id) { document.getElementById(id).close(); }
  function stageOptions(current = '') { return stages.map(s => `<option value="${s}" ${s === current ? 'selected' : ''}>${s}</option>`).join(''); }
  function stageBadge(stage, id) {
    const index = stages.indexOf(stage);
    return `<select class="stage-badge ${stageClass[index] || ''}" aria-label="Этап отбора" data-stage-id="${escapeHtml(id)}">${stageOptions(stage)}</select>`;
  }
  function renderCandidateCell(c) {
    return `<div class="candidate-cell"><span class="candidate-avatar">${escapeHtml(initials(c.name))}</span><span class="candidate-name"><button class="candidate-open" data-id="${escapeHtml(c.id)}"><b>${escapeHtml(c.name)}</b></button><small>Добавлен(а) ${formatDate(c.addedAt)}</small></span></div>`;
  }
  function rowHtml(c, compact = false) {
    const v = vacancyById(c.vacancyId);
    return `<tr><td>${renderCandidateCell(c)}</td><td>${escapeHtml(v?.title || c.position || 'Не указана')}</td><td>${Number(c.experience) || 0} ${plural(Number(c.experience) || 0, 'год', 'года', 'лет')}</td>${compact ? '' : `<td><span class="contact-mini">${escapeHtml(c.phone)}<br><span>${escapeHtml(c.email)}</span></span></td>`}<td>${stageBadge(c.stage, c.id)}</td><td><button class="row-menu candidate-more" data-id="${escapeHtml(c.id)}" aria-label="Открыть карточку">···</button></td></tr>`;
  }
  function renderDashboard() {
    document.getElementById('stat-candidates').textContent = data.candidates.length;
    document.getElementById('stat-vacancies').textContent = data.vacancies.filter(v => v.status !== 'Закрыта').length;
    document.getElementById('stat-interviews').textContent = data.candidates.filter(c => c.stage === 'Интервью').length;
    document.getElementById('stat-hired').textContent = data.candidates.filter(c => c.stage === 'Нанят').length + data.onboardings.length;
    document.getElementById('nav-candidates').textContent = data.candidates.length;
    document.getElementById('vacancy-foot').textContent = `${data.vacancies.length} ${plural(data.vacancies.length, 'позиция', 'позиции', 'позиций')} открыто`;
    const counts = stages.map(s => data.candidates.filter(c => c.stage === s).length);
    document.getElementById('pipeline').innerHTML = stages.map((s, i) => `<div class="pipeline-item"><span class="pipeline-label">${s}</span><span class="pipeline-number">${counts[i]}</span></div>`).join('');
    const max = Math.max(1, ...counts);
    document.getElementById('pipeline-bars').innerHTML = counts.map(n => `<span style="flex:${Math.max(1, n / max * 10)}"></span>`).join('');
    const interviews = data.candidates.filter(c => c.stage === 'Интервью').sort((a, b) => (a.interviewAt || '99:99').localeCompare(b.interviewAt || '99:99'));
    document.getElementById('interview-list').innerHTML = interviews.length ? interviews.slice(0, 3).map(c => `<div class="interview-row"><span class="interview-time">${escapeHtml(c.interviewAt || '—')}</span><span class="interview-avatar">${escapeHtml(initials(c.name))}</span><span class="interview-person"><b>${escapeHtml(c.name)}</b><small>${escapeHtml(vacancyById(c.vacancyId)?.title || c.position)}</small></span></div>`).join('') : '<div class="interview-empty">Пока нет кандидатов на этапе интервью.</div>';
    const recent = [...data.candidates].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 4);
    document.getElementById('recent-body').innerHTML = recent.length ? recent.map(c => rowHtml(c, true)).join('') : '<tr><td colspan="5" class="empty-state">Пока нет кандидатов. Добавьте первую карточку.</td></tr>';
  }
  function renderCandidates() {
    const q = document.getElementById('search-candidates').value.trim().toLowerCase();
    const vacancy = document.getElementById('filter-vacancy').value;
    const stage = document.getElementById('filter-stage').value;
    const exp = document.getElementById('filter-experience').value;
    const list = data.candidates.filter(c => {
      const haystack = `${c.name} ${c.position} ${c.email} ${c.phone} ${c.notes}`.toLowerCase();
      const years = Number(c.experience) || 0;
      return (!q || haystack.includes(q)) && (!vacancy || c.vacancyId === vacancy) && (!stage || c.stage === stage) && (!exp || (exp === '0' ? years < 1 : exp === '1' ? years >= 1 && years < 3 : years >= 3));
    });
    document.getElementById('candidates-body').innerHTML = list.length ? list.map(c => rowHtml(c)).join('') : '<tr><td colspan="6" class="empty-state">Не нашлось кандидатов по этим фильтрам.</td></tr>';
    document.getElementById('candidate-total').textContent = `${list.length} ${plural(list.length, 'кандидат', 'кандидата', 'кандидатов')}`;
  }
  function renderVacancies() {
    const container = document.getElementById('vacancy-grid');
    container.innerHTML = data.vacancies.length ? data.vacancies.map((v, i) => {
      const linked = data.candidates.filter(c => c.vacancyId === v.id);
      const colors = ['#edf4ef', '#f1eef9', '#fff2e6', '#eaf2f5'];
      return `<article class="vacancy-card"><div class="vacancy-top"><span class="vacancy-symbol" style="background:${colors[i % colors.length]}">✳</span><span class="open-pill">${escapeHtml(v.status || 'Открыта')}</span></div><h3>${escapeHtml(v.title)}</h3><span class="department">${escapeHtml(v.department || 'Команда')}</span><div class="vacancy-meta"><span>◷ ${escapeHtml(v.mode || 'Гибридный')}</span><span>⌖ Казахстан</span></div><div class="vacancy-bottom"><span class="vacancy-candidates"><b>${linked.length}</b> ${plural(linked.length, 'кандидат', 'кандидата', 'кандидатов')}</span><button class="vacancy-action" data-vacancy-filter="${escapeHtml(v.id)}">Кандидаты →</button></div></article>`;
    }).join('') : '<div class="panel empty-state">Вакансий пока нет. Добавьте первую открытую позицию.</div>';
  }
  function renderOnboarding() {
    document.getElementById('onboarded-list').innerHTML = data.onboardings.length ? [...data.onboardings].reverse().slice(0, 7).map(e => {
      const done = (e.steps || []).filter(Boolean).length;
      return `<article class="onboarded-card"><span class="candidate-avatar">${escapeHtml(initials(e.name))}</span><span class="onboarded-details"><b>${escapeHtml(e.name)}</b><small>${escapeHtml(e.position)} · выход ${formatDate(e.startDate)}</small><small>${done} из ${onboardingSteps.length} шагов выполнено</small><span class="progress-mini"><span style="width:${done / onboardingSteps.length * 100}%"></span></span></span></article>`;
    }).join('') : '<div class="empty-state">Здесь появятся новые сотрудники после заполнения формы.</div>';
  }
  function renderContact() {
    const phone = data.contacts.phone || '[телефон работодателя]';
    const email = data.contacts.email || '[почта работодателя]';
    document.getElementById('side-phone').textContent = phone;
    document.getElementById('side-email').textContent = email;
  }
  function populateSelects() {
    const priorFilterVacancy = document.getElementById('filter-vacancy').value;
    const priorStage = document.getElementById('filter-stage').value;
    const priorCandidateVacancy = document.getElementById('candidate-vacancy').value;
    const priorCandidateStage = document.getElementById('candidate-stage').value || 'Новый';
    const options = data.vacancies.map(v => `<option value="${escapeHtml(v.id)}">${escapeHtml(v.title)}</option>`).join('');
    document.getElementById('candidate-vacancy').innerHTML = `<option value="">Не выбрана</option>${options}`;
    document.getElementById('filter-vacancy').innerHTML = `<option value="">Все вакансии</option>${options}`;
    document.getElementById('candidate-stage').innerHTML = stageOptions(priorCandidateStage);
    document.getElementById('filter-stage').innerHTML = `<option value="">Все этапы</option>${stages.map(s => `<option value="${s}">${s}</option>`).join('')}`;
    if ([...document.getElementById('candidate-vacancy').options].some(o => o.value === priorCandidateVacancy)) document.getElementById('candidate-vacancy').value = priorCandidateVacancy;
    if ([...document.getElementById('filter-vacancy').options].some(o => o.value === priorFilterVacancy)) document.getElementById('filter-vacancy').value = priorFilterVacancy;
    if (stages.includes(priorStage)) document.getElementById('filter-stage').value = priorStage;
  }
  function renderChecklist() {
    document.getElementById('checklist-items').innerHTML = onboardingSteps.map((s, i) => `<label class="check-item"><input type="checkbox" data-check="${i}">${s}</label>`).join('');
    document.getElementById('checklist-count').textContent = `0 / ${onboardingSteps.length}`;
  }
  function renderAll() {
    populateSelects(); renderDashboard(); renderCandidates(); renderVacancies(); renderOnboarding(); renderContact();
  }

  const pages = {
    dashboard: ['Обзор', 'СРЕДА, В КОТОРОЙ ЛЮДИ РАСТУТ', 'Доброе утро, Анна', 'Вот что происходит в подборе сегодня.'],
    candidates: ['Кандидаты', 'ПОИСК СВОИХ ЛЮДЕЙ', 'База кандидатов', 'Все профили и этапы подбора в одном месте.'],
    vacancies: ['Вакансии', 'КОМАНДА РАСТЁТ', 'Открытые вакансии', 'Найдите подходящих людей на каждую роль.'],
    onboarding: ['Приём сотрудника', 'ПЕРВЫЙ ДЕНЬ — НАЧАЛО ПУТИ', 'Рады, что вы с нами', 'Подготовьте всё, чтобы новому коллеге было комфортно.'],
  };
  function navigate(page) {
    if (!pages[page]) return;
    document.querySelectorAll('.page-view').forEach(el => el.classList.toggle('visible', el.id === `page-${page}`));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
    const [crumb, eyebrow, title, subtitle] = pages[page];
    document.getElementById('crumb-current').textContent = crumb;
    document.getElementById('page-eyebrow').textContent = eyebrow;
    document.getElementById('page-title').innerHTML = page === 'dashboard' ? `${escapeHtml(title)} <span class="wave">✳</span>` : escapeHtml(title);
    document.getElementById('page-subtitle').textContent = subtitle;
    document.getElementById('add-candidate').style.display = page === 'onboarding' ? 'none' : '';
    document.getElementById('sidebar').classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function updateCandidateStage(id, stage) {
    const c = byId(id); if (!c) return;
    c.stage = stage; persist(); renderAll(); showToast('Этап обновлён', `${c.name}: ${stage}`);
  }

  const candidateDialog = document.getElementById('candidate-dialog');
  const candidateForm = document.getElementById('candidate-form');
  const canvas = document.getElementById('signature-pad');
  const ctx = canvas.getContext('2d');
  let drawing = false, hasSignature = false;
  function clearSignature() { ctx.clearRect(0, 0, canvas.width, canvas.height); hasSignature = false; }
  function showFiles() {
    document.getElementById('upload-count').textContent = `${currentFiles.length} ${plural(currentFiles.length, 'файл', 'файла', 'файлов')}`;
    document.getElementById('file-list').innerHTML = currentFiles.map((f, i) => `<li><span>▧ ${escapeHtml(f.name)} <small>(${(f.size / 1024).toFixed(0)} КБ)</small></span><button type="button" data-remove-file="${i}" aria-label="Удалить файл">×</button></li>`).join('');
  }
  function startCandidateEdit(candidate = null) {
    editingId = candidate?.id || null;
    candidateForm.reset(); currentFiles = (candidate?.documents || []).map(name => ({ name, size: 0, existing: true }));
    populateSelects(); clearSignature();
    candidateForm.elements.name.value = candidate?.name || '';
    candidateForm.elements.phone.value = candidate?.phone || '';
    candidateForm.elements.email.value = candidate?.email || '';
    candidateForm.elements.position.value = candidate?.position || '';
    candidateForm.elements.vacancy.value = candidate?.vacancyId || '';
    candidateForm.elements.experience.value = candidate?.experience ?? '';
    candidateForm.elements.stage.value = candidate?.stage || 'Новый';
    candidateForm.elements.notes.value = candidate?.notes || '';
    candidateForm.elements.signer.value = candidate?.signer || candidate?.name || '';
    candidateForm.elements.signedAt.value = candidate?.signedAt || todayISO;
    document.getElementById('consent-check').checked = Boolean(candidate?.consent);
    document.getElementById('consent-name-preview').textContent = candidate?.name || '[ФИО кандидата]';
    if (candidate?.signature) { const img = new Image(); img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); hasSignature = true; }; img.src = candidate.signature; }
    document.querySelector('#candidate-dialog .modal-head h2').textContent = candidate ? 'Карточка кандидата' : 'Добавить кандидата';
    document.querySelector('#candidate-dialog .modal-actions button[type="submit"]').innerHTML = candidate ? 'Сохранить изменения <span>→</span>' : 'Сохранить кандидата <span>→</span>';
    document.getElementById('workflow-controls').hidden = !candidate;
    document.getElementById('test-url').value = candidate?.portalInvite?.testUrl || '';
    document.getElementById('offer-salary').value = candidate?.offer?.salary || '';
    document.getElementById('offer-start-date').value = candidate?.offer?.startDate || '';
    document.getElementById('offer-message').value = candidate?.offer?.message || '';
    const link = candidate?.portalInvite ? portalUrl(candidate.portalInvite.token) : '';
    document.getElementById('portal-link').value = link;
    document.getElementById('copy-portal-link').disabled = !link;
    document.getElementById('email-portal-link').disabled = !link;
    renderWorkflowSummary(candidate);
    showFiles(); openDialog('candidate-dialog');
  }

  function portalUrl(token) {
    const url = new URL(location.href); url.hash = `portal=${encodeURIComponent(token)}`; return url.href;
  }
  function renderWorkflowSummary(candidate) {
    const status = document.getElementById('workflow-status');
    const submission = candidate?.portalSubmission;
    status.textContent = !candidate?.portalInvite ? 'Ссылка ещё не создана' : submission ? `Материалы получены · ${formatDate(submission.sentAt)}` : 'Ожидаем кандидата';
    const response = document.getElementById('offer-response');
    response.textContent = !candidate?.offer?.sentAt ? 'Оффер ещё не отправлен' : candidate.offer.response === 'accepted' ? 'Кандидат принял оффер' : candidate.offer.response === 'declined' ? 'Кандидат отказался от оффера' : `Оффер показан кандидату · ${formatDate(candidate.offer.sentAt)}`;
    document.getElementById('portal-submission-summary')?.remove();
    if (!submission) return;
    const block = document.createElement('div'); block.id = 'portal-submission-summary'; block.className = 'portal-submission-summary';
    const docs = (submission.documents || []).join(', ') || 'Не приложены';
    block.innerHTML = `<b>Ответ кандидата · ${escapeHtml(formatDate(submission.sentAt))}</b><span>Документы: ${escapeHtml(docs)}</span><span>Задание: ${escapeHtml(submission.testText || submission.testChoice || 'Без ответа')}</span><span>Опрос: ${escapeHtml(submission.survey?.motivation || 'Не заполнен')}</span>`;
    document.querySelector('.offer-editor').after(block);
  }

  function showCandidatePortal(token) {
    document.querySelector('.app-shell').hidden = true;
    const root = document.getElementById('candidate-portal'); root.hidden = false;
    const candidate = data.candidates.find(c => c.portalInvite?.token === token);
    if (!candidate) {
      root.innerHTML = '<div class="portal-not-found"><div class="portal-logo">К</div><span class="section-kicker">КАДРОВЫЙ КАБИНЕТ</span><h1>Ссылка недоступна</h1><p>Проверьте ссылку или попросите HR-специалиста отправить приглашение ещё раз.</p><div class="portal-demo-notice">Демо-ссылки доступны только в браузере, где создано приглашение.</div></div>';
      return;
    }
    const offer = candidate.offer?.sentAt ? candidate.offer : null;
    const testUrl = candidate.portalInvite.testUrl && /^https?:\/\//i.test(candidate.portalInvite.testUrl) ? candidate.portalInvite.testUrl : '';
    const submitted = candidate.portalSubmission;
    root.innerHTML = `<header class="portal-header"><a class="brand" href="${escapeHtml(location.pathname)}"><span class="brand-mark"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.8 28 10.7v10.6l-12 6.9-12-6.9V10.7l12-6.9Z"/><path d="M10 19.6v-7.2l6-3.5 6 3.5v7.2l-6 3.5-6-3.5Z"/></svg></span><span class="brand-copy"><b>кадровый</b><small>КАБИНЕТ HR</small></span></a><span class="portal-private">ПЕРСОНАЛЬНОЕ ПРИГЛАШЕНИЕ</span></header>
      <div class="portal-main"><section class="portal-welcome"><span class="section-kicker">ВАШ ПУТЬ В КОМАНДУ</span><h1>Здравствуйте, ${escapeHtml(candidate.name.split(' ')[0])} <span>✳</span></h1><p>Продолжим знакомство с вакансией <b>${escapeHtml(candidate.position)}</b>.</p><div class="portal-steps"><span class="done">01 <small>Тест</small></span><i></i><span class="done">02 <small>Документы</small></span><i></i><span class="done">03 <small>Опрос</small></span><i></i><span class="${offer ? 'done' : ''}">04 <small>Оффер</small></span></div></section>
      ${submitted ? `<div class="portal-submitted-banner"><b>✓ Ваши ответы уже получены</b><span>Вы можете обновить ответы и список документов ниже.</span></div>` : ''}
      <form id="portal-response-form" class="portal-form"><section class="portal-card"><div class="portal-card-heading"><span class="portal-step">01</span><div><span class="section-kicker">ВАШ ПОДХОД К ЗАДАЧАМ</span><h2>Короткое тестирование</h2></div><span class="portal-required">ОБЯЗАТЕЛЬНО</span></div>${testUrl ? `<a class="external-test" href="${escapeHtml(testUrl)}" target="_blank" rel="noopener noreferrer">Открыть внешнее тестирование <span>↗</span></a>` : ''}<label class="portal-label">Представьте, что сроки проекта сдвигаются, а у команды несколько срочных задач. Что вы сделаете сначала?<select name="testChoice" required><option value="">Выберите ответ</option><option>Уточню приоритеты и согласую план с командой</option><option>Сначала выполню задачу, которая занимает меньше времени</option><option>Буду работать над всеми задачами одновременно</option></select></label><label class="portal-label">Опишите, как вы подошли бы к рабочей задаче, в которой пока не хватает информации.<textarea name="testText" rows="3" required placeholder="Ваш ответ"></textarea></label><div class="portal-hint">Ответы передаются HR для ознакомления. Автоматическая оценка кандидата не выполняется.</div></section>
      <section class="portal-card"><div class="portal-card-heading"><span class="portal-step">02</span><div><span class="section-kicker">ВАШИ ФАЙЛЫ</span><h2>Приложите документы</h2></div></div><label class="portal-file-drop"><input name="documents" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"><span class="upload-symbol">↑</span><b>Выберите резюме или документы</b><small>PDF, DOC, DOCX, JPG или PNG · до 10 МБ на файл</small></label><ul class="portal-files" id="portal-files"></ul><div class="portal-hint">В демо сохраняются только имена файлов; содержимое никуда не загружается.</div></section>
      <section class="portal-card"><div class="portal-card-heading"><span class="portal-step">03</span><div><span class="section-kicker">НЕСКОЛЬКО ВОПРОСОВ</span><h2>Расскажите о себе</h2></div></div><label class="portal-label">Что для вас особенно важно в следующей работе?<textarea name="motivation" rows="2" required placeholder="Например: задачи, команда, развитие"></textarea></label><div class="portal-two-cols"><label class="portal-label">Предпочитаемый формат<select name="workMode" required><option value="">Выберите</option><option>В офисе</option><option>Гибридный</option><option>Удалённо</option></select></label><label class="portal-label">Ожидания по зарплате<input name="salaryExpectation" placeholder="Например, 400 000 ₸"></label></div><label class="portal-data-consent"><input type="checkbox" name="portalConsent" required><span>Подтверждаю, что отправляю эти материалы работодателю для рассмотрения моей кандидатуры.</span></label><button class="button button-dark portal-submit" type="submit">Отправить ответы HR-специалисту <span>→</span></button><div class="portal-hint">Обмен работает только в демо-браузере. Для реальной передачи нужен защищённый сервер.</div></section></form>
      ${offer ? `<section class="portal-card portal-offer-card"><div class="portal-card-heading"><span class="portal-step offer-step">04</span><div><span class="section-kicker">МЫ ХОТИМ РАБОТАТЬ С ВАМИ</span><h2>Предложение о работе</h2></div></div><p class="offer-greeting">${escapeHtml(offer.message || 'Будем рады видеть вас в команде!')}</p><div class="offer-details"><div><small>ПОЗИЦИЯ</small><b>${escapeHtml(candidate.position)}</b></div><div><small>ВОЗНАГРАЖДЕНИЕ</small><b>${escapeHtml(offer.salary || 'Обсудим отдельно')}</b></div><div><small>ПЛАНИРУЕМАЯ ДАТА ВЫХОДА</small><b>${escapeHtml(offer.startDate ? formatDate(offer.startDate) : 'По договорённости')}</b></div></div>${offer.response ? `<div class="offer-answered">${offer.response === 'accepted' ? '✓ Вы приняли предложение. HR свяжется с вами по дальнейшим шагам.' : 'Вы сообщили, что пока не готовы принять предложение.'}</div>` : `<div class="offer-actions"><button class="button button-dark" type="button" data-offer-response="accepted">Принять предложение <span>→</span></button><button class="button button-outline" type="button" data-offer-response="declined">Пока отказаться</button></div>`}</section>` : ''}
      <aside class="portal-demo-notice"><b>Демо-портал.</b> Ответы и имена файлов хранятся в локальном браузере. Они не передаются работодателю и не синхронизируются между устройствами. Не используйте реальные документы до подключения сервера и проверки правил обработки персональных данных.</aside></div><footer class="portal-footer">КАДРОВЫЙ КАБИНЕТ · ДЕМО-ПРОЕКТ</footer>`;

    const form = document.getElementById('portal-response-form');
    if (submitted) {
      form.elements.testChoice.value = submitted.testChoice || '';
      form.elements.testText.value = submitted.testText || '';
      form.elements.motivation.value = submitted.survey?.motivation || '';
      form.elements.workMode.value = submitted.survey?.workMode || '';
      form.elements.salaryExpectation.value = submitted.survey?.salaryExpectation || '';
      form.elements.portalConsent.checked = Boolean(submitted.consent);
      document.getElementById('portal-files').innerHTML = (submitted.documents || []).map(name => `<li>${escapeHtml(name)} <small>в демо-архиве</small></li>`).join('');
    }
    form.elements.documents.addEventListener('change', () => {
      const list = [...form.elements.documents.files].filter(file => {
        if (file.size > 10 * 1024 * 1024) { showToast('Файл слишком большой', `${file.name} превышает 10 МБ.`); return false; }
        return true;
      });
      document.getElementById('portal-files').innerHTML = list.map(file => `<li>${escapeHtml(file.name)} <small>${(file.size / 1024).toFixed(0)} КБ</small></li>`).join('');
    });
  }

  document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => navigate(button.dataset.page)));
  document.querySelectorAll('[data-goto]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.goto)));
  document.getElementById('add-candidate').addEventListener('click', () => startCandidateEdit());
  document.getElementById('edit-contacts').addEventListener('click', () => {
    const f = document.getElementById('contacts-form'); f.elements.phone.value = data.contacts.phone; f.elements.email.value = data.contacts.email; openDialog('contact-dialog');
  });
  document.getElementById('help-button').addEventListener('click', () => showToast('Демо-режим', 'Вся введённая информация хранится только в этом браузере.'));
  document.getElementById('mobile-menu').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeDialog(button.dataset.close)));
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); }));
  ['search-candidates', 'filter-vacancy', 'filter-stage', 'filter-experience'].forEach(id => document.getElementById(id).addEventListener(id === 'search-candidates' ? 'input' : 'change', renderCandidates));
  document.addEventListener('change', e => {
    if (e.target.matches('[data-stage-id]')) updateCandidateStage(e.target.dataset.stageId, e.target.value);
  });
  document.addEventListener('click', e => {
    const open = e.target.closest('.candidate-open,.candidate-more');
    if (open) { const c = byId(open.dataset.id); if (c) startCandidateEdit(c); }
    const vacancy = e.target.closest('[data-vacancy-filter]');
    if (vacancy) { navigate('candidates'); document.getElementById('filter-vacancy').value = vacancy.dataset.vacancyFilter; renderCandidates(); }
    const remove = e.target.closest('[data-remove-file]');
    if (remove) { currentFiles.splice(Number(remove.dataset.removeFile), 1); showFiles(); }
  });
  document.getElementById('candidate-form').elements.name.addEventListener('input', e => {
    document.getElementById('consent-name-preview').textContent = e.target.value.trim() || '[ФИО кандидата]';
    if (!editingId && !document.getElementById('candidate-form').elements.signer.value) document.getElementById('candidate-form').elements.signer.value = e.target.value;
  });
  document.getElementById('candidate-files').addEventListener('change', e => {
    const chosen = [...e.target.files];
    for (const file of chosen) {
      if (file.size > 10 * 1024 * 1024) { showToast('Файл слишком большой', `${file.name} превышает 10 МБ.`); continue; }
      if (!currentFiles.some(f => f.name === file.name)) currentFiles.push({ name: file.name, size: file.size });
    }
    e.target.value = ''; showFiles();
  });
  canvas.addEventListener('pointerdown', e => { drawing = true; canvas.setPointerCapture(e.pointerId); const r = canvas.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo((e.clientX-r.left)*canvas.width/r.width, (e.clientY-r.top)*canvas.height/r.height); });
  canvas.addEventListener('pointermove', e => { if (!drawing) return; const r = canvas.getBoundingClientRect(); ctx.lineWidth=2; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#345b40'; ctx.lineTo((e.clientX-r.left)*canvas.width/r.width, (e.clientY-r.top)*canvas.height/r.height); ctx.stroke(); hasSignature=true; });
  ['pointerup','pointercancel','pointerleave'].forEach(type => canvas.addEventListener(type, () => { drawing=false; }));
  document.getElementById('clear-signature').addEventListener('click', clearSignature);
  document.getElementById('contacts-form').addEventListener('submit', e => {
    e.preventDefault(); const f = e.currentTarget; data.contacts = { phone: f.elements.phone.value.trim(), email: f.elements.email.value.trim() }; persist(); renderContact(); closeDialog('contact-dialog'); showToast('Контакты сохранены', 'Данные работодателя обновлены.');
  });
  candidateForm.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.currentTarget;
    if (!document.getElementById('consent-check').checked) { showToast('Нужно получить согласие', 'Отметьте чекбокс согласия кандидата.'); document.getElementById('consent-check').focus(); return; }
    if (!hasSignature) { showToast('Нужна подпись', 'Попросите кандидата нарисовать подпись в поле.'); canvas.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (f.elements.signer.value.trim().length < 3) { showToast('Укажите ФИО подписанта', 'Заполните поле ФИО полностью.'); f.elements.signer.focus(); return; }
    const prior = editingId ? byId(editingId) : null;
    const candidate = {
      id: prior?.id || `c${Date.now()}`, name: f.elements.name.value.trim(), phone: f.elements.phone.value.trim(), email: f.elements.email.value.trim(), position: f.elements.position.value.trim(), vacancyId: f.elements.vacancy.value, experience: Number(f.elements.experience.value), stage: f.elements.stage.value, notes: f.elements.notes.value.trim(),
      addedAt: prior?.addedAt || todayISO, interviewAt: prior?.interviewAt || '', consent: true, signer: f.elements.signer.value.trim(), signedAt: f.elements.signedAt.value, signature: canvas.toDataURL('image/png'), documents: currentFiles.map(file => file.name),
    };
    if (prior) Object.assign(prior, candidate); else data.candidates.unshift(candidate);
    persist(); closeDialog('candidate-dialog'); renderAll(); showToast(prior ? 'Карточка обновлена' : 'Кандидат добавлен', `${candidate.name} сохранён(а) в демо-базу.`);
  });
  document.getElementById('create-portal-link').addEventListener('click', () => {
    const candidate = editingId && byId(editingId); if (!candidate) return;
    ensurePortalInvite(candidate); showToast('Персональная ссылка готова', 'Скопируйте её или подготовьте письмо кандидату.');
  });
  document.getElementById('copy-portal-link').addEventListener('click', async () => {
    const value = document.getElementById('portal-link').value; if (!value) return;
    try { await navigator.clipboard.writeText(value); showToast('Ссылка скопирована', 'Отправьте её кандидату удобным способом.'); }
    catch (_) { const input = document.getElementById('portal-link'); input.focus(); input.select(); showToast('Выделил ссылку', 'Скопируйте её сочетанием клавиш Ctrl+C.'); }
  });
  document.getElementById('email-portal-link').addEventListener('click', () => {
    const candidate = editingId && byId(editingId); if (!candidate) return;
    const link = document.getElementById('portal-link').value || ensurePortalInvite(candidate);
    const subject = `Следующий шаг по вакансии: ${candidate.position}`;
    const body = `Здравствуйте, ${candidate.name}!\n\nПриглашаем вас пройти короткое тестирование и опрос, а также приложить документы по ссылке:\n${link}\n\nС уважением, HR-команда`;
    location.href = `mailto:${encodeURIComponent(candidate.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
  document.getElementById('send-offer').addEventListener('click', () => {
    const candidate = editingId && byId(editingId); if (!candidate) return;
    const link = ensurePortalInvite(candidate);
    candidate.offer = { salary: document.getElementById('offer-salary').value.trim(), startDate: document.getElementById('offer-start-date').value, message: document.getElementById('offer-message').value.trim(), sentAt: todayISO, response: '' };
    if (candidate.stage !== 'Нанят') candidate.stage = 'Предложение';
    persist(); renderAll(); renderWorkflowSummary(candidate); showToast('Оффер подготовлен', 'Ссылка кандидата открывает предложение в демо-портале.');
    const subject = `Предложение о работе: ${candidate.position}`;
    const body = `Здравствуйте, ${candidate.name}!\n\nМы подготовили для вас предложение о работе. Подробности и ответ доступны по персональной ссылке:\n${link}`;
    location.href = `mailto:${encodeURIComponent(candidate.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
  document.getElementById('candidate-portal').onclick = e => {
    const button = e.target.closest('[data-offer-response]'); if (!button) return;
    const token = new URLSearchParams(location.hash.slice(1)).get('portal');
    const candidate = data.candidates.find(c => c.portalInvite?.token === token); if (!candidate?.offer) return;
    candidate.offer.response = button.dataset.offerResponse; candidate.offer.respondedAt = todayISO; persist(); showCandidatePortal(token);
  };
  document.getElementById('candidate-portal').addEventListener('submit', e => {
    if (!e.target.matches('#portal-response-form')) return;
    e.preventDefault(); const form = e.target;
    const token = new URLSearchParams(location.hash.slice(1)).get('portal');
    const candidate = data.candidates.find(c => c.portalInvite?.token === token); if (!candidate) return;
    candidate.portalSubmission = { sentAt: todayISO, documents: [...form.elements.documents.files].map(file => file.name).concat(candidate.portalSubmission?.documents || []), testChoice: form.elements.testChoice.value, testText: form.elements.testText.value.trim(), survey: { motivation: form.elements.motivation.value.trim(), workMode: form.elements.workMode.value, salaryExpectation: form.elements.salaryExpectation.value.trim() }, consent: true };
    candidate.portalSubmission.documents = [...new Set(candidate.portalSubmission.documents)];
    persist(); showCandidatePortal(token);
  });
  window.addEventListener('storage', e => {
    if (e.key !== STORE) return;
    data = loadData();
    const token = new URLSearchParams(location.hash.slice(1)).get('portal');
    if (token) showCandidatePortal(token);
    else { renderAll(); if (editingId) renderWorkflowSummary(byId(editingId)); }
  });

  document.getElementById('add-vacancy').addEventListener('click', () => openDialog('vacancy-dialog'));
  document.getElementById('vacancy-form').addEventListener('submit', e => {
    e.preventDefault(); const f = e.currentTarget;
    data.vacancies.push({ id: `v${Date.now()}`, title: f.elements.title.value.trim(), department: f.elements.department.value.trim() || 'Команда', mode: f.elements.mode.value, status: 'Открыта' });
    persist(); f.reset(); closeDialog('vacancy-dialog'); renderAll(); showToast('Вакансия добавлена', 'Она появилась в списке открытых позиций.');
  });
  document.getElementById('checklist-items').addEventListener('change', () => {
    const done = [...document.querySelectorAll('#checklist-items input:checked')].length;
    document.getElementById('checklist-count').textContent = `${done} / ${onboardingSteps.length}`;
  });
  document.getElementById('onboarding-form').addEventListener('submit', e => {
    e.preventDefault(); const f = e.currentTarget;
    const entry = { id: `o${Date.now()}`, name: f.elements.name.value.trim(), position: f.elements.position.value.trim(), startDate: f.elements.startDate.value, phone: f.elements.phone.value.trim(), email: f.elements.email.value.trim(), manager: f.elements.manager.value.trim(), steps: [...document.querySelectorAll('#checklist-items input')].map(x => x.checked), addedAt: todayISO };
    data.onboardings.push(entry); persist(); f.reset(); renderChecklist(); renderAll(); showToast('Карточка сотрудника создана', `${entry.name} добавлен(а) в план приёма.`);
  });

  document.getElementById('today').textContent = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
  const startDate = document.querySelector('#onboarding-form [name="startDate"]'); if (startDate) startDate.value = todayISO;
  const portalToken = new URLSearchParams(location.hash.slice(1)).get('portal');
  if (portalToken) showCandidatePortal(portalToken);
  else { renderChecklist(); renderAll(); navigate('dashboard'); }
})();
