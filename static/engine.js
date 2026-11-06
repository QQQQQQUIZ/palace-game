(function createPalaceEngine() {
  'use strict';

  const stories = window.PALACE_STORIES;
  const config = window.PALACE_CONFIG;
  const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

  function readDiscoveries(value) {
    const discovered = {};
    for (const story of stories) {
      const saved = value && value[story.id];
      discovered[story.id] = Array.isArray(saved)
        ? [...new Set(saved.filter(id => typeof id === 'string' && has(story.endings, id)))]
        : [];
    }
    return discovered;
  }

  function initialState() {
    return {
      version: config.saveVersion,
      unlocked: false,
      roleIndex: 0,
      storyRevision: stories[0].revision ?? 1,
      phase: 'home',
      answers: [],
      discovered: readDiscoveries(null)
    };
  }

  function replay(roleIndex, answers) {
    const role = stories[roleIndex];
    if (!role || !Array.isArray(answers) || answers.length > Object.keys(role.scenes).length) {
      throw new Error('这段记录无法继续，请重新开始。');
    }
    let node = role.entry;
    const history = [];
    for (const index of answers) {
      const scene = has(role.scenes, node) && role.scenes[node];
      if (!scene || !Number.isInteger(index) || index < 0 || index >= scene.choices.length) {
        throw new Error('请选择这一幕列出的选项。');
      }
      const choice = scene.choices[index];
      history.push({title: node, answer: choice.text, letter: String.fromCharCode(65 + index)});
      node = choice.to;
    }
    const ending = has(role.endings, node) ? {
      ...role.endings[node],
      id: node,
      title: node,
      success: role.endings[node].status === '通关',
      recap: history.map(item => item.answer)
    } : null;
    if (!ending && !has(role.scenes, node)) {
      throw new Error('这一幕暂时无法打开，请重新开始。');
    }
    return {role, node, history, ending};
  }

  function rememberEnding(state, ending) {
    const roleId = stories[state.roleIndex].id;
    const found = state.discovered[roleId];
    if (!found.includes(ending.id)) found.push(ending.id);
  }

  function restore(raw) {
    const recovered = initialState();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return recovered;
    recovered.discovered = readDiscoveries(raw.discovered);
    if (raw.version !== config.saveVersion || raw.unlocked !== true
        || !Number.isInteger(raw.roleIndex) || raw.roleIndex < 0 || raw.roleIndex >= stories.length
        || !['intro', 'question', 'result'].includes(raw.phase)) return recovered;
    const storyRevision = stories[raw.roleIndex].revision ?? 1;
    const savedRevision = raw.storyRevision ?? 1;
    if (!Number.isInteger(savedRevision) || savedRevision < 1) return recovered;
    // Choices from an older story may point somewhere different after an edit.
    if (savedRevision !== storyRevision) return startRole(recovered, raw.roleIndex);
    try {
      const result = replay(raw.roleIndex, raw.answers);
      if (raw.phase === 'intro' && raw.answers.length !== 0) return recovered;
      if ((raw.phase === 'result') !== Boolean(result.ending)) return recovered;
      const state = {
        ...recovered,
        unlocked: true,
        roleIndex: raw.roleIndex,
        storyRevision,
        phase: raw.phase,
        answers: [...raw.answers]
      };
      if (result.ending) rememberEnding(state, result.ending);
      return state;
    } catch {
      return recovered;
    }
  }

  function requirePhase(state, allowed) {
    if (!state.unlocked || !allowed.includes(state.phase)) {
      throw new Error('请从当前页面继续。');
    }
  }

  function startRole(state, roleIndex) {
    return {
      ...initialState(),
      unlocked: true,
      roleIndex,
      storyRevision: stories[roleIndex].revision ?? 1,
      phase: 'intro',
      discovered: readDiscoveries(state.discovered)
    };
  }

  function activate(state, code) {
    if (typeof code !== 'string' || code.trim() !== config.accessCode) {
      throw new Error('验证码没对上，再看一眼数字。');
    }
    return startRole(state, state.unlocked ? (state.roleIndex + 1) % stories.length : 0);
  }

  function nextRole(state) {
    requirePhase(state, ['intro', 'question', 'result']);
    return startRole(state, (state.roleIndex + 1) % stories.length);
  }

  function begin(state) {
    requirePhase(state, ['intro']);
    return {...state, phase: 'question', answers: [], discovered: readDiscoveries(state.discovered)};
  }

  function choose(state, choiceIndex) {
    requirePhase(state, ['question']);
    const answers = [...state.answers, choiceIndex];
    const result = replay(state.roleIndex, answers);
    const next = {
      ...state,
      answers,
      phase: result.ending ? 'result' : 'question',
      discovered: readDiscoveries(state.discovered)
    };
    if (result.ending) rememberEnding(next, result.ending);
    return next;
  }

  function retry(state) {
    requirePhase(state, ['result']);
    return startRole(state, state.roleIndex);
  }

  function getView(state) {
    const result = replay(state.roleIndex, state.answers);
    const scene = result.ending ? null : result.role.scenes[result.node];
    return {
      phase: state.phase,
      role: result.role,
      index: state.answers.length,
      scene: scene ? {
        title: result.node,
        prompt: scene.text,
        options: scene.choices.map(choice => choice.text)
      } : null,
      history: result.history,
      ending: result.ending,
      collection: stories.map(role => ({
        id: role.id,
        name: role.name,
        total: Object.keys(role.endings).length,
        endings: state.discovered[role.id].map(id => ({
          ...role.endings[id], id, title: id, success: role.endings[id].status === '通关'
        }))
      }))
    };
  }

  window.PalaceEngine = {initialState, restore, activate, nextRole, begin, choose, retry, getView};
})();
