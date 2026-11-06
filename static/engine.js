(function createPalaceEngine() {
  'use strict';

  const stories = window.PALACE_STORIES;
  const config = window.PALACE_CONFIG;
  const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const migrationMessage = '新版新增五身份综合画像，需要开启完整一轮；已发现的结局已保留。';
  const recoveryMessage = '这轮进度无法完整读取，已从第一个身份重新开始；已发现的结局已保留。';

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
      version: config.saveVersion, unlocked: false, roleIndex: 0,
      storyRevision: stories[0].revision ?? 1, phase: 'home',
      answers: [], run: [], discovered: readDiscoveries(null), migrationNotice: ''
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
      history.push({title: node, answer: choice.text, letter: String.fromCharCode(65 + index), choiceIndex: index});
      node = choice.to;
    }
    const ending = has(role.endings, node) ? {
      ...role.endings[node], id: node, title: node,
      success: role.endings[node].status === '通关', recap: history.map(item => item.answer)
    } : null;
    if (!ending && !has(role.scenes, node)) throw new Error('这一幕暂时无法打开，请重新开始。');
    return {role, node, history, ending};
  }

  function copyRun(run) {
    return run.map(item => ({
      roleId: item.roleId, storyRevision: item.storyRevision,
      answers: [...item.answers], endingId: item.endingId
    }));
  }

  function cloneState(state) {
    return {...state, answers: [...state.answers], run: copyRun(state.run), discovered: readDiscoveries(state.discovered)};
  }

  function rememberEnding(discovered, roleId, endingId) {
    if (!discovered[roleId].includes(endingId)) discovered[roleId].push(endingId);
  }

  function newRound(state, notice = '') {
    return {...initialState(), unlocked: true, phase: 'intro',
      discovered: readDiscoveries(state.discovered), migrationNotice: notice};
  }

  // Completed histories are checked against the story, never reconstructed from
  // the collection, which may contain results from several unrelated rounds.
  function readRun(value) {
    if (!Array.isArray(value) || value.length > stories.length) throw new Error('Invalid round');
    return value.map((record, roleIndex) => {
      const role = stories[roleIndex];
      if (!record || typeof record !== 'object' || Array.isArray(record)
          || record.roleId !== role.id || record.storyRevision !== (role.revision ?? 1)) {
        throw new Error('Invalid identity');
      }
      const result = replay(roleIndex, record.answers);
      if (!result.ending || result.ending.id !== record.endingId) throw new Error('Invalid ending');
      return {roleId: role.id, storyRevision: role.revision ?? 1,
        answers: [...record.answers], endingId: result.ending.id};
    });
  }

  function restore(raw) {
    const recovered = initialState();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return recovered;
    recovered.discovered = readDiscoveries(raw.discovered);
    if (raw.unlocked !== true) return recovered;
    if (raw.version === 1 && config.saveVersion !== 1) return newRound(recovered, migrationMessage);
    if (raw.version !== config.saveVersion) return newRound(recovered, recoveryMessage);
    try {
      if (!Number.isInteger(raw.roleIndex) || raw.roleIndex < 0 || raw.roleIndex >= stories.length
          || !['intro', 'question', 'result', 'profile'].includes(raw.phase)
          || raw.storyRevision !== (stories[raw.roleIndex].revision ?? 1)) throw new Error('Invalid position');
      const run = readRun(raw.run);
      const isCompleted = ['result', 'profile'].includes(raw.phase);
      if (run.length !== raw.roleIndex + (isCompleted ? 1 : 0)) throw new Error('Missing identity');
      if (raw.phase === 'profile' && raw.roleIndex !== stories.length - 1) throw new Error('Early profile');
      const result = replay(raw.roleIndex, raw.answers);
      if (raw.phase === 'intro' && raw.answers.length !== 0) throw new Error('Invalid intro');
      if (isCompleted !== Boolean(result.ending)) throw new Error('Invalid phase');
      if (isCompleted) {
        const record = run[raw.roleIndex];
        if (record.endingId !== result.ending.id || record.answers.length !== raw.answers.length
            || record.answers.some((answer, index) => answer !== raw.answers[index])) {
          throw new Error('Conflicting history');
        }
      }
      const state = {
        ...recovered, unlocked: true, roleIndex: raw.roleIndex,
        storyRevision: stories[raw.roleIndex].revision ?? 1, phase: raw.phase,
        answers: [...raw.answers], run,
        migrationNotice: [migrationMessage, recoveryMessage].includes(raw.migrationNotice) ? raw.migrationNotice : ''
      };
      for (const record of run) rememberEnding(state.discovered, record.roleId, record.endingId);
      return state;
    } catch {
      return newRound(recovered, recoveryMessage);
    }
  }

  function requirePhase(state, allowed) {
    if (!state.unlocked || !allowed.includes(state.phase)) throw new Error('请从当前页面继续。');
  }

  function activate(state, code) {
    if (typeof code !== 'string' || code.trim() !== config.accessCode) throw new Error('验证码没对上，再看一眼数字。');
    // Re-entering a code resumes this round and never skips an identity.
    return state.unlocked ? cloneState(state) : newRound(state);
  }

  function nextRole(state) {
    requirePhase(state, ['result']);
    if (state.roleIndex >= stories.length - 1) throw new Error('五个身份已完成，请查看综合画像。');
    if (state.run.length !== state.roleIndex + 1) throw new Error('请先完成当前身份。');
    const roleIndex = state.roleIndex + 1;
    return {...cloneState(state), roleIndex, storyRevision: stories[roleIndex].revision ?? 1,
      phase: 'intro', answers: [], migrationNotice: ''};
  }

  function begin(state) {
    requirePhase(state, ['intro']);
    return {...cloneState(state), phase: 'question', answers: [], migrationNotice: ''};
  }

  function choose(state, choiceIndex) {
    requirePhase(state, ['question']);
    const answers = [...state.answers, choiceIndex];
    const result = replay(state.roleIndex, answers);
    const next = {...cloneState(state), answers, phase: result.ending ? 'result' : 'question', migrationNotice: ''};
    if (result.ending) {
      if (next.run.length !== state.roleIndex) throw new Error('这轮身份记录不完整，请重新打开页面。');
      next.run.push({roleId: result.role.id, storyRevision: result.role.revision ?? 1,
        answers: [...answers], endingId: result.ending.id});
      rememberEnding(next.discovered, result.role.id, result.ending.id);
    }
    return next;
  }

  function showProfile(state) {
    requirePhase(state, ['result']);
    if (state.roleIndex !== stories.length - 1 || state.run.length !== stories.length) {
      throw new Error('完成五个身份后，就能查看综合画像。');
    }
    readRun(state.run);
    return {...cloneState(state), phase: 'profile'};
  }

  function restart(state) {
    requirePhase(state, ['profile']);
    return newRound(state);
  }

  function retry(state) {
    return restart(state);
  }

  function getView(state) {
    const result = replay(state.roleIndex, state.answers);
    const scene = result.ending ? null : result.role.scenes[result.node];
    const records = readRun(state.run).map((record, index) => {
      const played = replay(index, record.answers);
      return {
        roleId: played.role.id, roleName: played.role.name, storyRevision: record.storyRevision,
        answers: [...record.answers], history: played.history, ending: played.ending
      };
    });
    return {
      phase: state.phase, role: result.role, index: state.answers.length,
      scene: scene ? {title: result.node, prompt: scene.text, options: scene.choices.map(choice => choice.text)} : null,
      history: result.history, ending: result.ending, migrationNotice: state.migrationNotice || '',
      journey: {
        roleNumber: state.roleIndex + 1, totalRoles: stories.length, completedCount: records.length,
        choicesCount: records.reduce((sum, record) => sum + record.answers.length, 0)
          + (['intro', 'question'].includes(state.phase) ? state.answers.length : 0),
        records
      },
      collection: stories.map(role => ({
        id: role.id, name: role.name, total: Object.keys(role.endings).length,
        endings: state.discovered[role.id].map(id => ({
          ...role.endings[id], id, title: id, success: role.endings[id].status === '通关'
        }))
      }))
    };
  }

  window.PalaceEngine = {
    initialState, restore, activate, nextRole, begin, choose, retry, showProfile, restart, getView
  };
})();
