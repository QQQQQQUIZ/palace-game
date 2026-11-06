(function playPalace() {
  'use strict';

  const app = document.getElementById('app');
  const drawer = document.getElementById('drawer');
  const count = document.getElementById('book-count');
  const notice = document.getElementById('notice');
  const storageNote = document.getElementById('storage-note');
  const engine = window.PalaceEngine;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const sitePath = new URL('./', window.location.href).pathname;
  const saveKey = 'palace.static.v1:' + sitePath;
  let storageAvailable = true;
  let noticeTimer;
  let drawerPage = '';
  let busy = false;
  let shareImage = '';
  let exporting = false;

  if (!engine) {
    app.innerHTML = '<section class="play-shell"><h1>故事文件还没加载好</h1><p>请刷新页面重试。</p></section>';
    return;
  }

  function safe(value) {
    const replacements = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
    return String(value ?? '').replace(/[&<>"']/g, character => replacements[character]);
  }

  function paragraphs(value) {
    return String(value ?? '').trim().split(/\n+/).filter(Boolean)
      .map(line => `<p>${safe(line)}</p>`).join('');
  }

  function button(label, action, kind = 'primary') {
    return `<button type="button" class="${kind}" data-act="${action}">${safe(label)}</button>`;
  }

  function say(message) {
    clearTimeout(noticeTimer);
    notice.textContent = message;
    notice.classList.add('show');
    noticeTimer = setTimeout(() => notice.classList.remove('show'), 4600);
  }

  function useMemoryOnly() {
    storageAvailable = false;
    storageNote.textContent = '浏览器暂时无法保存进度，请留着此页继续玩。';
    storageNote.hidden = false;
  }

  function readRecord() {
    if (!storageAvailable) return null;
    let raw;
    try {
      raw = window.localStorage.getItem(saveKey);
    } catch {
      useMemoryOnly();
      return null;
    }
    if (!raw) return null;
    try {
      const record = JSON.parse(raw);
      if (!record || typeof record.revision !== 'string' || !record.game) {
        throw new Error('Invalid saved record');
      }
      // Keep the original record when upgrading an older five-role collection.
      if (record.game.version === 1) {
        try {
          if (!window.localStorage.getItem(saveKey + ':before-profile')) {
            window.localStorage.setItem(saveKey + ':before-profile', raw);
          }
        } catch { /* A backup must not prevent the current game from opening. */ }
      }
      return {revision: record.revision, game: engine.restore(record.game)};
    } catch {
      say('这份进度无法读取，可以重新开始。');
      return null;
    }
  }

  const initial = readRecord();
  let state = initial ? initial.game : engine.initialState();
  let revision = initial ? initial.revision : '';
  let atGate = !state.unlocked;

  function save() {
    revision = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    if (!storageAvailable) return;
    try {
      window.localStorage.setItem(saveKey, JSON.stringify({revision, game: state}));
    } catch {
      useMemoryOnly();
    }
  }

  function closeBook() {
    drawerPage = '';
    if (drawer.open) drawer.close();
  }

  function focusStory() {
    app.focus({preventScroll: true});
    window.scrollTo({top: 0, behavior: 'instant'});
  }

  function gate(view) {
    return `
      <div class="hero">
        <section class="hero-copy">
          <p class="eyebrow">宫廷互动故事</p>
          <h1 class="hero-title">来试试你在<br>宫斗剧中<br><em>能活过几集</em></h1>
          <p class="lede">走过五种宫廷身份，看看面对利益、人情和压力，你习惯怎么选，又容易在哪一步吃亏。</p>
          <p class="journey-promise">五段故事，每段 12 次选择。完成后，领取有选择依据的综合生存画像。可以随时暂停，下次回来继续。</p>
          ${state.unlocked ? `<div class="entry-form resume-box"><p class="form-note">${view.phase === 'profile' ? '这一轮的画像已经写好。' : `你已走到第 ${view.journey.roleNumber} / ${view.journey.totalRoles} 个身份，进度已保留。`}</p>${button(view.phase === 'profile' ? '查看我的画像 →' : '继续故事 · ' + view.role.name, 'resume')}</div>` : `<form class="entry-form" id="entry">
            <label for="entry-code">入宫验证码</label>
            <div class="code-row">
              <input id="entry-code" name="code" inputmode="numeric" maxlength="32"
                autocomplete="off" spellcheck="false" required placeholder="输入验证码"
                aria-describedby="entry-error">
              <button type="submit" class="primary">进入故事<span aria-hidden="true"> →</span></button>
            </div>
            <p id="entry-error" class="form-error" role="alert" hidden></p>
            <p class="form-note">输入收到的验证码，开始这一轮五段故事。</p>
          </form>`}
        </section>
        <div class="hero-art">
          <img src="./static/palace.svg" alt="朱红宫门前，石桥通向青瓦重檐的宫殿">
        </div>
      </div>
      <footer class="cover-foot">
        <span>五段经历，一份属于这轮选择的画像</span>
        <span>进度保存在当前浏览器</span>
      </footer>`;
  }

  function playTop(view, label) {
    const journey = view.journey;
    return `<div class="journey-meta"><span>第 ${journey.roleNumber} / ${journey.totalRoles} 个身份</span><span>本轮已完成 ${journey.completedCount} 段</span></div>
      <div class="journey-track" aria-hidden="true">${Array.from({length: journey.totalRoles}, (_, index) => `<i class="${index < journey.completedCount ? 'done' : index === journey.roleNumber - 1 ? 'current' : ''}"></i>`).join('')}</div>
      <div class="play-top"><span class="eyebrow">${safe(label)}</span>
      ${view.history.length ? button('回看我的选择', 'history', 'link-button') : ''}</div>
      ${view.migrationNotice ? `<p class="migration-note" role="status">${safe(view.migrationNotice)}</p>` : ''}`;
  }

  function story(view) {
    const role = view.role;
    if (view.phase === 'intro') {
      return `<div class="play-shell">${playTop(view, '寿宴故事')}
        <section class="story-card intro-card">
          <div class="role-seal" aria-hidden="true">宫</div>
          <p class="eyebrow">这次你的身份是 · ${safe(role.name)}</p>
          <h1 class="scene-title">${safe(role.title)}</h1>
          <div class="scene-copy">${paragraphs(role.intro)}</div>
          ${role.minimumChoices ? `<p class="form-note">这段故事有 ${safe(role.minimumChoices)} 次选择。按你此刻的想法选，不必猜哪一个才算通关。</p>` : ''}
          <div class="actions">${button('进入剧情 →', 'begin')}</div>
        </section></div>`;
    }
    if (view.phase === 'question') {
      return `<div class="play-shell">${playTop(view, `${role.name} · 第 ${view.index + 1} 次选择`)}
        <article class="story-card">
          <h1 class="scene-title">${safe(view.scene.title)}</h1>
          <div class="scene-copy">${paragraphs(view.scene.prompt)}</div>
          <div class="choice-list" role="group" aria-label="你怎么做">
            ${view.scene.options.map((option, index) => `
              <button type="button" class="choice" data-act="answer" data-choice="${index}">
                <span class="letter">${letters[index]}</span><span>${safe(option)}</span>
              </button>`).join('')}
          </div>
        </article></div>`;
    }
    if (view.phase === 'result') {
      const ending = view.ending;
      return `<div class="play-shell">${playTop(view, role.name + ' · 我的结局')}
        <article class="story-card result-card">
          <p class="episode-big">你演到了第 <strong>${safe(ending.episode)}</strong> 集</p>
          <h1 class="result-title">${safe(ending.title)}</h1>
          <p class="episode">${safe(ending.status)}结局</p>
          <div class="scene-copy">${paragraphs(ending.text)}</div>
          <details class="recap"><summary>回看这次的选择</summary>
            <ol>${view.history.map(item => `<li>${safe(item.answer)}</li>`).join('')}</ol>
          </details>
          <div class="actions">
            ${view.journey.completedCount === view.journey.totalRoles ? button('查看我的生存画像 →', 'showProfile') : button('进入下一个身份 →', 'nextRole')}
          </div>
          <p class="form-note">${view.journey.completedCount === view.journey.totalRoles ? '五段经历已齐。接下来看看这些选择有什么共同点。' : `这段选择已记入本轮。再完成 ${view.journey.totalRoles - view.journey.completedCount} 个身份，就能查看综合画像。`}</p>
          ${button('查看已发现的结局', 'collection', 'link-button')}
        </article></div>`;
    }
    if (view.phase === 'profile') return profilePage(view);
    return gate(view);
  }

  function profilePage(view) {
    const report = window.PalaceProfile.build(view.journey.records);
    const contrastEvidence = report.evidence.find(item => report.contrast && report.contrast.includes(item.reading));
    return `<div class="profile-shell" id="profile-report">
      <section class="profile-hero">
        <p class="eyebrow">五段经历 · ${view.journey.choicesCount} 次选择 · 本轮生存画像</p>
        <p class="profile-kicker">这一轮，你更像</p>
        <h1>${safe(report.type)}</h1>
        <p class="profile-headline">${safe(report.headline)}</p>
        <div class="profile-pair"><p><b>你靠什么站稳</b>${safe(report.strength)}</p><p><b>你最该留意的坑</b>${safe(report.pitfall)}</p></div>
        <p class="scope-note">${safe(report.scopeNote)}</p>
      </section>
      <section class="profile-section">
        <h2><span>01</span> 为什么这样说</h2>
        <ul class="profile-traits">${report.traits.slice(0, 3).map(trait => `<li><b>${safe(trait.title)}</b><span>${safe(trait.text)}</span></li>`).join('')}</ul>
        <ol class="profile-evidence">${report.evidence.slice(0, 3).map(item => `<li><p class="evidence-source">${item === contrastEvidence ? (report.contrast.startsWith('需要') ? '需要单独留意 · ' : '另一个侧面 · ') : ''}${safe(item.roleName)} · ${safe(item.scene)}</p><blockquote>你选了：${safe(item.answer)}</blockquote><p>${safe(item.reading)}</p></li>`).join('')}</ol>
        ${report.contrast && !contrastEvidence ? `<p class="profile-contrast">${safe(report.contrast)}</p>` : ''}
      </section>
      <section class="profile-section">
        <h2><span>02</span> 放到现实里看</h2>
        <p class="reality-scene">${safe(report.reality.scene)}</p>
        <dl class="reality-list"><dt>优势</dt><dd>${safe(report.reality.advantage)}</dd><dt>风险</dt><dd>${safe(report.reality.risk)}</dd></dl>
        <p class="profile-strategy"><b>你的宫中生存策略</b>${safe(report.strategy)}</p>
      </section>
      <section class="profile-section">
        <h2><span>03</span> 下次可以练这三件事</h2>
        <ol class="profile-advice">${report.advice.slice(0, 3).map(item => `<li><h3>${safe(item.title)}</h3><p>${safe(item.action)}</p></li>`).join('')}</ol>
      </section>
      <section class="profile-share" aria-label="可截图的画像金句">
        <p class="eyebrow">把这一句留给自己</p>
        <p class="share-type">${safe(report.type)}</p>
        <blockquote>${safe(report.quote)}</blockquote>
        ${button('保存我的画像卡片', 'saveCard')}
        <p class="form-note">卡片包含本轮判断与五个结局，可保存或长按图片。</p>
      </section>
      <div class="profile-footer"><div class="actions">${button('回看本轮五段结局', 'round', 'secondary')}${button('再玩一轮', 'restart')}</div>
        <p class="form-note">再玩一轮会从第一个身份开始，生成新的画像；已发现的结局继续保留。</p></div>
    </div>`;
  }

  function render() {
    const view = engine.getView(state);
    const found = view.collection.reduce((total, role) => total + role.endings.length, 0);
    const total = view.collection.reduce((sum, role) => sum + role.total, 0);
    count.textContent = found ? ` ${found}/${total}` : '';
    app.innerHTML = atGate || !state.unlocked ? gate(view) : story(view);
    if (drawerPage) paintBook(view);
  }

  function paintBook(view) {
    const history = drawerPage === 'history';
    let content;
    let title = history ? '我做过的选择' : '我的结局';
    drawer.classList.toggle('image-drawer', drawerPage === 'share');
    if (drawerPage === 'share') {
      title = '我的画像卡片';
      content = `<p class="muted">可以长按图片保存，也可以下载到设备。</p><img class="share-image" src="${shareImage}" alt="本轮宫斗生存画像：类型、优势、风险、金句与五个结局"><a class="primary image-download" href="${shareImage}" download="我的宫斗生存画像.png">下载图片</a>`;
    } else if (drawerPage === 'round') {
      title = '这一轮，走过的五段故事';
      const notes = view.journey.records.length === view.journey.totalRoles ? window.PalaceProfile.build(view.journey.records).endingNotes : [];
      content = `<p class="muted">只记录本轮经历。集数代表剧情走向，不代表人格的好坏。</p>${view.journey.records.map(record => `<section class="round-ending"><p class="eyebrow">${safe(record.roleName)} · 第 ${safe(record.ending.episode)} 集 · ${safe(record.ending.status)}</p><h3>${safe(record.ending.title)}</h3><div class="scene-copy">${paragraphs(record.ending.text)}</div>${notes.find(note => note.roleId === record.roleId) ? `<p class="profile-strategy"><b>这一段，值得回想的地方</b>${safe(notes.find(note => note.roleId === record.roleId).reading)}</p>` : ''}<details class="recap"><summary>展开这段的 ${record.history.length} 次选择</summary><ol>${record.history.map(item => `<li>${safe(item.answer)}</li>`).join('')}</ol></details></section>`).join('')}`;
    } else if (history) {
      content = `<ol class="history-list">${view.history.map((item, index) => `
        <li><p class="eyebrow">第 ${index + 1} 次选择</p>
          <h3>${safe(item.title)}</h3>
          <p class="selected-choice">${safe(item.letter)} · ${safe(item.answer)}</p>
        </li>`).join('')}</ol>`;
    } else {
      content = `<p class="muted">这里保留所有轮次发现的结局。综合画像只使用当前一轮的选择。</p>
        <div class="ending-collection">${view.collection.map(role => `
          <section class="ending-entry">
            <h3>${safe(role.name)}</h3><p class="muted">已发现 ${role.endings.length}/${role.total} 个结局</p>
            ${role.endings.length ? `<ul>${role.endings.map(ending => `
              <li><span class="ending-status">${safe(ending.status)}</span>${safe(ending.title)}</li>
            `).join('')}</ul>` : '<p class="unplayed">还没走到这个身份的结局。</p>'}
          </section>`).join('')}</div>`;
    }
    drawer.innerHTML = `<div class="drawer-inner">
      <div class="drawer-head"><h2 id="drawer-title">${title}</h2>
        <button type="button" class="close-button" aria-label="关闭" data-act="close">×</button>
      </div>${content}</div>`;
  }

  function showBook(page) {
    drawerPage = page;
    paintBook(engine.getView(state));
    if (!drawer.open) drawer.showModal();
  }

  async function saveCard() {
    if (exporting || state.phase !== 'profile') return;
    exporting = true;
    const exportButton = app.querySelector('[data-act="saveCard"]');
    if (exportButton) { exportButton.disabled = true; exportButton.textContent = '正在制作卡片…'; }
    try {
      const view = engine.getView(state);
      const report = window.PalaceProfile.build(view.journey.records);
      const exportRevision = revision;
      const image = await window.PalaceShare.create(report, view.journey.records);
      if (state.phase === 'profile' && revision === exportRevision) {
        shareImage = image;
        showBook('share');
      }
    } catch {
      say('卡片暂时没有生成，可以先截图保存页面，再试一次。');
    } finally {
      exporting = false;
      if (exportButton?.isConnected) { exportButton.disabled = false; exportButton.textContent = '保存我的画像卡片'; }
    }
  }

  function setBusy(value) {
    busy = value;
    app.setAttribute('aria-busy', String(value));
    app.querySelectorAll('button, input').forEach(control => { control.disabled = value; });
  }

  function adopt(record) {
    state = record ? record.game : engine.initialState();
    revision = record ? record.revision : '';
    atGate = atGate || !state.unlocked;
    closeBook();
    render();
  }

  async function change(action, value) {
    if (busy) return;
    setBusy(true);
    const perform = () => {
      // Check again inside the lock so an old tab cannot answer a newer scene.
      const current = readRecord();
      if (storageAvailable && (current?.revision || '') !== revision) {
        adopt(current);
        say('另一个页面更新了进度，请从现在的位置继续。');
        return;
      }
      switch (action) {
        case 'activate': state = engine.activate(state, value); break;
        case 'begin': state = engine.begin(state); break;
        case 'answer': state = engine.choose(state, value); break;
        case 'nextRole': state = engine.nextRole(state); break;
        case 'showProfile': state = engine.showProfile(state); break;
        case 'restart': state = engine.restart(state); shareImage = ''; break;
        default: return;
      }
      save();
      atGate = false;
      closeBook();
      render();
      focusStory();
    };
    try {
      if (storageAvailable && navigator.locks && window.location.protocol !== 'file:') {
        let enteredLock = false;
        try {
          await navigator.locks.request(saveKey, () => {
            enteredLock = true;
            perform();
          });
        } catch (error) {
          if (enteredLock) throw error;
          perform();
        }
      } else {
        perform();
      }
    } catch (error) {
      const entryError = document.getElementById('entry-error');
      if (action === 'activate' && entryError) {
        entryError.textContent = error.message;
        entryError.hidden = false;
        document.getElementById('entry-code').setAttribute('aria-invalid', 'true');
      } else {
        say(error.message || '这一步没能完成，请再试一次。');
      }
    } finally {
      setBusy(false);
    }
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('[data-act]');
    if (!target || !target.isConnected) return;
    event.preventDefault();
    const action = target.dataset.act;
    if (action === 'close') { closeBook(); return; }
    if (action === 'collection' || action === 'history' || action === 'round') { showBook(action); return; }
    if (action === 'saveCard') { void saveCard(); return; }
    if (busy) return;
    if (action === 'home' || action === 'resume') {
      closeBook();
      atGate = action === 'home';
      render();
      focusStory();
      return;
    }
    if (event.detail > 1) return;
    void change(action, Number(target.dataset.choice));
  });

  document.addEventListener('submit', event => {
    if (event.target.id !== 'entry') return;
    event.preventDefault();
    const input = document.getElementById('entry-code');
    const code = input.value.trim();
    if (!code) { input.focus(); return; }
    void change('activate', code);
  });

  drawer.addEventListener('close', () => { drawerPage = ''; });
  drawer.addEventListener('click', event => {
    if (event.target !== drawer) return;
    const bounds = drawer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) closeBook();
  });

  function syncSavedGame() {
    if (!storageAvailable || busy) return;
    const current = readRecord();
    if (!storageAvailable) return;
    if ((current?.revision || '') !== revision) adopt(current);
  }
  window.addEventListener('storage', event => {
    if (event.key === saveKey || event.key === null) syncSavedGame();
  });
  window.addEventListener('pageshow', syncSavedGame);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) syncSavedGame();
  });

  render();
})();
