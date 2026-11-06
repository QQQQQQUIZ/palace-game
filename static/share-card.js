(function createShareCard() {
  'use strict';
  async function create(profile, records) {
    if (document.fonts?.ready) await document.fonts.ready;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    let ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    const serif = '"Noto Serif SC", "Songti SC", "SimSun", serif';
    const sans = '"Microsoft YaHei", "PingFang SC", sans-serif';
    const width = 896, left = 92, blocks = [];
    let y = 100;
    function add(value, size, color, weight, gap, family = sans, indent = 0) {
      ctx.font = weight + ' ' + size + 'px ' + family;
      let row = '';
      const lines = [];
      for (const char of String(value || '')) {
        if (char === '\n' || ctx.measureText(row + char).width > width - indent) {
          lines.push(row); row = char === '\n' ? '' : char;
        } else row += char;
      }
      if (row) lines.push(row);
      const leading = Math.ceil(size * 1.55);
      blocks.push({lines, y, size, color, weight, family, leading, indent});
      y += leading * lines.length + gap;
    }
    add('宫斗生存 · 我的本轮画像', 30, '#d4bf91', 500, 42);
    add(profile.type, 72, '#fff4d9', 700, 16, serif);
    add(profile.headline, 38, '#e7dfcb', 500, 38);
    add('你靠什么站稳', 29, '#c9b17e', 600, 6);
    add(profile.strength, 36, '#f3ecde', 400, 26);
    add('你最该留意的坑', 29, '#edb8a3', 600, 6);
    add(profile.pitfall, 36, '#f3ecde', 400, 42);
    add(profile.quote, 48, '#e8ca89', 700, 44, serif);
    add('五段故事 · 五个结局', 29, '#c9b17e', 600, 16);
    for (const record of records) {
      add(record.roleName + '  /  第 ' + record.ending.episode + ' 集', 30, '#f3ecde', 500, 0);
      add(record.ending.title, 29, '#bebfae', 400, 16, sans, 22);
    }
    add('基于本轮剧情选择的娱乐性解读，\n不是人格定论。集数不代表人格的好坏。', 26, '#b7b9a5', 400, 30);
    add('来试试你在宫斗剧中能活过几集', 30, '#d4bf91', 500, 0);
    canvas.height = Math.max(1440, Math.ceil(y + 80));
    ctx = canvas.getContext('2d');
    const background = ctx.createLinearGradient(0, 0, 1080, canvas.height);
    background.addColorStop(0, '#214e42');
    background.addColorStop(1, '#102c29');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#bba471';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, 1008, canvas.height - 72);
    ctx.strokeStyle = '#697e60';
    ctx.strokeRect(49, 49, 982, canvas.height - 98);
    ctx.textBaseline = 'top';
    for (const block of blocks) {
      ctx.font = block.weight + ' ' + block.size + 'px ' + block.family;
      ctx.fillStyle = block.color;
      block.lines.forEach((line, index) => ctx.fillText(line, left + block.indent, block.y + index * block.leading));
    }
    return canvas.toDataURL('image/png');
  }
  window.PalaceShare = {create};
})();

