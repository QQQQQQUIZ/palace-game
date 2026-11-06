(function createPalaceProfile() {
  'use strict';
  const stories = window.PALACE_STORIES;
  const has = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

  // Interpret observable choices, never award personality points for surviving.
  const templates = {
    fact: {
      type: '核实型拆局者',
      headline: '这轮，你几次把话拉回了自己见过的事实。',
      strength: '别人急着给事情定性时，你会补上经过，分开亲见、转述和猜测。',
      pitfall: '事实说清了，后续责任却未必分清；你可能成为大家反复来问的那个人。',
      strategy: '继续把事实讲清，同时说明谁来核实、谁来决定，以及你负责到哪一步。',
      traits: [{title:'把具体情况说出来',text:'面对需要解释的事，你在几个节点选择了说明经过或保留可以核对的材料。'},{title:'不只沿用现成说法',text:'你的选择把注意力带回具体发生过什么，让笼统的说法有了核对的机会。'}],
      reality: {scene:'团队汇报与共同做事',advantage:'整理争议时，你能帮助大家分清已确认的事和各自的说法。',risk:'如果每次都由你查清、转述、追进度，求证很容易变成你一个人的额外工作。'},
      advice: [{title:'把话分成两句',action:'下次汇报先说“我确认到的是……”，再说“还需要由谁确认……”。'},{title:'问清下一步',action:'解释完一件争议，补问“接下来谁来处理，我需要配合到哪一步？”'},{title:'留下简短回顾',action:'重要讨论后用三句话写下已确认事项、未确认事项和各自负责人。'}],
      quote: '把事实说清，也把责任说清。'
    },
    boundary: {
      type: '守界型行动者',
      headline: '这轮，你多次把决定交回该决定的人手里。',
      strength: '你愿意经手事情，但会分清“我来办”和“我替你保证”之间的距离。',
      pitfall: '边界如果只在自己心里，别人仍可能把你的配合当成整件事都由你负责。',
      strategy: '说清能做的部分，也说清不能代答的部分，并把交接落到具体人。',
      traits: [{title:'帮忙有范围',text:'你把自己经手的部分与别人的决定分开，不把所有问题都接过来。'},{title:'把回答交回去',text:'在这些节点，你让有关的人自己说明或决定，减少了代答的部分。'}],
      reality: {scene:'工作分工与朋友请托',advantage:'合作中你比较容易讲清权限，不必替每一个人的决定背书。',risk:'只说“不归我”却不说明交给谁，容易让别人误以为你不愿配合。'},
      advice: [{title:'给拒绝一个去向',action:'试一句“这一段我可以做；那部分需要找谁确认，我可以把你们拉到一起”。'},{title:'接事前定范围',action:'接下一项任务前，确认交付内容、决定人和出现变化时找谁。'},{title:'说明自己的贡献',action:'完成协助后简短说清“我已完成什么，剩下由谁接手”，别只默默退出。'}],
      quote: '可以帮忙，不必替别人做主。'
    },
    ownership: {
      type: '主动型争取者',
      headline: '这轮，你在几个机会面前，让自己的意愿出了声。',
      strength: '你不只等别人分配位置，也会亲自上前、说明自己想做什么。',
      pitfall: '露面和拿到决定权是两回事；机会给了你，安排和评价仍可能握在别人手里。',
      strategy: '争取机会时一并问清目标、权限和评价，避免只拿到一个忙碌的位置。',
      traits: [{title:'把意愿说出来',text:'你选择了亲自参与，让自己的名字和这件事产生联系。'},{title:'愿意走到人前',text:'需要有人出面时，你至少几次没有把机会全交给旁人。'}],
      reality: {scene:'争取项目与团队展示',advantage:'别人较容易知道你想承担什么，你也更有机会让成果被看见。',risk:'如果只答应“我来”，容易得到曝光和额外工作，却没有相应的支持。'},
      advice: [{title:'先说一个明确目标',action:'下次争取任务时说清“我想负责哪一段，准备交出什么结果”。'},{title:'核对能决定什么',action:'接手前问“这件事哪些部分我能定，哪些要先找你确认？”'},{title:'主动约一次反馈',action:'任务中途约一个短反馈，确认你的投入确实对准了被评价的目标。'}],
      quote: '争取一个位置，也要争取说清它的权利。'
    },
    craft: {
      type: '手艺型经营者',
      headline: '这轮，你几次把位置落在了能亲手做好的事情上。',
      strength: '局面复杂时，你仍能找到具体工作，把自己的作用做出来。',
      pitfall: '一直靠“我会做”立足，容易变成谁有难活都找你，却没人主动替你分担。',
      strategy: '保留手艺的分量，同时让分工、交付和自己的时间被看见。',
      traits: [{title:'先抓住具体工作',text:'你把注意力放回熬粥、裁衣、管理衣样一类可以落地的任务。'},{title:'愿意经营一处位置',text:'你选择继续接手一项具体工作，让接下来的责任有了落点。'}],
      reality: {scene:'团队里的专业岗位',advantage:'你能拿出实际结果，合作伙伴知道遇到具体问题可以找你。',risk:'如果不提出容量和回报，熟练可能变成默认多做，长期发展反而被挤掉。'},
      advice: [{title:'列出本周容量',action:'新增任务来时，把正在做的两三件事说清，再请对方确定优先顺序。'},{title:'给成果留署名',action:'完成工作时记录自己解决了什么问题，汇报具体结果而不只说“都弄好了”。'},{title:'留一个成长位置',action:'每周挑一小段时间练新技能，别让全部时间都被别人最熟悉的旧需求占满。'}],
      quote: '让人知道你有用，也让人知道你的时间有数。'
    },
    bridge: {
      type: '关系型协调者',
      headline: '这轮，你几次把机会或说话的位置留给了关系中的另一方。',
      strength: '你会陪着别人把话说完、分出机会，尽量不把一次分歧变成彻底翻脸。',
      pitfall: '协调得太熟练，别人可能习惯等你传话、劝说，连该自己开的口也交给你。',
      strategy: '搭桥可以，答应什么、承担什么，最后仍由当事人亲口确认。',
      traits: [{title:'给别人参与的位置',text:'你在几个节点把发言、露脸或参与的机会留给了旁人。'},{title:'继续把关系接下去',text:'你的选择让合作或相处还有下一步，没有只处理自己手里的一件事。'}],
      reality: {scene:'朋友矛盾与团队合作',advantage:'你能帮助卡住的对话继续，又不必让一方完全退出。',risk:'如果你总是替两边解释，最后双方记住的是你的承诺，而不是他们自己的话。'},
      advice: [{title:'把最后一句交回去',action:'陪朋友说明情况时，收尾问本人“你想怎么安排，亲口和对方确认一下？”'},{title:'少转述一层',action:'两边反复托你传话时，约一次三方沟通，避免由你长期翻译彼此的意思。'},{title:'提前说帮助的限度',action:'试一句“我可以陪你去，但怎么决定和答应什么，需要你自己说”。'}],
      quote: '能替人搭桥，不必替人走完。'
    },
    accommodate: {
      type: '兜底型执行者',
      headline: '这轮，你几次先接住了安排，让眼前的事继续下去。',
      strength: '你愿意补位、跑动或承接难处，场面卡住时不容易袖手旁观。',
      pitfall: '接下工作不等于认下整件事；你有把别人的安排一并背到自己身上的风险。',
      strategy: '开口接事之前，先拆开自己要做的动作和别人应当承担的决定。',
      traits: [{title:'先让事情继续',text:'你做过顺着安排推进、替人接话或认下责任的选择。'},{title:'自己也付出了位置',text:'这些安排里，你的时间、解释空间或原本想做的事可能被挤到后面。'}],
      reality: {scene:'临时加活与人情请求',advantage:'你能在短时间内稳住进度，别人会感受到你的配合。',risk:'别人未必区分你是在帮忙，还是已经同意全权负责；沉默也不会替你划线。'},
      advice: [{title:'先停一拍再答应',action:'遇到临时请求，先问“你具体需要我做哪一步？”再决定接多少。'},{title:'接动作，不包结论',action:'试一句“我可以整理和转交，但最终方案需要由你确认”。'},{title:'把自己的事排进去',action:'答应帮忙时同时说明原有任务与可用时间，避免只剩别人的优先级。'}],
      quote: '别把一句“我来帮忙”，活成所有人的默认安排。'
    },
    borrow: {
      type: '借势型应答者',
      headline: '这轮，你几次用别人的权威，替眼前的回答撑了场。',
      strength: '你注意到了场上的权力关系，也知道哪一种说法更容易被听进去。',
      pitfall: '把别人的暗示说成明确吩咐，或把没见过的事说成亲见，追问时就只剩你作证。',
      strategy: '在被催着表态时，把事实、转述、推测分开；缺少的授权要向本人确认。',
      traits: [{title:'回答里借用了权威',text:'你在不同身份下，把一位上位者放到了自己说法的背后。'},{title:'说法超过了所知',text:'至少几次，你答出的确定程度超过了自己亲耳听见或亲眼见到的范围。'}],
      reality: {scene:'替领导传话与跨团队承诺',advantage:'你能留意谁有决定权，不会只埋头看自己手上的一小段。',risk:'“他应该同意”一旦被你说成“他已经同意”，别人追究承诺时会先找到你。'},
      advice: [{title:'换掉过满的词',action:'把“他已经答应”改成“我听到的是……，最终还需要他确认”。'},{title:'不替缺席的人保证',action:'涉及期限、资源或责任时，请决定人直接确认，不用自己的名字填空。'},{title:'预备一句缓冲话',action:'被催回答时说“这点我不能替他确认，我现在去问清楚再回复”。'}],
      quote: '最该收住的，是替别人说满的那句话。'
    },
    private: {
      type: '私下型周旋者',
      headline: '这轮，你几次把关键处置放到了私下交接里。',
      strength: '你会寻找局面还有哪些处理办法，不只等着眼前的一条安排。',
      pitfall: '私下的方便可能留下公开解释不清的缺口；材料一转手，谁动过什么就很难核对。',
      strategy: '有争议的材料和承诺，尽量完整交接、让相关人在场，不只靠口头照应。',
      traits: [{title:'另找一条处理路',text:'你在几个节点没有沿公开流程处理，而选择了另一次交接。'},{title:'关键动作由自己经手',text:'你亲自处置了争议材料，后续就可能需要解释材料为何改变位置或状态。'}],
      reality: {scene:'文件、钱物与有争议的交接',advantage:'你愿意处理卡住的问题，也会主动寻找具体办法。',risk:'只留下自己的一段说法，却让完整材料离开视线，容易说不清事情前后。'},
      advice: [{title:'先别拆开完整材料',action:'遇到需要核查的文件或物品，先确认谁负责接收，再决定是否分拆。'},{title:'让交接有人同看',action:'请相关人一起确认交出的内容、状态和接收者，不只私下口头答应。'},{title:'把好意与授权分开',action:'有人说“我担着”时，仍问清他能决定什么，以及这件事还需要谁知情。'}],
      quote: '别让一次私下的方便，留下只有你能解释的缺口。'
    },
    mixed: {
      type: '因势应对型',
      headline: '这轮，你会随处境调整做法，尚未形成跨身份的一种固定策略。',
      strength: '你没有把每个角色都当成同一场局，愿意在不同处境里换一种处理办法。',
      pitfall: '变化本身不是问题；需要留意的是，改变做法时有没有连自己的底线也一起改掉。',
      strategy: '从本轮的不同做法里挑一条愿意坚持的原则，再给特殊情况写清例外。',
      traits: [{title:'处境变了，做法也变',text:'关键选择没有在多个身份里集中到同一种应对方式。'},{title:'先看具体那一步',text:'比起一个固定标签，这轮更值得对照的是下面几次有差别的选择。'}],
      reality: {scene:'面对不同同事与朋友',advantage:'你可以调整沟通方式，不必对每个人都用同一套反应。',risk:'如果每次只随当下请求改变主意，别人会替你定义什么时候该让步。'},
      advice: [{title:'选一条不变的原则',action:'例如“没确认的话不替人保证”，下一次遇到不同对象时都试着做到。'},{title:'记一次改变的原因',action:'当你临时改主意，写下是新信息让你改变，还是对方的催促让你松口。'},{title:'对照两次选择',action:'从下方挑两次不同做法，想想现实里什么条件会让你选另一边。'}],
      quote: '可以因人换说法，别让底线也跟着换。'
    }
  };

  // Ending readings describe context, not a score or a causal personality diagnosis.
  const endings = {
    1: {
      '差一指': ['accommodate','你照着安排故意投偏，把下一步留给皇帝来教。','你换来了照顾，也把相处的节奏交给了贵妃安排。需要留意，舒服的位置不一定留得下自己的主意。'],
      '欠了两年的簪子': ['bridge','你接下旧箭，替贵妃把她和皇帝的旧约重新提了起来。','你帮一段关系接上了话，也逐渐坐到了记分的位置。能促成别人相处，并不自动保留你的参与空间。'],
      '那碟虾': ['ownership','你没有继续照着投偏的安排走，而是提出按自己的准头比一回。','你明确说出了自己想怎么参与。被看见的不只是听话，也是你自己的兴趣和本领。'],
      '朝南的窗': ['boundary','你只报告已经本人确认的住处，没有替另一位朋友答应搬家。','你把未定的决定留给了本人。往后别人把你看作谁的代言人，仍需要由你说明清楚。'],
      '棋还下不下': ['bridge','你让朋友亲口说明住处，并把搬家与继续下棋分开谈。','你陪朋友把话说开，却没有代替她借皇帝的名头。搭桥之后，当事人仍能自己维持关系。'],
      '皇上说了几句话': ['borrow','你把皇帝没说过的同住安排，说成了他的意思。','这里的问题落在那句超出原话的保证，而不是帮朋友本身。替别人借权威说话，会把核实的责任带到自己身上。']
    },
    2: {
      '像，尤其是肚皮': ['fact','你补全了两只鸭子的来历，也说清自己为什么请师傅换回皇后那只。','你没有藏起摔碗的经过，也没有漏掉自己换回鸭子的那一步。认下做错的部分，不必连做对的部分也一起隐去。'],
      '那一声是我': ['bridge','你把上前厅的机会或回话的位置留给小宫女。','她得到了露脸的机会，你减少了前厅的问话。这样的交换是否合适，取决于你是否也保留了想要的机会。'],
      '洗不掉的一角': ['bridge','你给小宫女留了继续相处的机会，同时处理了被踩脏的裙子。','你们还能合作，但那枚鞋印没有因此消失。继续相处不等于必须假装那次伤害从未发生。'],
      '第二回过门槛': ['boundary','你重新领取或分开了两人的差事，把下一步各做什么落到了实处。','你把精力放回自己能安排的工作。边界需要在下一次合作里继续说清，不能只靠别人记住这一次。'],
      '原样奉还': ['fact','你把换鸭的经过说出来，没有替师傅补上没有亲见的动机。','你能说明他做过什么，却没有替他说他为什么做。事实和对动机的解释，在这里被分开了。'],
      '这锅交给你': ['craft','你留在大灶接住了熬粥的工作，把回话留给相关的人。','你得到了自己的灶口。具体本领给了你一个位置，也要留意以后是否什么难活都默认由你留下收尾。'],
      '茶凉了': ['fact','面对贵妃的追问，你仍只说师傅自己换了鸭子。','你没有为了捧茶的位置改变亲眼所见。没得到这次机会，不代表那句如实回答没有价值。'],
      '走出宫门': ['borrow','你说换鸭是皇后的意思，尽管自己没有听到这道吩咐。','追问落到谁说过、谁在场时，你缺少依据。需要修正的是这次超出所知的断言，而不是把整个自己判成不聪明。']
    },
    3: {
      '水动了一下': ['fact','你交代取样经过，并没有把未看清的纸上内容说成亲见。','你把乌龙发生的过程还原出来，别人才能核对材料。说明事实比事后替自己编出先见之明更有分量。'],
      '水纹留下了': ['accommodate','你先认下改衣的责任，没有把取图过程完整说开。','衣服留下了，误解也留下了。主动承担自己的动作，与认下整个事情的缘由，需要分开说。'],
      '两条尾巴': ['craft','你接下管理衣样的工作，把位置落到了裁衣案边。','靠窗的位置和管图的责任一起到手。新的位置也需要相应的规则，否则容易只增加守着别人东西的工作。'],
      '四条腿都算数': ['craft','你选择做一件真正合身的狗衣，把手艺用在具体需要上。','你把衣服能不能穿、能不能跑放在了花样前面。明确解决一个需要，也能让别人记住你的本事。'],
      '冬衣的袖口': ['fact','你保住原图并叫回小太监，让人和材料一起留在现场。','你留下了能核对的证据，之后却遭到贵妃刁难。刁难是对方的行为；能讨论的是如何争取支持，而不是责怪你揭露了她。'],
      '月门外的手': ['private','你把待查的原图交回拿图的人，自己经手了这次私下交接。','无论对方拿旧话还是好处来说情，你最后都把原图递了出去。这一结局不能直接判断你贪利或怕冲突。']
    },
    4: {
      '走在皇帝前头': ['ownership','皇帝没有点名时，你亲自提灯跟了上去。','你接住了一次露脸的机会。往后能不能把机会变成自己的本领和分工，还需要继续经营。'],
      '库里还有一只': ['bridge','你把提灯跟随的机会交给同伴，自己留下帮师傅。','分出去的机会换来了一段合作，但不是每次付出都会自动换来回报。保留自己的意愿同样重要。'],
      '两样东西分开交': ['fact','你拿出钥匙，说明灯钱怎样转去买了总管的宅子。','你选择揭露亲见的贪腐，随后遭人毒害。加害的责任不在你；现实中遇到权力报复风险，应同时考虑可信的支持与保护。'],
      '那晚谁在梯子上': ['borrow','你按总管的说法指认师傅，替没亲眼见过的收灯作了证。','总管的承诺没有替你承担说假话的责任。需要留意的是，利益许诺不能代替事实依据。'],
      '第二把梯子': ['boundary','你推回腰牌，明确拒绝为没见过的收灯作证。','你放弃了外差的钱，留下修灯。这个取舍体现了一次边界选择，不意味着所有揭露问题的人都选错了路。']
    },
    5: {
      '这趟差事轮不到我': ['boundary','你让开方的师父随行，自己放下见习机会，留宫接手药房。','你把需要解释用药的人请到现场，也接受了暂时失去机会的代价。守住范围不等于永远不再争取成长。'],
      '蜜饯还我两颗': ['accommodate','你保留随行见习的机会，也接下继续送药传话的工作。','你去成了行宫，也继续在两边跑动。机会和额外负担同时存在，值得确认的是这份投入究竟换到了多少学习。'],
      '娘娘还要问你一句': ['fact','你在原方和整箱药都在场时，说明师父另外添包的动作。','你说出了具体见闻，之后成为贵妃反复叫来查看的人。被信任也可能带来超出职责的持续要求。'],
      '不用你送了': ['boundary','你交代原封送药的过程，把药效和方子留给开方的人解释。','你没有替药效背书，却失去了原来的见习位置。失去机会不等于边界无用，接下来仍需寻找新的学习渠道。'],
      '你袖里的那一包': ['private','你私留一包药，把余下十四包交回师父，随后离开。','你有意帮忙查药，但完整材料离开了视线。后来无法说明余下药的变化，留下了被栽赃的缺口；栽赃仍是加害者的选择。']
    }
  };

  const rules = [];
  function add(roleId, scene, choiceIndex, key, reading, priority = 2) {
    const role = stories.find(item => item.id === roleId);
    const option = role?.scenes[scene]?.choices[choiceIndex];
    if (!option || !templates[key]) throw new Error('画像规则没有对应的剧情选项：' + scene);
    rules.push({roleId, scene, choiceIndex, answer: option.text, key, reading, priority});
  }
  for (const role of stories) {
    for (const [scene, data] of Object.entries(role.scenes)) {
      data.choices.forEach((option, choiceIndex) => {
        const note = endings[role.id]?.[option.to];
        if (note) add(role.id, scene, choiceIndex, note[0], note[1], ['borrow','private'].includes(note[0]) ? 7 : 5);
      });
    }
  }
  // Distinguish the two requests which happen to lead to the same ending.
  for (const rule of rules) {
    if (rule.roleId === 3 && rule.scene === '月门后伸来的手' && rule.choiceIndex === 1)
      rule.reading = '她拿你先前说过的话来求情，你随后把待查原图交回了她手里。';
    if (rule.roleId === 3 && rule.scene === '脚边那张红鱼图' && rule.choiceIndex === 1)
      rule.reading = '她许诺以后留好料子，你随后把待查原图交回她手里；这说明交接发生了，不能单凭它断言你的动机。';
  }
  [
    [1,'还没开席，先问住处',0,'bridge','你先提出老宫女夜里走路的不便，把同行人的需要放进安排里。'],
    [1,'先投一支给她看',1,'ownership','你把壶挪回原处，选择练自己的准头。'],
    [1,'椅子朝着哪边摆',1,'ownership','你没有只接下投偏的安排，而是说明想先试自己的准头。'],
    [1,'地上留着两圈水印',0,'ownership','你选定自己能投稳的距离，给自己的发挥留了位置。'],
    [1,'先数清那几粒豆子',1,'ownership','你把旧箭还回去，说出自己也想投完一轮。'],
    [1,'留一点给明天学',0,'accommodate','你把箭筒交出去，站位和练法都交给贵妃安排。'],
    [1,'旧箭先交到谁手里',0,'bridge','你答应替贵妃提起旧约，承担起两人之间开口的那一步。'],
    [1,'窗台还留着白天的暖',1,'bridge','你陪朋友回话，却让住处由她自己向皇后说明。'],
    [1,'只约了明日下棋',0,'fact','你先核对贵妃到底约了什么，没有直接把下棋当成答应搬家。'],
    [1,'一间屋先定下来',0,'boundary','你只报告一个人已经点头，没有把其他人也算进去。'],
    [1,'先把棋盒抱稳',0,'fact','你先弄清贵妃的原话，准备不用皇帝的名头来解决。'],
    [1,'屏风边只说了一半',0,'bridge','你让朋友一起出面，搬家的心意由本人开口。'],
    [1,'屏风边只说了一半',1,'accommodate','你先替朋友去解释，把她自己的表达暂时接到了手里。'],

    [2,'两只鸭子',0,'fact','你追问盒里留下的鸭子怎么收，先补上物品来历的信息。'],
    [2,'谁捧第二碗',0,'bridge','你把送汤的机会交给小宫女，自己留着照看盒子。'],
    [2,'谁捧第二碗',1,'ownership','你亲自送第二碗汤，把留守的工作交代给她。'],
    [2,'她先洗了手',0,'bridge','你让她去送第二碗，自己留守，重新分配了两个人的事。'],
    [2,'她先洗了手',1,'ownership','你接过托盘自己送，明确让她留下收拾碎瓷。'],
    [2,'谁先来收盒',0,'boundary','有人来要盒子时，你先等原本负责接收的姑姑到场。'],
    [2,'她抢先报了喜',0,'fact','你接过回话的位置，按亲眼所见补全经过。'],
    [2,'她抢先报了喜',1,'accommodate','你让她继续回话，自己退回去处理灶上的收尾。'],
    [2,'洗盆的人',0,'boundary','你问清她调差事后是否留下两份灶给你，不先默认接下。'],
    [2,'给她留一条路',1,'boundary','你没有只收下示好，先说清以后过门槛的规矩。'],
    [2,'自己去还盒',0,'fact','你把两碗汤分开说明，没有让换过的东西混成一个说法。'],
    [2,'代还的条件',0,'boundary','你只愿说明看见的动作，把替谁着想交给师傅本人解释。'],
    [2,'代还的条件',1,'craft','你请师傅亲自回话，自己接下看锅的工作。'],
    [2,'新师傅的第一句话',1,'craft','你没有急着跟着新师傅走，先把手里这一锅顾好。'],
    [2,'贵妃要听哪句',1,'fact','你分开了亲眼看见的挑鸭，与并不知道的娘娘喜好。'],
    [2,'贵妃放下茶盖',1,'fact','你请另一方也进来听，减少只有自己转述的部分。'],

    [3,'那尾鱼是谁绣的',0,'bridge','你把同桌一起带进去，让她亲口说明自己的针法。'],
    [3,'篮里那张青水纹',1,'fact','拿到与印象不同的样子时，你停下剪子，先去问师傅。'],
    [3,'落在肩上的线',0,'bridge','你让做水纹的人一起去送衣，让她自己的手艺被听见。'],
    [3,'落在肩上的线',1,'ownership','你选择自己送衣并回话，把现场展示接到了自己手里。'],
    [3,'针眼里的浪',0,'bridge','你请同桌同行，让参与针脚的人都能自己说明。'],
    [3,'针眼里的浪',1,'ownership','你选择亲自送衣，把向前厅说明的机会接在自己手里。'],
    [3,'姑姑留你一会儿',0,'fact','你请师傅和同桌一起回话，让各自经手的部分能当面核对。'],
    [3,'姑姑留你一会儿',1,'fact','你带衣裳和衣样回去，请管事对着材料核对。'],
    [3,'窗口的两张凳子',1,'boundary','你先请师傅把她借走的图找回，再谈接下管图的职责。'],
    [3,'匣盖还没扣上',0,'boundary','你只认自己知道图还回过，其余让借图的人自己解释。'],
    [3,'匣盖还没扣上',1,'boundary','你把需要解释的事直接交回管事，没有私下代答。'],
    [3,'她在门边等你',0,'boundary','你只答应说亲自知道的部分，没有替她补借图的理由。'],
    [3,'她在门边等你',1,'boundary','你让她直接找管事解释，没有接下替她说情的任务。'],

    [4,'留在园子的人',0,'fact','你先核对收条写了哪些灯，准备按实际内容交差。'],
    [4,'账房只带银票',0,'fact','你先查三万两具体买了哪些灯，没有把付款和收货混为一谈。'],
    [4,'铜镜照着柜台',0,'boundary','你把另送信的任务交回掌柜安排，自己回去完成原本的事。'],
    [4,'包好的灯不往灯楼去',0,'boundary','你没有一并接下总管的私信，先回去帮同伴修灯。'],
    [4,'一只动了两只都动',0,'ownership','你接过灯跟上，选择自己走到前面。'],
    [4,'一只动了两只都动',1,'bridge','你让同伴提灯上前，自己和师傅留下补位。'],
    [4,'那块补丁朝着谁',0,'ownership','你亲自提灯上前，把工具留给同伴。'],
    [4,'那块补丁朝着谁',1,'bridge','你替同伴擦好灯柄，留出让他上前的机会。'],
    [4,'收条上写的是新灯',0,'fact','你从正门交付款差事，让账上的内容进入公开核对。'],
    [4,'茶杯旁多了一块腰牌',1,'boundary','你先说清自己想留在灯楼，不接这份外差。'],
    [4,'那一趟只够一个人扛',0,'fact','你陪送货的人等官员，把见证人留在核对过程里。'],
    [4,'这杯茶可以不喝',0,'boundary','你先与师傅当面定下回灯楼的工作，让退出有具体去处。'],

    [5,'抽屉又开了一条缝',0,'fact','你看到方子与药包对不上，先问清为什么没写在上面。'],
    [5,'这趟差谁去',0,'boundary','你先分清自己负责送药，停不停药一直由师父决定。'],
    [5,'这趟差谁去',1,'ownership','你主动问随行能学什么，没有只把见习理解成抱箱子。'],
    [5,'送药被说成了管药',0,'boundary','你当面划清送药和定方子的差别，不让名称替你扩大责任。'],
    [5,'送药被说成了管药',1,'boundary','你请师父亲口说明职责，没有独自解释他交代的差事。'],
    [5,'这条路跑不了两个来回',0,'boundary','你提出让开方者到场，不愿把所有解释都变成自己来回传话。'],
    [5,'谁把封纸抹平',0,'boundary','你请师父站到箱旁，让他回答方子上的问题。'],
    [5,'谁把封纸抹平',1,'boundary','你接下送药部分，同时把停不停药的问题留给师父。'],
    [5,'厨房的人先来回话',0,'fact','你把接药到端药的过程按经手人逐段问清。'],
    [5,'厨房的人先来回话',1,'fact','你请人拿来实际的方子，避免只凭记忆争论。'],
    [5,'他先让你等一等',0,'fact','你请接药的人先说明经过，把核对落到具体环节。'],
    [5,'他先让你等一等',1,'fact','你等原方到场后再对照，没有急着替它作答。'],
    [5,'师父只要你先回去',0,'fact','你把整箱留下，并请师父一起等核查，保留完整交接。'],
    [5,'师父只要你先回去',1,'private','你转去商量私留一包的办法，把核查移向另一次交接。'],
    [5,'她想留下的是哪一样',0,'boundary','你交出整箱，只说明自己原封送来的范围。'],
    [5,'她想留下的是哪一样',1,'private','你提出私下留下小份，开始把完整材料拆成不同去向。'],
    [5,'小一点便能藏住么',0,'boundary','你改为原封交整箱，收回了私留一包的办法。'],
    [5,'小一点便能藏住么',1,'private','你准备自己留一包，让师父先带走其余部分。'],
    [5,'箱子还没打开',0,'boundary','你选择让宫女原封收箱，把药效问题交回配药的人。'],
    [5,'箱子还没打开',1,'private','你进一步请求私留一包，把其余药送回师父手里。']
  ].forEach(row => add(...row));

  function normalize(records) {
    if (!Array.isArray(records) || records.length !== stories.length) throw new Error('请先完成本轮五个身份，再查看画像。');
    return records.map((record, i) => {
      const role = stories[i];
      if (!record || record.roleId !== role.id || !Array.isArray(record.answers)) throw new Error('本轮记录不完整，请重新开始一轮。');
      let node = role.entry;
      const history = [];
      for (const choiceIndex of record.answers) {
        const scene = has(role.scenes, node) && role.scenes[node];
        if (!scene || !Number.isInteger(choiceIndex) || !scene.choices[choiceIndex]) throw new Error('本轮选择记录无法读取。');
        const option = scene.choices[choiceIndex];
        history.push({title:node,answer:option.text,letter:String.fromCharCode(65+choiceIndex),choiceIndex});
        node = option.to;
      }
      if (!has(role.endings, node)) throw new Error('还有身份没有抵达结局。');
      return {roleId:role.id,roleName:role.name,answers:[...record.answers],history,ending:{...role.endings[node],id:node,title:node}};
    });
  }
  const ruleIndex = new Map(rules.map(rule => [rule.roleId + '|' + rule.scene + '|' + rule.choiceIndex, rule]));
  function collect(records) {
    return records.flatMap(record => record.history.flatMap((step, depth) => {
      const rule = ruleIndex.get(record.roleId + '|' + step.title + '|' + step.choiceIndex);
      // Considering a private sample and then keeping the whole box intact is a correction,
      // not evidence that the player ultimately split the material privately.
      if (rule?.key === 'private' && record.roleId === 5 && record.ending.id !== '你袖里的那一包') return [];
      return rule ? [{...rule,roleName:record.roleName,depth,answer:step.answer}] : [];
    }));
  }
  function bestPerRole(events) {
    const best = new Map();
    for (const event of events) {
      const current = best.get(event.roleId);
      if (!current || event.priority > current.priority || event.priority === current.priority && event.depth > current.depth)
        best.set(event.roleId, event);
    }
    return [...best.values()].sort((a,b) => b.priority-a.priority || b.depth-a.depth || a.roleId-b.roleId);
  }
  function evidence(event) {
    return {roleName:event.roleName,scene:event.scene,answer:event.answer,reading:event.reading};
  }
  function build(input) {
    const records = normalize(input);
    const events = collect(records);
    const candidates = Object.keys(templates).filter(key => key !== 'mixed').map(key => {
      const selected = bestPerRole(events.filter(item => item.key === key));
      return {key,selected,score:selected.length+selected.reduce((sum,item)=>sum+item.priority,0)};
    }).filter(item => item.selected.length >= 2).sort((a,b)=>b.score-a.score || b.selected.length-a.selected.length || a.key.localeCompare(b.key));
    // A repeated, actually executed risk should not disappear beneath many earlier
    // routine checks. A single-role incident still cannot define the main profile.
    const recurringRisk = candidates.find(item => ['borrow','private'].includes(item.key));
    const winning = recurringRisk || candidates[0];
    const key = winning?.key || 'mixed';
    const base = templates[key];
    const selected = winning ? winning.selected.slice(0,3) : bestPerRole(events).slice(0,3);
    const alternate = bestPerRole(events.filter(item => item.key !== key)).find(item =>
      !selected.some(picked => picked.roleId === item.roleId && picked.scene === item.scene));
    let contrast = '';
    if (alternate) {
      const lead = ['borrow','private'].includes(alternate.key) ? '需要单独留意的一步：在' : '也有不同的一面：在';
      contrast = lead + alternate.roleName + '这段，' + alternate.reading;
      // Include the actual choice behind the contrast; never infer an unshown choice.
      if (selected.length < 3) selected.push(alternate);
      else if (!selected.some(item => item.roleId === alternate.roleId && item.scene === alternate.scene))
        selected.splice(2,1,alternate);
    }
    return {
      type:base.type,
      headline:base.headline,
      strength:base.strength,
      pitfall:base.pitfall,
      strategy:base.strategy,
      traits:base.traits.map(item=>({...item})),
      evidence:selected.map(evidence),
      reality:{...base.reality},
      advice:base.advice.map(item=>({...item})),
      quote:base.quote,
      contrast,
      scopeNote:'基于本轮剧情选择的娱乐性解读，不是心理测评。集数代表故事结局，不代表能力或人格高低。',
      endingNotes:records.map(record=>({
        roleId:record.roleId,roleName:record.roleName,title:record.ending.title,
        episode:record.ending.episode,status:record.ending.status,
        reading:endings[record.roleId][record.ending.id][2]
      }))
    };
  }
  window.PalaceProfile = {build, rules:rules.map(item=>({...item}))};
})();

