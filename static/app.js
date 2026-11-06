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
    const entryLabel = state.unlocked ? '换个身份' : '进入故事';
    return `
      <div class="hero">
        <section class="hero-copy">
          <p class="eyebrow">宫廷互动故事</p>
          <h1 class="hero-title">来试试你在<br>宫斗剧中<br><em>能活过几集</em></h1>
          <p class="lede">皇帝的寿宴就要开席。有人把一件事托给你，接不接，由你自己拿主意。</p>
          <form class="entry-form" id="entry">
            <label for="entry-code">入宫验证码</label>
            <div class="code-row">
              <input id="entry-code" name="code" inputmode="numeric" maxlength="32"
                autocomplete="off" spellcheck="false" required placeholder="输入验证码"
                aria-describedby="entry-error">
              <button type="submit" class="primary">${entryLabel}<span aria-hidden="true"> →</span></button>
            </div>
            <p id="entry-error" class="form-error" role="alert" hidden></p>
            <p class="form-note">${state.unlocked ? '再次输入，会从下一个身份开始。' : '输入收到的验证码，开始你的第一场寿宴。'}</p>
          </form>
          ${state.unlocked ? button('继续故事 · ' + view.role.name, 'resume', 'secondary') : ''}
        </section>
        <div class="hero-art">
          <img src="./static/palace.svg" alt="朱红宫门前，石桥通向青瓦重檐的宫殿">
        </div>
      </div>
      <footer class="cover-foot">
        <span>五个身份，各有各的难处</span>
        <span>进度保存在当前浏览器</span>
      </footer>`;
  }

  function playTop(view, label) {
    return `<div class="play-top"><span class="eyebrow">${safe(label)}</span>
      ${view.history.length ? button('回看我的选择', 'history', 'link-button') : ''}</div>`;
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
          ${role.minimumChoices ? `<p class="form-note">这段故事至少有 ${safe(role.minimumChoices)} 次选择，进度会自动保存。</p>` : ''}
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
            ${button('重玩这个身份', 'retry')}
            ${button('换下一个身份', 'nextRole', 'secondary')}
          </div>
          ${button('查看已发现的结局', 'collection', 'link-button')}
        </article></div>`;
    }
    return gate(view);
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
    if (history) {
      content = `<ol class="history-list">${view.history.map((item, index) => `
        <li><p class="eyebrow">第 ${index + 1} 次选择</p>
          <h3>${safe(item.title)}</h3>
          <p class="selected-choice">${safe(item.letter)} · ${safe(item.answer)}</p>
        </li>`).join('')}</ol>`;
    } else {
      content = `<p class="muted">走过的结局会记在这里。换一个选项，也许就是另一条路。</p>
        <div class="ending-collection">${view.collection.map(role => `
          <section class="ending-entry">
            <h3>${safe(role.name)}</h3><p class="muted">已发现 ${role.endings.length}/${role.total} 个结局</p>
            ${role.endings.length ? `<ul>${role.endings.map(ending => `
              <li><span class="ending-status">${safe(ending.status)}</span>${safe(ending.title)}</li>
            `).join('')}</ul>` : '<p class="unplayed">还没走到这个身份的结局。</p>'}
          </section>`).join('')}</div>`;
    }
    drawer.innerHTML = `<div class="drawer-inner">
      <div class="drawer-head"><h2 id="drawer-title">${history ? '我做过的选择' : '我的结局'}</h2>
        <button type="button" class="close-button" aria-label="关闭" data-act="close">×</button>
      </div>${content}</div>`;
  }

  function showBook(page) {
    drawerPage = page;
    paintBook(engine.getView(state));
    if (!drawer.open) drawer.showModal();
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
        case 'retry': state = engine.retry(state); break;
        case 'nextRole': state = engine.nextRole(state); break;
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
    if (action === 'collection' || action === 'history') { showBook(action); return; }
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
