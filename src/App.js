import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const PLAYER_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
const PLAYER_SHAPES = ['circle', 'triangle', 'square', 'rectangle', 'rhombus', 'trapezoid', 'pentagon', 'octagon'];
const MAX_LAPS = 36;

const BOARD_CELLS = [
  // Top-Left Corner (雙休 - 左上至右下斜線)
  { id: 0, type: 'corner-bl', name: '假日1', cost: 0, col: 1, row: 1, holiday: true },
  { id: 1, type: 'corner-tr', name: '假日2', cost: 0, col: 1, row: 1, holiday: true },
  
  // Top Side
  { id: 2, type: 'work', name: '工作日1', cost: 5, col: 2, row: 1 },
  { id: 3, type: 'work', name: '工作日2', cost: 4, col: 3, row: 1 },
  { id: 4, type: 'work', name: '工作日3', cost: 3, col: 4, row: 1 },
  { id: 5, type: 'work', name: '工作日4', cost: 2, col: 5, row: 1 },
  { id: 6, type: 'work', name: '工作日5', cost: 1, col: 6, row: 1 },
  
  // Top-Right Corner (三連休 - 雙斜線 左下至右上)
  { id: 7, type: 'corner-3-tl', name: '假日3', cost: 0, col: 7, row: 1, holiday: true },
  { id: 8, type: 'corner-3-mid', name: '假日4', cost: 0, col: 7, row: 1, holiday: true },
  { id: 9, type: 'corner-3-br', name: '假日5', cost: 0, col: 7, row: 1, holiday: true },
  
  // Right Side
  { id: 10, type: 'work', name: '工作日1', cost: 5, col: 7, row: 2 },
  { id: 11, type: 'work', name: '工作日2', cost: 4, col: 7, row: 3 },
  { id: 12, type: 'work', name: '工作日3', cost: 3, col: 7, row: 4 },
  { id: 13, type: 'work', name: '工作日4', cost: 2, col: 7, row: 5 },
  { id: 14, type: 'work', name: '工作日5', cost: 1, col: 7, row: 6 },
  
  // Bottom-Right Corner (雙休 - 左上至右下斜線)
  { id: 15, type: 'corner-tr', name: '假日6', cost: 0, col: 7, row: 7, holiday: true },
  { id: 16, type: 'corner-bl', name: '假日7', cost: 0, col: 7, row: 7, holiday: true },
  
  // Bottom Side
  { id: 17, type: 'work', name: '工作日1', cost: 5, col: 6, row: 7 },
  { id: 18, type: 'work', name: '工作日2', cost: 4, col: 5, row: 7 },
  { id: 19, type: 'work', name: '工作日3', cost: 3, col: 4, row: 7 },
  { id: 20, type: 'work', name: '工作日4', cost: 2, col: 3, row: 7 },
  { id: 21, type: 'work', name: '工作日5', cost: 1, col: 2, row: 7 },
  
  // Bottom-Left Corner (三連休 - 雙斜線 左下至右上)
  { id: 22, type: 'corner-3-br', name: '假日8', cost: 0, col: 1, row: 7, holiday: true },
  { id: 23, type: 'corner-3-mid', name: '假日9', cost: 0, col: 1, row: 7, holiday: true },
  { id: 24, type: 'corner-3-tl', name: '假日10', cost: 0, col: 1, row: 7, holiday: true },
  
  // Left Side (Bottom to Top)
  { id: 25, type: 'work', name: '工作日1', cost: 5, col: 1, row: 6 },
  { id: 26, type: 'work', name: '工作日2', cost: 4, col: 1, row: 5 },
  { id: 27, type: 'work', name: '工作日3', cost: 3, col: 1, row: 4 },
  { id: 28, type: 'work', name: '工作日4', cost: 2, col: 1, row: 3 },
  { id: 29, type: 'work', name: '工作日5', cost: 1, col: 1, row: 2 },
];
const TOTAL_CELLS = BOARD_CELLS.length;

// ==================== 工作日事件 ====================
const WORK_POSITIVE_EVENTS = [
  { id: 'w3', title: "同事請吃午餐", desc: "好同事突然請你吃不錯的午餐，心情放鬆不少。", effect: { spirit: 7, stress: -5, wealth: 40, belief: 5 } },
  { id: 'w6', title: "年度加薪通過", desc: "考核優秀，老闆批准加薪。", effect: { wealth: 220, belief: 7, spirit: 6, stress: -4 } },
  { id: 'w8', title: "投資獲利", desc: "上班偷看手機，股票小漲並賣出。", effect: { wealth: 150, spirit: 8, stress: -5 } },
  { id: 'w10', title: "公司抽獎小獎", desc: "部門抽獎，你抽到實用小家電。", effect: { wealth: 90, spirit: 9, belief: 5 } },
  { id: 'w13', title: "在家遠距工作", desc: "公司突然改為在家工作，省下通勤。", effect: { stamina: 6, stress: -9, spirit: 7, wealth: 50 } },
  { id: 'w16', title: "提前發放部分年終", desc: "公司財務提前發部分年終獎金。", effect: { wealth: 250, belief: 10, spirit: 7, stress: -6 } },
  { id: 'w19', title: "這個月業績達標", desc: "辛苦衝刺，業績終於達標獲得獎金。", effect: { wealth: 200, spirit: 8, stress: -7, belief: 10 } },
  { id: 'w20', title: "辦公室突然停電", desc: "停電半天，工作暫停可以休息。", effect: { stamina: 8, stress: -6, spirit: 6 } },
  { id: 'w21', title: "宗教宣傳", desc: "同事帶你參加宗教聚會，心靈暫時被安慰。", effect: { belief: 10, stamina: -20, stress: -20, spirit: 20 } }
];

const WORK_NEGATIVE_EVENTS = [
  { id: 'w1', title: "老闆突擊加班", desc: "老闆臨時要求加班到深夜，文件堆積如山。", effect: { stamina: -12, stress: 8, wealth: 80, spirit: -6, belief: -20 } },
  { id: 'w2', title: "交通嚴重塞車", desc: "上班途中 MTR 故障 + 大塞車。", effect: { stamina: -8, stress: 10, spirit: -8, wealth: -60, belief: -10 } },
  { id: 'w4', title: "電腦當機重做工作", desc: "重要檔案消失，一整天努力白費。", effect: { stress: 11, spirit: -10, stamina: -7, wealth: -80, belief: -20 } },
  { id: 'w5', title: "信用卡高額滯納金", desc: "忘記繳信用卡，收到罰款通知。", effect: { wealth: -180, stress: 9 } },
  { id: 'w7', title: "雨天忘帶傘淋雨", desc: "淋成落湯雞，回家還發燒。", effect: { stamina: -14, stress: 6, spirit: -7 } },
  { id: 'w9', title: "會議上出糗", desc: "報告講錯數字，被老闆當眾批評。", effect: { stress: 12, spirit: -13, belief: -5 } },
  { id: 'w11', title: "停車違規罰單", desc: "趕時間亂停車，被開高額罰單。", effect: { wealth: -140, stress: 7 } },
  { id: 'w12', title: "部門聚餐 AA", desc: "部門聚餐 AA 制，你付得比別人多。", effect: { wealth: -110, spirit: 5, stress: -3 } },
  { id: 'w14', title: "年度強積金與健保扣款", desc: "公司統一扣除年度強積金與醫療保險。", effect: { wealth: -160, stress: 5 } },
  { id: 'w15', title: "客戶臨時取消會議", desc: "準備一整天的簡報，客戶突然取消。", effect: { stress: 8, spirit: -7, stamina: -5 } },
  { id: 'w17', title: "辦公室電梯故障", desc: "趕時間卻要爬多層樓梯，累壞了。", effect: { stamina: -11, stress: 7, spirit: -5 } },
  { id: 'w18', title: "同事借錢不還", desc: "好心借錢給同事，對方遲遲不還。", effect: { wealth: -130, stress: 6, belief: -20 } }
];

const HOLIDAY_POSITIVE_EVENTS = [
  { id: 'h2', title: "朋友約唱 KTV 到深夜", desc: "和老朋友唱歌唱到很開心，但很累。", effect: { spirit: 12, belief: 6, stamina: -9, stress: -7 } },
  { id: 'h4', title: "商場活動抽中旅行券", desc: "幸運抽到周末小旅行券，價值不菲。", effect: { wealth: 180, spirit: 11, belief: 5, stamina: 7 } },
  { id: 'h6', title: "公園野餐日", desc: "天氣很好，和朋友去公園野餐聊天。", effect: { stress: -10, spirit: 11, stamina: 8 } },
  { id: 'h8', title: "小賭怡情", desc: "賭運不錯，贏取小獎金。", effect: { wealth: 140, spirit: 10 } },
  { id: 'h9', title: "假日下大雨宅在家", desc: "原本想出門，結果只能在家追劇放空。", effect: { stamina: 9, stress: -7, spirit: 8 } },
  { id: 'h11', title: "朋友終於還錢", desc: "之前借出去的錢，對方今天全部還清。", effect: { wealth: 170, stress: -6, belief: 5 } },
  { id: 'h12', title: "搶到偶像演唱會門票", desc: "成功搶到票，但票價很貴。", effect: { spirit: 14, wealth: -150 } },
  { id: 'h13', title: "商場免費停車優惠", desc: "拿到免費停車券，省下一筆停車費。", effect: { wealth: 70, stress: -4 } },
  { id: 'h14', title: "海邊一日遊", desc: "去海邊玩水、曬太陽，徹底放鬆。", effect: { stress: -12, spirit: 13, stamina: 10 } },
  { id: 'h16', title: "夜市大吃掃街", desc: "去夜市吃到很滿足，但撐壞了。", effect: { spirit: 9, stamina: -6, wealth: -80 } },
  { id: 'h17', title: "收到遠方親戚禮物", desc: "意外收到實用又值錢的假日禮物。", effect: { spirit: 10, wealth: 120 } },
  { id: 'h19', title: "在家徹底放空一天", desc: "什麼都不做，睡大覺、滑手機。", effect: { stamina: 13, stress: -11, spirit: 9 } },
  { id: 'h20', title: "逛街抽獎中大獎", desc: "假日參加抽獎，運氣爆棚抽到不錯獎品。", effect: { wealth: 280, spirit: 12 } },
  { id: 'h21', title: "宗教宣傳", desc: "假日被邀請參加宗教分享會，感到莫名平靜。", effect: { belief: 10, stamina: -20, stress: -20, spirit: 20 } }
];

const HOLIDAY_NEGATIVE_EVENTS = [
  { id: 'h1', title: "家人要求大掃除", desc: "本想睡懶覺，結果被拉起來大掃除一整天。", effect: { stamina: -10, stress: 5, spirit: -6 } },
  { id: 'h3', title: "去看熱門電影", desc: "買票、爆米花、飲料，享受大銀幕時光。", effect: { spirit: 10, stress: -8, wealth: -90 } },
  { id: 'h5', title: "家庭大聚餐", desc: "全家人聚餐，你被推出來負責買單。", effect: { wealth: -380, spirit: 10, belief: -5 } },
  { id: 'h7', title: "假日網購衝動消費", desc: "滑手機不小心買了一堆東西。", effect: { wealth: -320, spirit: 7, stress: 4, belief: -4 } },
  { id: 'h10', title: "登山健行扭傷", desc: "去爬山欣賞風景，不小心扭到腳。", effect: { stamina: -13, spirit: -5 } },
  { id: 'h15', title: "寵物突然生病", desc: "假日帶寵物看獸醫，花了不少錢。", effect: { wealth: -420, stress: 8, spirit: -10, belief: -6 } },
  { id: 'h18', title: "衝動辦健身房年卡", desc: "看到促銷，一時衝動辦了昂貴年卡。", effect: { wealth: -480, stress: 5, belief: -6 } }
];

// ==================== 道具卡資料（新增四種道具） ====================
const ITEM_DATA = [
  {
    id: 'overtime',
    title: '<連續通宵趕project>',
    price: 500,
    desc: '使用後直接移至下一個工作日5。',
    imageUrl: process.env.PUBLIC_URL + '/picture/overtime.png',
    target: 'next_work5'
  },
  {
    id: 'companyhome',
    title: '<公司是我家>',
    price: 1000,
    desc: '使用後直接傳送至第一個工作日1，並強制視為經過起點。若已在此位置則無法使用。',
    imageUrl: process.env.PUBLIC_URL + '/picture/companyhome.png',
    target: 'first_work1'
  },
  {
    id: 'shorttrip',
    title: '<短trip旅行>',
    price: 500,
    desc: '使用後直接移至下一個假日格。',
    imageUrl: process.env.PUBLIC_URL + '/picture/shorttrip.png',
    target: 'next_holiday'
  },
  {
    id: 'longholiday',
    title: '<長假享受人生>',
    price: 1000,
    desc: '使用後直接傳送至假日1。若已在此位置則無法使用。',
    imageUrl: process.env.PUBLIC_URL + '/picture/longholiday.png',
    target: 'holiday1'
  },
  {
    id: 'workunload',
    title: '<職場卸膊>',
    price: 1500,
    desc: '自身壓力減少 50，對象玩家體力減少 30。',
    imageUrl: process.env.PUBLIC_URL + '/picture/workunload.png',
    requiresTarget: true
  },
  {
    id: 'borrownotreturn',
    title: '<借錢不還>',
    price: 1500,
    desc: '自己財力 +1500，對象玩家財力 -1500。',
    imageUrl: process.env.PUBLIC_URL + '/picture/borrownotreturn.png',
    requiresTarget: true
  },
  {
    id: 'toughitout',
    title: '<掉哪媽，頂硬上！>',
    price: 1500,
    desc: '自己體力 +100、壓力 +50、信念 +10、精神+80。',
    imageUrl: process.env.PUBLIC_URL + '/picture/toughitout.png',
    requiresTarget: false
  },
  {
    id: 'longinvestment',
    title: '<長線投資>',
    price: 1000,
    desc: '每次增加1圈數時，額外獲得 +300 財力（永久效果）。',
    imageUrl: process.env.PUBLIC_URL + '/picture/longinvestment.png',
    requiresTarget: false
  },
  {
    id: 'companyshare',
    title: '<公司10%股份>',
    price: 2000,
    desc: '公司10%股份，每張使用(等同賣出)後可立即獲得 +2000 財力。',
    imageUrl: process.env.PUBLIC_URL + '/picture/companyshare.png',
    requiresTarget: false
  },
  {
    id: 'weed',
    title: '<大麻>',
    price: 1000,
    desc: '使用後壓力 -100（最低0）。',
    imageUrl: process.env.PUBLIC_URL + '/picture/weed.png',
    requiresTarget: false
  },
  {
    id: 'donation',
    title: '<奉獻>',
    price: 1000,
    desc: '使用後信念 +10（最高100），向宗教組織奉獻後心靈踏實。',
    imageUrl: process.env.PUBLIC_URL + '/picture/donation.png',
    requiresTarget: false
  },
  {
    id: 'reportall',
    title: '<報串>',
    price: 3000,
    desc: '全面威脅舉報所有人：其他所有玩家財力 -500；特定玩家則再額外 -1500。',
    imageUrl: process.env.PUBLIC_URL + '/picture/reportall.png',
    requiresTarget: false,
  },
];

// 給道具卡用的目標格計算函式
const getTargetPosition = (currentPos, targetType) => {
  switch (targetType) {
    case 'next_work5':
      for (let i = 1; i <= TOTAL_CELLS; i++) {
        const pos = (currentPos + i) % TOTAL_CELLS;
        if (BOARD_CELLS[pos].name.includes('工作日5')) return pos;
      }
      return currentPos;
    case 'next_holiday':
      for (let i = 1; i <= TOTAL_CELLS; i++) {
        const pos = (currentPos + i) % TOTAL_CELLS;
        if (BOARD_CELLS[pos].holiday === true) return pos;
      }
      return currentPos;
    case 'first_work1':
      return 2;   // 遊戲起點後的第一個工作日1
    case 'holiday1':
      return 0;   // 假日1
    default:
      return currentPos;
  }
};

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

const shuffleDeck = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const ShapeSVG = ({ color, shape, size = 16, className = "" }) => {
  let content;
  const stroke = "#0f172a";
  const strokeW = "4";
  switch(shape) {
    case 'circle': content = <circle cx="50" cy="50" r="45" fill={color} stroke={stroke} strokeWidth={strokeW}/>; break;
    case 'triangle': content = <polygon points="50,5 95,95 5,95" fill={color} stroke={stroke} strokeWidth={strokeW}/>; break;
    case 'square': content = <rect x="10" y="10" width="80" height="80" fill={color} stroke={stroke} strokeWidth={strokeW}/>; break;
    case 'rectangle': content = <rect x="5" y="25" width="90" height="50" fill={color} stroke={stroke} strokeWidth={strokeW}/>; break;
    case 'rhombus': content = <polygon points="50,5 95,50 50,95 5,50" fill={color} stroke={stroke} strokeWidth={strokeW}/>; break;
    case 'trapezoid': content = <polygon points="25,10 75,10 95,90 5,90" fill={color} stroke={stroke} strokeWidth={strokeW}/>; break;
    case 'pentagon': content = <polygon points="50,5 95,38 78,95 22,95 5,38" fill={color} stroke={stroke} strokeWidth={strokeW}/>; break;
    case 'octagon': content = <polygon points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30" fill={color} stroke={stroke} strokeWidth={strokeW}/>; break;
    default: content = <circle cx="50" cy="50" r="45" fill={color} stroke={stroke} strokeWidth={strokeW}/>;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} style={{ overflow: 'visible' }}>
      {content}
    </svg>
  );
};

export default function App() {
  const [gameState, setGameState] = useState('setup');
  const [players, setPlayers] = useState([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isMoving, setIsMoving] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [customSteps, setCustomSteps] = useState(1);
  const [viewingDeck, setViewingDeck] = useState(null);

  // 道具相關 state
  const [showShop, setShowShop] = useState(false);          // 是否顯示商店
  const [showInventory, setShowInventory] = useState(null); // 顯示哪個玩家的背包（index 或 null）
  const [showItemEffect, setShowItemEffect] = useState(null); // 使用後效果大圖
  const [shopQuantities, setShopQuantities] = useState({});   // 商店每張卡購買數量
  const [showTargetSelector, setShowTargetSelector] = useState(null); // 需要指定對象的道具：{ itemIdx, item } 或 null
  const [companyShareSold, setCompanyShareSold] = useState(0);   // 公司股份已售張數（最多 10 張）
  const [hiddenGoalPopup, setHiddenGoalPopup] = useState(null);  // { playerName, goalTitle, message }

  // 事件卡牌牌庫
  const [workDeck, setWorkDeck] = useState([]);
  const [holidayDeck, setHolidayDeck] = useState([]);

  // Strict Mode 用：避免同一回合結算重跑
  const [isProcessing, setIsProcessing] = useState(false);
  // 統一處理「落格後恢復 + 抽卡 + 勝利判定」的入口
  // { playerIndex, source: 'move' | 'item' | 'subsidy', ts }
  const [pendingRecovery, setPendingRecovery] = useState(null);

  const logEndRef = useRef(null);

  const addLog = useCallback((msg) => {
  setLogs(prev => {
    const last = prev[prev.length - 1];
    if (last && last.text === msg) {
      return prev;
    }
    return [...prev, { id: Date.now() + Math.random(), text: msg }];
  });
}, [setLogs]);

  const proceedToNaming = (humans, ais) => {
    const initialPlayers = [];
    let colorIdx = 0;
    for (let i = 0; i < humans; i++) initialPlayers.push({ id: `p${i}`, name: `玩家 ${i + 1}`, isAI: false, color: PLAYER_COLORS[colorIdx % PLAYER_COLORS.length], shape: PLAYER_SHAPES[colorIdx++ % PLAYER_SHAPES.length] });
    for (let i = 0; i < ais; i++) initialPlayers.push({ id: `ai${i}`, name: `AI ${i + 1}`, isAI: true, color: PLAYER_COLORS[colorIdx % PLAYER_COLORS.length], shape: PLAYER_SHAPES[colorIdx++ % PLAYER_SHAPES.length] });
    setPlayers(initialPlayers);
    setGameState('naming');
  };

  const finalizeStart = () => {
  setPlayers(prev => prev.map(p => ({ 
    ...p, 
    pos: 0, 
    lap: 0, 
    isFinished: false, 
    stamina: 100, 
    wealth: 3000, 
    stress: 0, 
    spirit: 80, 
    belief: 30,
    hasLandedOnWork: false, 
    hasLandedOnHoliday: false, 
    victoryTitle: null,
    items: [],
    longInvestmentBonus: 0,
    hasUsedWeed: false,        // ★ 新增：是否使用過大麻
  })));

  const allWorkEvents = [...WORK_POSITIVE_EVENTS, ...WORK_NEGATIVE_EVENTS];
  const allHolidayEvents = [...HOLIDAY_POSITIVE_EVENTS, ...HOLIDAY_NEGATIVE_EVENTS];

  setWorkDeck(shuffleDeck(allWorkEvents));
  setHolidayDeck(shuffleDeck(allHolidayEvents));

  setGameState('playing');
  addLog("系統初始化完成，踏入無間輪迴。");
};

  const checkMoveFeasibility = (player, steps) => {
    let { stamina, pos } = player;
    for (let i = 1; i <= steps; i++) {
      const nextPos = (pos + i) % TOTAL_CELLS;
      const cost = BOARD_CELLS[nextPos].cost;
      if (stamina < cost) return { possible: false, reason: '體力透支' };
      stamina -= cost;
    }
    return { possible: true };
  };

const getMaxFeasibleSteps = (player, maxSteps) => {
  let { stamina, pos } = player;
  let maxReachable = 0;

  for (let i = 1; i <= maxSteps; i++) {
    const nextPos = (pos + i) % TOTAL_CELLS;
    const cost = BOARD_CELLS[nextPos].cost;

    if (stamina < cost) break;

    stamina -= cost;
    maxReachable = i;
  }

  return maxReachable;
};

const drawCard = useCallback((isWork) => {
  const currentPlayer = players[turnIndex];
  const isHighStress = currentPlayer.stress >= 80;
  const isLowSpirit  = currentPlayer.spirit <= 20;

  const negativeBias = isHighStress || isLowSpirit ? 0.65 : 0.45;
  let card;

  if (isWork) {
    if (workDeck.length === 0) {
      addLog("🔁 工作事件牌庫已洗牌重置。");
      const fullDeck = shuffleDeck([...WORK_POSITIVE_EVENTS, ...WORK_NEGATIVE_EVENTS]);
      card = fullDeck[0];
      setWorkDeck(fullDeck.slice(1));
    } else {
      const isNegative = Math.random() < negativeBias;
      let candidatePool = isNegative
        ? workDeck.filter(c => WORK_NEGATIVE_EVENTS.some(n => n.id === c.id))
        : workDeck.filter(c => WORK_POSITIVE_EVENTS.some(p => p.id === c.id));
      if (candidatePool.length === 0) candidatePool = workDeck;
      card = candidatePool[Math.floor(Math.random() * candidatePool.length)];
      setWorkDeck(prev => prev.filter(c => c.id !== card.id));
    }
  } else {
    if (holidayDeck.length === 0) {
      addLog("🔁 假日事件牌庫已洗牌重置。");
      const fullDeck = shuffleDeck([...HOLIDAY_POSITIVE_EVENTS, ...HOLIDAY_NEGATIVE_EVENTS]);
      card = fullDeck[0];
      setHolidayDeck(fullDeck.slice(1));
    } else {
      const isNegative = Math.random() < negativeBias;
      let candidatePool = isNegative
        ? holidayDeck.filter(c => HOLIDAY_NEGATIVE_EVENTS.some(n => n.id === c.id))
        : holidayDeck.filter(c => HOLIDAY_POSITIVE_EVENTS.some(p => p.id === c.id));
      if (candidatePool.length === 0) candidatePool = holidayDeck;
      card = candidatePool[Math.floor(Math.random() * candidatePool.length)];
      setHolidayDeck(prev => prev.filter(c => c.id !== card.id));
    }
  }

  return card;
}, [players, turnIndex, workDeck, holidayDeck, addLog, setWorkDeck, setHolidayDeck]);

const handleBuyItem = useCallback(
  (item, quantity) => {
    const currentPlayer = players[turnIndex];
    if (!currentPlayer || currentPlayer.isAI || currentPlayer.isFinished) return;

    if (item.id === 'companyshare') {
      if (companyShareSold >= 10) {
        addLog(`⛔ 公司10%股份已售罄，無法再購買。`);
        return;
      }
      if (companyShareSold + quantity > 10) {
        const remain = 10 - companyShareSold;
        addLog(`⛔ 公司10%股份剩餘 ${remain} 張，無法一次購買 ${quantity} 張。`);
        return;
      }
    }

    const totalCost = item.price * quantity;
    if (currentPlayer.wealth < totalCost) {
      addLog(`⛔ ${currentPlayer.name} 財力不足，無法購買！`);
      return;
    }

    setPlayers(prev => {
      const next = [...prev];
      const p = { ...next[turnIndex] };

      p.wealth = clamp(p.wealth - totalCost, 0, 10000);
      const newItems = Array.from({ length: quantity }, () => ({ ...item }));
      p.items = [...(p.items || []), ...newItems];

      if (item.id === 'companyshare') {
        const shareCount = p.items.filter(it => it.id === 'companyshare').length;
        if (shareCount > 5 && p.victoryTitle !== '山大王') {
          p.victoryTitle = '山大王';
          addLog(`👑 ${p.name} 成為【山大王】：購買並持有超過 5 張公司10%股份！`);
          setTimeout(() => setGameState('gameover'), 1500);
        }
      }

      next[turnIndex] = p;
      return next;
    });

    if (item.id === 'companyshare') {
      setCompanyShareSold(prev => prev + quantity);
    }

    addLog(`🛒 ${currentPlayer.name} 已購買 ${quantity} 張「${item.title}」`);
  },
  [players, turnIndex, companyShareSold, setPlayers, setCompanyShareSold, setGameState, addLog]
);

  const handleUseItem = useCallback(
  (itemIdx, playerIdx) => {
    if (
      playerIdx !== turnIndex ||
      isMoving ||
      isProcessing ||
      activeEvent ||
      viewingDeck
    ) {
      addLog(`⚠️ 只能在自己回合且無其他動作時使用道具卡！`);
      return;
    }

    const player = players[playerIdx];
    const itemToUse = player.items[itemIdx];
    if (!itemToUse) return;

    // 需要指定目標的道具
    if (itemToUse.requiresTarget) {
      setShowTargetSelector({ itemIdx, item: itemToUse });
      return;
    }

    // 傳送類道具
    if (itemToUse.target) {
      const targetPos = getTargetPosition(player.pos, itemToUse.target);

      if (targetPos === player.pos) {
        addLog(
          `⛔ ${player.name} 已經位於目標位置，無法使用「${itemToUse.title}」`
        );
        return;
      }

      // 移除道具
      setPlayers(prev => {
        const next = [...prev];
        const p = { ...next[playerIdx] };
        p.items = p.items.filter((_, i) => i !== itemIdx);
        next[playerIdx] = p;
        return next;
      });

      addLog(`🔮 ${player.name} 使用了「${itemToUse.title}」！`);

      // 傳送 + 經過起點 / 長線投資加成
      setPlayers(prev => {
        const next = [...prev];
        const p = { ...next[playerIdx] };

        const fromPos = p.pos;
        p.pos = targetPos;

        if (itemToUse.target === 'first_work1') {
          p.lap += 1;
          p.wealth = clamp(p.wealth + 1000, 0, 10000);
          if (p.longInvestmentBonus > 0) {
            p.wealth = clamp(
              p.wealth + p.longInvestmentBonus,
              0,
              10000
            );
          }
          addLog(
            `🏠 ${p.name} 使用「公司是我家」，強制經過起點 +1圈 + $1000${
              p.longInvestmentBonus > 0
                ? `（長線投資 +${p.longInvestmentBonus}）`
                : ''
            }`
          );
        } else if (itemToUse.target === 'holiday1' && fromPos !== 0) {
          p.lap += 1;
          p.wealth = clamp(p.wealth + 1000, 0, 10000);
          if (p.longInvestmentBonus > 0) {
            p.wealth = clamp(
              p.wealth + p.longInvestmentBonus,
              0,
              10000
            );
          }
          addLog(
            `🏠 ${p.name} 使用「長假享受人生」，傳送至假日1 並獲得 +1圈 + $1000${
              p.longInvestmentBonus > 0
                ? `（長線投資 +${p.longInvestmentBonus}）`
                : ''
            }`
          );
        }

        if (p.lap >= MAX_LAPS) p.isFinished = true;

        next[playerIdx] = p;
        return next;
      });

      setShowItemEffect(itemToUse);
      setShowInventory(null);
      return;
    }

    // toughitout
    if (itemToUse.id === 'toughitout') {
      setPlayers(prev => {
        const next = [...prev];
        const p = { ...next[playerIdx] };
        p.items = p.items.filter((_, i) => i !== itemIdx);
        p.stamina = clamp(p.stamina + 100, 0, 100);
        p.stress = clamp(p.stress + 50, 0, 100);
        p.belief = clamp(p.belief + 10, 0, 100);
        p.spirit = clamp(p.spirit + 80, 0, 100);

        addLog(
          `💪 ${p.name} 使用「掉哪媽，頂硬上！」：體力+100、壓力+50、信念+10、精神+80`
        );
        next[playerIdx] = p;
        return next;
      });
      setShowItemEffect(itemToUse);
      setShowInventory(null);
      return;
    }

    // longinvestment
    if (itemToUse.id === 'longinvestment') {
      setPlayers(prev => {
        const next = [...prev];
        const p = { ...next[playerIdx] };
        p.items = p.items.filter((_, i) => i !== itemIdx);
        p.longInvestmentBonus += 300;
        addLog(
          `📈 ${p.name} 使用「長線投資」，目前每圈額外 +${p.longInvestmentBonus} 財力`
        );
        next[playerIdx] = p;
        return next;
      });
      setShowItemEffect(itemToUse);
      setShowInventory(null);
      return;
    }

    // companyshare 變現
    if (itemToUse.id === 'companyshare') {
      setPlayers(prev => {
        const next = [...prev];
        const p = { ...next[playerIdx] };
        p.items = p.items.filter((_, i) => i !== itemIdx);
        p.wealth = clamp(p.wealth + 2000, 0, 10000);
        addLog(
          `🏢 ${p.name} 使用「公司10%股份」，立即獲得 +2000 財力`
        );
        next[playerIdx] = p;
        return next;
      });
      setShowItemEffect(itemToUse);
      setShowInventory(null);
      return;
    }

    // weed
    if (itemToUse.id === 'weed') {
      setPlayers(prev => {
        const next = [...prev];
        const p = { ...next[playerIdx] };
        p.stress = clamp(p.stress - 100, 0, 100);
        p.hasUsedWeed = true;

        if (p.hasUnlockedMadKing) {
          p.madKingWeedCountAfterUnlock =
            (p.madKingWeedCountAfterUnlock || 0) + 1;

          if (
            !p.victoryTitle &&
            p.madKingWeedCountAfterUnlock >= 10
          ) {
            p.victoryTitle = '瘋王';
            addLog(
              `👑 ${p.name} 達成隱藏遊戲目標【瘋王】：在多次依賴社會補貼後，服用大麻達 10 次。`
            );
            setTimeout(() => setGameState('gameover'), 1500);
          }
        }

        p.items = p.items.filter((_, i) => i !== itemIdx);
        addLog(
          `🌿 ${p.name} 使用了「大麻」，世界開始變得模糊……`
        );
        next[playerIdx] = p;
        return next;
      });
      setShowItemEffect(itemToUse);
      setShowInventory(null);
      return;
    }

    // donation
    if (itemToUse.id === 'donation') {
      setPlayers(prev => {
        const next = [...prev];
        const p = { ...next[playerIdx] };
        p.items = p.items.filter((_, i) => i !== itemIdx);
        p.belief = clamp(p.belief + 10, 0, 100);
        p.donationUseCount = (p.donationUseCount || 0) + 1;
        addLog(
          `⛪ ${p.name} 使用「奉獻」，信念 +10（最高 100），已使用 ${p.donationUseCount} 次。`
        );

        if (
          p.hasUnlockedCultGod &&
          p.donationUseCount >= 10 &&
          p.belief >= 100 &&
          !p.victoryTitle
        ) {
          p.victoryTitle = '邪教上帝';
          addLog(
            `👑 ${p.name} 達成隱藏遊戲目標【邪教上帝】：在信念歸零後重建信仰並奉獻 10 次，信念已達 100。`
          );
          setTimeout(() => setGameState('gameover'), 1500);
        }

        next[playerIdx] = p;
        return next;
      });
      setShowItemEffect(itemToUse);
      setShowInventory(null);
      return;
    }

    // reportall
    if (itemToUse.id === 'reportall') {
      setPlayers(prev => {
        const next = prev.map((p, idx) => {
          const np = { ...p };
          if (idx !== playerIdx) {
            np.wealth = clamp(np.wealth - 500, 0, 10000);
            if (np.hasUnlockedMadKing || np.hasUnlockedCultGod) {
              np.wealth = clamp(np.wealth - 1500, 0, 10000);
            }
          }
          return np;
        });

        const self = { ...next[playerIdx] };
        self.items = self.items.filter((_, i) => i !== itemIdx);
        next[playerIdx] = self;
        return next;
      });

      addLog(
        `📢 ${player.name} 使用「報串」：其他所有玩家財力 -500，特定玩家則再額外 -1500！`
      );

      setShowItemEffect(itemToUse);
      setShowInventory(null);

      setTimeout(() => {
        setPendingRecovery({
          playerIndex: turnIndex,
          source: 'item',
          ts: Date.now(),
        });
      }, 400);

      return;
    }
  },
  [
    players,
    turnIndex,
    isMoving,
    isProcessing,
    activeEvent,
    viewingDeck,
    setPlayers,
    addLog,
    setShowTargetSelector,
    setShowItemEffect,
    setShowInventory,
    setPendingRecovery,
    setGameState,
  ]
);

const handleApplyTargetEffect = useCallback(
  (targetIdx, pending) => {
    if (!pending || targetIdx === turnIndex) return;
    const itemToUse = pending.item;
    const itemIdx = pending.itemIdx;

    setShowTargetSelector(null);

    setPlayers(prev => {
      const next = [...prev];
      const selfP = { ...next[turnIndex] };
      const targetP = { ...next[targetIdx] };

      if (itemToUse.id === 'workunload') {
        selfP.stress = clamp(selfP.stress - 50, 0, 100);
        targetP.stamina = clamp(targetP.stamina - 30, 0, 100);
        addLog(`💼 ${selfP.name} 使用「職場卸膊」：自身壓力 -50，${targetP.name} 體力 -30`);
      } else if (itemToUse.id === 'borrownotreturn') {
        selfP.wealth = clamp(selfP.wealth + 1500, 0, 10000);
        targetP.wealth = clamp(targetP.wealth - 1500, 0, 10000);
        addLog(`💸 ${selfP.name} 使用「借錢不還」：自己 +1500，${targetP.name} -1500`);
      }

      selfP.items = selfP.items.filter((_, i) => i !== itemIdx);

      next[turnIndex] = selfP;
      next[targetIdx] = targetP;
      return next;
    });

    setTimeout(() => {
      setPendingRecovery({ playerIndex: turnIndex, source: 'item', ts: Date.now() });
    }, 400);
  },
  [turnIndex, setPlayers, setShowTargetSelector, setPendingRecovery, addLog]
);

const triggerSocialSubsidy = useCallback((reason = '財力不足') => {
  const currentIdx = turnIndex;
  addLog(`🚨 ${players[currentIdx].name} ${reason}，強制遣返獲得救濟 $500。`);

  let madKingJustUnlocked = null;  // ★ 新增：用來記錄剛解鎖的玩家名

  setPlayers(prev => {
    const next = [...prev];
    const p = { ...next[currentIdx] };

    p.pos = 0;
    p.lap += 1;
    p.wealth = clamp(p.wealth + 500, 0, 10000);
    p.hasLandedOnHoliday = true;

    p.socialSubsidyCount = (p.socialSubsidyCount || 0) + 1;

    if (!p.hasUnlockedMadKing && p.socialSubsidyCount >= 3 && p.hasUsedWeed) {
      p.hasUnlockedMadKing = true;
      p.hiddenGoals = [...(p.hiddenGoals || []), '瘋王'];
      addLog(
        `🧠 ${p.name} 觸發隱藏目標【瘋王】：已多次依賴社會補貼，若之後在解鎖後累積服用大麻 10 次，即可成就瘋王！`
      );
      madKingJustUnlocked = p.name;  // ★ 標記
    }

    if (p.lap >= MAX_LAPS) p.isFinished = true;
    next[currentIdx] = p;
    return next;
  });

  // ★ 在 setPlayers 之後，如果本次有解鎖瘋王，就顯示彈窗
  if (madKingJustUnlocked) {
    setHiddenGoalPopup({
      playerName: madKingJustUnlocked,
      goalTitle: '瘋王',
      message:
        '已觸發隱藏目標【瘋王】：之後若服用大麻達 10 次，將達成瘋王結局。',
    });
  }

  setIsMoving(false);
  setPendingRecovery({
    playerIndex: currentIdx,
    source: 'subsidy',
    ts: Date.now(),
  });
}, [turnIndex, players, setPlayers, addLog, setIsMoving, setPendingRecovery, setHiddenGoalPopup]);

  const handleMove = useCallback(async (steps) => {
  const s = parseInt(steps, 10);
  if (isMoving || isProcessing || isNaN(s) || s < 1) return;

  const player = players[turnIndex];
  if (player.isFinished) return;

  const check = checkMoveFeasibility(player, s);

  // ===== 體力不足情況（保留原來真人 / AI 縮步 + 社會救濟邏輯） =====
  if (!check.possible) {
    const oneStepCheck = checkMoveFeasibility(player, 1);

    if (!oneStepCheck.possible) {
      const nextPos = (player.pos + 1) % TOTAL_CELLS;
      const nextCell = BOARD_CELLS[nextPos];
      const costForNext = nextCell.cost || 0;

      if (player.stamina < costForNext) {
        const tenTimesWealthCost = costForNext * 10;

        if (player.wealth >= tenTimesWealthCost) {
          addLog(`💸 ${player.name} 體力不足（連 1 格都走不動），支付 ${tenTimesWealthCost} 財力強行移動 1 格。`);

          setIsMoving(true);

          setPlayers(prev => {
            const next = [...prev];
            let p = { ...next[turnIndex] };

            p.wealth = clamp(p.wealth - tenTimesWealthCost, 0, 10000);

            const cell = BOARD_CELLS[(p.pos + 1) % TOTAL_CELLS];
            p.stamina = clamp(p.stamina - cell.cost, 0, 100);
            p.stress  = clamp(p.stress + cell.cost, 0, 100);
            p.spirit  = clamp(p.spirit - cell.cost, 0, 100);

            const wc = cell.wealthCost || 0;
            if (wc > 0) p.wealth = clamp(p.wealth - wc, 0, 10000);

            p.pos = (p.pos + 1) % TOTAL_CELLS;

            if (p.pos === 0) {
              p.lap += 1;
              p.wealth = clamp(p.wealth + 500, 0, 10000);
              if (p.lap >= MAX_LAPS) p.isFinished = true;
            }

            next[turnIndex] = p;
            return next;
          });

          setTimeout(() => {
            setPendingRecovery({ playerIndex: turnIndex, source: 'move', ts: Date.now() });
            setIsMoving(false);
          }, 600);

          return;
        } else {
          triggerSocialSubsidy('體力與財力嚴重不足');
          return;
        }
      }

      addLog(`⛔ [系統攔截] ${player.name} 體力不足，連 1 格都走不動。`);
      setIsMoving(false);
      return;
    }

    if (!player.isAI) {
      addLog(`⛔ [系統攔截] ${player.name} 體力不足，無法走 ${s} 格，請重新選擇較少的步數。`);
      setIsMoving(false);
      return;
    } else {
      const maxSteps = getMaxFeasibleSteps(player, s);
      if (maxSteps <= 0) {
        addLog(`⛔ ${player.name}（AI）體力不足，本回合放棄行動。`);
        setIsMoving(false);
        return;
      }
      addLog(`🤖 ${player.name} 體力不足無法走 ${s} 格，自動改為走 ${maxSteps} 格。`);
      setIsMoving(false);
      await handleMove(maxSteps);
      return;
    }
  }

  // ===== 正常移動 =====
  setIsProcessing(true);
  setIsMoving(true);
  const currentTurnIndex = turnIndex;
  let tempPlayer = { ...players[currentTurnIndex] };
  let weeklyExpense = 0;

  for (let i = 0; i < s; i++) {
    await new Promise(r => setTimeout(r, 120));

    const prevPos = tempPlayer.pos;
    const nextPos = (prevPos + 1) % TOTAL_CELLS;
    const cell = BOARD_CELLS[nextPos];
    const cost = cell.cost || 0;

    tempPlayer.stamina = clamp(tempPlayer.stamina - cost, 0, 100);
    tempPlayer.stress  = clamp(tempPlayer.stress + cost, 0, 100);
    tempPlayer.spirit  = clamp(tempPlayer.spirit - cost, 0, 100);
    tempPlayer.pos = nextPos;

    // 跨越起點 → +1圈 +500 (+長線投資)
if (prevPos !== 0 && nextPos === 0) {
  tempPlayer.lap += 1;
  tempPlayer.wealth = clamp(tempPlayer.wealth + 1000, 0, 10000);
  if (tempPlayer.longInvestmentBonus > 0) {
    tempPlayer.wealth = clamp(tempPlayer.wealth + tempPlayer.longInvestmentBonus, 0, 10000);
  }
  addLog(`💵 ${tempPlayer.name} 完成一圈，領取一個月薪金 $1000${tempPlayer.longInvestmentBonus > 0 ? `（長線投資 +${tempPlayer.longInvestmentBonus}）` : ''}`);
  if (tempPlayer.lap >= MAX_LAPS) tempPlayer.isFinished = true;
}

    if (cell.name.includes('工作日5')) {
      weeklyExpense += 50;
    }

    // 同步整個 tempPlayer 回 state（包含 wealth / lap 等）
    setPlayers(prev => {
      const next = [...prev];
      next[currentTurnIndex] = { ...next[currentTurnIndex], ...tempPlayer };
      return next;
    });
  }

  setTimeout(() => {
    let didTriggerSubsidy = false;

    setPlayers(prev => {
      const next = [...prev];
      let p = { ...next[currentTurnIndex] };

      if (weeklyExpense > 0) {
        if (p.wealth >= weeklyExpense) {
          p.wealth = clamp(p.wealth - weeklyExpense, 0, 10000);
          addLog(`💰 ${p.name} 繳納每週開支 ${weeklyExpense}。`);
        } else {
          didTriggerSubsidy = true;
        }
      }

      next[currentTurnIndex] = p;
      return next;
    });

    if (didTriggerSubsidy) {
      triggerSocialSubsidy("財力不足繳納開支");
      setIsMoving(false);
      setIsProcessing(false);
    } else {
      setPendingRecovery({ playerIndex: currentTurnIndex, source: 'move', ts: Date.now() });
      setIsMoving(false);
      setIsProcessing(false);
    }
  }, 300);
}, [
  players,
  turnIndex,
  setPlayers,
  isMoving,
  isProcessing,
  setIsMoving,
  setIsProcessing,
  addLog,
  triggerSocialSubsidy,
  setPendingRecovery,
]);

  const handleRecoveryAndEvent = useCallback((playerIndex) => {
  setPlayers(prev => {
    const next = [...prev];
    let finalP = { ...next[playerIndex] };
    const cell = BOARD_CELLS[finalP.pos];
    const isWork = cell.type === 'work';
    const isHoliday = !!cell.holiday;

    // 勝利稱號（打工皇帝 / King of Leisure）
    if (finalP.isFinished && !finalP.victoryTitle) {
      if (!finalP.hasLandedOnHoliday) finalP.victoryTitle = "打工皇帝";
      else if (!finalP.hasLandedOnWork) finalP.victoryTitle = "King of Leisure";
      if (finalP.victoryTitle) {
        addLog(`🏆 ${finalP.name} 達成了【${finalP.victoryTitle}】！`);
        next[playerIndex] = finalP;
        setTimeout(() => setGameState('gameover'), 1500);
        return next;
      }
    }

    if (isWork) finalP.hasLandedOnWork = true;
    if (isHoliday) finalP.hasLandedOnHoliday = true;

    if (isHoliday) {
      const recover = 10;
      finalP.stamina = clamp(finalP.stamina + recover, 0, 100);
      finalP.spirit  = clamp(finalP.spirit + recover, 0, 100);
      finalP.stress  = clamp(finalP.stress - recover, 0, 100);
      addLog(`🌴 ${finalP.name} 在假日停歇恢復狀態。`);
    }

    next[playerIndex] = finalP;

    setTimeout(() => {
      const ev = drawCard(isWork);
      setActiveEvent({ playerIndex, event: ev, isWork });
    }, 300);

    return next;
  });
}, [setPlayers, drawCard, setActiveEvent, setGameState, addLog]);

  

  const passTurn = useCallback((cur) => {
  if (cur.some(p => p.victoryTitle) || cur.every(p => p.isFinished)) {
    setGameState('gameover');
    return;
  }

  let nextIdx = turnIndex;
  let count = 0;
  do {
    nextIdx = (nextIdx + 1) % cur.length;
    count++;
  } while (cur[nextIdx].isFinished && count < cur.length);

  setTurnIndex(nextIdx);
}, [turnIndex, setGameState, setTurnIndex]);

  const applyEventEffect = () => {
  if (!activeEvent) return;
  const { playerIndex, event } = activeEvent;

  let cultGodJustUnlocked = null;

  setPlayers(prev => {
    const next = [...prev];
    const p = { ...next[playerIndex] };
    const e = event.effect;

    const beliefBefore = p.belief || 0;
    const beliefNow = beliefBefore;
    const lowBelief = beliefNow < 30;
    const highBelief = beliefNow > 70;

    // 根據信念放大 / 抑制負面效果
    const applyWithBelief = (key, base) => {
      if (!base) return 0;
      const isNegative = (key === 'stress')
        ? base > 0          // 壓力增加視為負面
        : base < 0;         // 其他屬性下降視為負面
      if (isNegative) {
        if (lowBelief) return base * 2;
        if (highBelief) return base * 0.5;
      }
      return base;
    };

    const dStamina = applyWithBelief('stamina', e.stamina || 0);
    const dStress  = applyWithBelief('stress',  e.stress  || 0);
    const dSpirit  = applyWithBelief('spirit',  e.spirit  || 0);
    const dWealth  = applyWithBelief('wealth',  e.wealth  || 0);
    const dBelief  = applyWithBelief('belief',  e.belief  || 0);

    if (dStamina) p.stamina = clamp(p.stamina + dStamina, 0, 100);
    if (dStress)  p.stress  = clamp(p.stress  + dStress,  0, 100);
    if (dSpirit)  p.spirit  = clamp(p.spirit  + dSpirit,  0, 100);
    if (dWealth)  p.wealth  = clamp(p.wealth  + dWealth,  0, 10000);
    if (dBelief)  p.belief  = clamp(p.belief  + dBelief,  0, 100);

    // 邪教上帝：信念為 0 時抽到宗教宣傳 → 解鎖隱藏目標
    const evId = event.event?.id || event.id;
    const isReligionEvent = evId === 'w_religion' || evId === 'h_religion';
    if (!p.hasUnlockedCultGod && isReligionEvent && beliefBefore === 0) {
      p.hasUnlockedCultGod = true;
      p.hiddenGoals = [...(p.hiddenGoals || []), '邪教上帝'];
      addLog(`✨ ${p.name} 觸發隱藏目標【邪教上帝】：在信念為 0 時接受宗教宣傳，若之後使用「奉獻」達 10 次且信念滿 100，即可成就邪教上帝！`);
      cultGodJustUnlocked = p.name;
    }

    next[playerIndex] = p;
    return next;
  });

  setActiveEvent(null);

  if (cultGodJustUnlocked) {
    setHiddenGoalPopup({
      playerName: cultGodJustUnlocked,
      goalTitle: '邪教上帝',
      message: '已觸發隱藏目標【邪教上帝】：之後若使用「奉獻」達 10 次且信念達 100，將成為邪教上帝。'
    });
  }

  setTimeout(() => {
    passTurn(players);
  }, 100);
};

// 專給 AI 用的簡化道具列表（只包含 AI 決策需要的欄位）
const AI_ITEMDATA = useMemo(
  () => [
    { id: 'overtime', price: 500 },
    { id: 'companyhome', price: 1000 },
    { id: 'shorttrip', price: 500 },
    { id: 'longholiday', price: 1000 },
    { id: 'workunload', price: 1500 },
    { id: 'borrownotreturn', price: 1500 },
    { id: 'toughitout', price: 1500 },
    { id: 'longinvestment', price: 1000 },
    { id: 'companyshare', price: 2000 },
    { id: 'weed', price: 1000 },
    { id: 'donation', price: 1000 },
    { id: 'reportall', price: 3000 },
  ],
  []
);

// ==================== AI 目標與策略 ====================

const AI_GOALS = useMemo(
  () => ({
    WORK_KING: 'workking',
    LEISURE_KING: 'leisureking',
    MAD_KING: 'madking',
    CULT_GOD: 'cultgod',
    SHARE_KING: 'shareking',
    GENERIC: 'generic',
  }),
  []
);

// 評估單一玩家對各條勝利路線的可行性與進度（純計算）
const evaluateGoalProgress = useCallback(
  (player, allPlayers) => {
    const goals = [];

    const workKingPossible = !player.hasLandedOnHoliday;
    if (workKingPossible) {
      const base = 40;
      const lapBonus = player.lap * 1.5;
      goals.push({
        goal: AI_GOALS.WORK_KING,
        possible: true,
        progressScore: base + lapBonus,
      });
    }

    const leisureKingPossible = !player.hasLandedOnWork;
    if (leisureKingPossible) {
      const base = 40;
      const lapBonus = player.lap * 1.5;
      goals.push({
        goal: AI_GOALS.LEISURE_KING,
        possible: true,
        progressScore: base + lapBonus,
      });
    }

    const shareCount = (player.items || []).filter(it => it.id === 'companyshare').length;
    const sharePossible = shareCount < 5;
    if (sharePossible) {
      const shareProgress = (shareCount / 5) * 70;
      const wealthFactor = Math.min(player.wealth / 5000, 1) * 30;
      goals.push({
        goal: AI_GOALS.SHARE_KING,
        possible: true,
        progressScore: shareProgress + wealthFactor,
      });
    }

    const subsidyCount = player.socialSubsidyCount || 0;
    const weedAfter = player.madKingWeedCountAfterUnlock || 0;
    const madKingScore = 20 + subsidyCount * 10 + weedAfter * 15;
    goals.push({
      goal: AI_GOALS.MAD_KING,
      possible: true,
      progressScore: madKingScore,
    });

    const donationCount = player.donationUseCount || 0;
    const cultUnlocked = !!player.hasUnlockedCultGod;
    const cultScore =
      (cultUnlocked ? 40 : 0) +
      player.belief * 0.5 +
      donationCount * 6;
    goals.push({
      goal: AI_GOALS.CULT_GOD,
      possible: true,
      progressScore: cultScore,
    });

    if (goals.length === 0) {
      goals.push({
        goal: AI_GOALS.GENERIC,
        possible: true,
        progressScore: 10,
      });
    }

    return goals;
  },
  [AI_GOALS]
);

// 評估場上其他玩家的威脅程度
const evaluateThreatLevel = useCallback(
  (self, allPlayers) => {
    let threat = 0;

    allPlayers.forEach(p => {
      if (p.id === self.id) return;
      if (p.victoryTitle) return;

      const shareCount = (p.items || []).filter(it => it.id === 'companyshare').length;
      if (shareCount >= 3) threat += (shareCount - 2) * 10;

      if (p.hasUnlockedMadKing || p.hasUnlockedCultGod) {
        threat += 25;
      }

      threat += p.lap * 1.2;
    });

    return threat;
  },
  [] // 只依賴參數，沒有用外部 state/props
);

// 綜合自己進度與場上威脅，決定本回合要追的主目標
const pickBestGoalForAI = useCallback((ai, allPlayers) => {
  const goals = evaluateGoalProgress(ai, allPlayers);
  const threatLevel = evaluateThreatLevel(ai, allPlayers);

  goals.sort((a, b) => b.progressScore - a.progressScore);

  let chosen = goals[0]?.goal || AI_GOALS.GENERIC;

  if (threatLevel >= 80) {
    const hasMad = goals.find(g => g.goal === AI_GOALS.MAD_KING);
    const hasCult = goals.find(g => g.goal === AI_GOALS.CULT_GOD);
    if (hasMad && hasCult) {
      chosen = hasMad.progressScore >= hasCult.progressScore ? AI_GOALS.MAD_KING : AI_GOALS.CULT_GOD;
    } else if (hasMad) {
      chosen = AI_GOALS.MAD_KING;
    } else if (hasCult) {
      chosen = AI_GOALS.CULT_GOD;
    }
  }

  return chosen;
}, [evaluateGoalProgress, evaluateThreatLevel, AI_GOALS]);

// ==================== AI 決策相關邏輯 ====================

const evaluateMoveValue = useCallback((ai, aiGoal) => {
  let score = 10;

  score += (ai.stamina - 50) * 0.5;
  score -= (ai.stress - 50) * 0.3;
  score += ai.lap * 0.5;

  if (aiGoal === AI_GOALS.WORK_KING || aiGoal === AI_GOALS.LEISURE_KING) {
    score += 5;
  } else if (aiGoal === AI_GOALS.MAD_KING || aiGoal === AI_GOALS.CULT_GOD) {
    score -= 3;
  } else if (aiGoal === AI_GOALS.SHARE_KING) {
    score += 2;
  }

  return score;
  },
  [AI_GOALS]
);

const evaluateBuyValue = useCallback((ai, aiGoal) => {
  if (ai.wealth < 2500) return 0;

  const itemCount = (ai.items || []).length;
  let score = 0;

  score += (ai.wealth - 2000) * 0.01;
  score += Math.max(0, 5 - itemCount) * 3;

  if (aiGoal === AI_GOALS.CULT_GOD) {
    score += 8;
  } else if (aiGoal === AI_GOALS.MAD_KING) {
    score += 5;
  } else if (aiGoal === AI_GOALS.SHARE_KING) {
    score += 6;
  }

  return score;
}, [AI_GOALS]
);

// 挑出目前最值得使用的一張道具（若有）
const pickBestItemToUse = useCallback((ai, idx, aiGoal) => {
  const items = ai.items || [];
  let best = null;

  items.forEach((it, itemIdx) => {
    let score = 0;

    if (it.id === 'reportall') {
      const threatCount = players.filter(p =>
        p.id !== ai.id &&
        (
          (p.items || []).filter(x => x.id === 'companyshare').length >= 3 ||
          p.hasUnlockedMadKing ||
          p.hasUnlockedCultGod
        )
      ).length;
      if (threatCount > 0) {
        score = 100 + threatCount * 10;
        if (aiGoal === AI_GOALS.MAD_KING || aiGoal === AI_GOALS.CULT_GOD || aiGoal === AI_GOALS.SHARE_KING) {
          score += 15;
        }
      }
    } else if (it.id === 'longinvestment') {
      const remainingLapFactor = Math.max(0, 40 - ai.lap * 2);
      score = remainingLapFactor;
      if (aiGoal === AI_GOALS.SHARE_KING || aiGoal === AI_GOALS.CULT_GOD) {
        score += 10;
      }
    } else if (it.id === 'weed') {
      if (ai.stress >= 80) {
        score = 40 + (ai.stress - 80);
        if (aiGoal === AI_GOALS.MAD_KING && ai.hasUnlockedMadKing) {
          score += 25;
        }
      }
    } else if (it.id === 'donation') {
      if (ai.hasUnlockedCultGod && ai.belief < 100) {
        score = 50 + (100 - ai.belief);
        if (aiGoal === AI_GOALS.CULT_GOD) {
          score += 20;
        }
      }
    } else if (it.id === 'toughitout') {
      if (ai.stamina <= 40 || ai.stress >= 70) {
        score = 30 + (70 - ai.stamina) + Math.max(0, ai.stress - 50);
      }
    } else if (it.id === 'companyshare') {
      if (aiGoal === AI_GOALS.SHARE_KING) {
        score = 10;
      } else {
        score = 20;
      }
    } else if (it.id === 'workunload' || it.id === 'borrownotreturn') {
      const threatLevel = evaluateThreatLevel(ai, players);
      score = threatLevel * 0.6;
      if (aiGoal === AI_GOALS.SHARE_KING || aiGoal === AI_GOALS.MAD_KING || aiGoal === AI_GOALS.CULT_GOD) {
        score += 10;
      }
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { type: 'USEITEM', itemIdx, score };
    }
  });

  return best;
}, [players, AI_GOALS, evaluateThreatLevel]);

// AI 買卡邏輯：只在回合前置階段使用，不結束回合
const tryBuyUsefulItem = useCallback((ai, aiGoal) => {
  const affordable = AI_ITEMDATA.filter(item => ai.wealth >= item.price);
  if (affordable.length === 0) return false;

  let priorityOrder;

  if (aiGoal === AI_GOALS.SHARE_KING) {
    priorityOrder = ['companyshare', 'longinvestment', 'reportall', 'borrownotreturn'];
  } else if (aiGoal === AI_GOALS.CULT_GOD) {
    priorityOrder = ['donation', 'longinvestment', 'reportall', 'borrownotreturn'];
  } else if (aiGoal === AI_GOALS.MAD_KING) {
    priorityOrder = ['weed', 'reportall', 'borrownotreturn', 'longinvestment'];
  } else {
    priorityOrder = ['reportall', 'borrownotreturn', 'longinvestment', 'companyshare'];
  }

  let pick = null;
  for (const id of priorityOrder) {
    const found = affordable.find(it => it.id === id);
    if (found) {
      pick = found;
      break;
    }
  }
  if (!pick) pick = affordable[0];
  if (!pick) return false;

  if (ai.wealth - pick.price < 1000) return false;

  handleBuyItem(pick, 1);
  return true;
}, [AI_ITEMDATA, AI_GOALS, handleBuyItem]);

// 回合前置：視情況先買卡（不會結束回合）
const maybeBuyBeforeAction = useCallback((ai, aiGoal) => {
  const buyScore = evaluateBuyValue(ai, aiGoal);
  if (buyScore <= 0) return;
  tryBuyUsefulItem(ai, aiGoal);
}, [evaluateBuyValue, tryBuyUsefulItem]);

// 單回合 AI 主決策：本回合到底做什麼（用卡或掷骰前進）
// 注意：買卡已改成前置行為，不再單獨結束回合
const runAI = useCallback((idx) => {
  const ai = players[idx];
  if (!ai || !ai.isAI || ai.isFinished) return;

  const aiGoal = pickBestGoalForAI(ai, players);

  maybeBuyBeforeAction(ai, aiGoal);

  const updated = players[idx];
  if (!updated || !updated.isAI || updated.isFinished) return;

  const bestItemAction = pickBestItemToUse(updated, idx, aiGoal);
  const moveScore = evaluateMoveValue(updated, aiGoal);

  if (bestItemAction && bestItemAction.score >= moveScore) {
    handleUseItem(bestItemAction.itemIdx, idx);
    return;
  }

  const steps = Math.floor(Math.random() * 6) + 1;
  handleMove(steps);
}, [
    players,
    maybeBuyBeforeAction,
    pickBestItemToUse,
    evaluateMoveValue,
    pickBestGoalForAI,
    handleUseItem,
    handleMove,
  ]
);

useEffect(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [logs]);

useEffect(() => {
  if (gameState !== 'playing' || isMoving || isProcessing || activeEvent || viewingDeck) return;
  const currentPlayer = players[turnIndex];
  if (!currentPlayer || !currentPlayer.isAI || currentPlayer.isFinished) return;

  const timer = setTimeout(() => runAI(turnIndex), 1200);
  return () => clearTimeout(timer);
}, [
  turnIndex,
  gameState,
  isMoving,
  isProcessing,
  activeEvent,
  viewingDeck,
  players,
  runAI,
]);

useEffect(() => {
  if (!pendingRecovery) return;
  const { playerIndex, source } = pendingRecovery;

  handleRecoveryAndEvent(playerIndex);

  if (source === 'subsidy') {
    setTimeout(() => passTurn(players), 600);
  }

  setPendingRecovery(null);
}, [
  pendingRecovery,
  players,
  handleRecoveryAndEvent,
  passTurn,
]);

  if (gameState === 'setup') {
  return <SetupScreen onProceed={proceedToNaming} />;
}
if (gameState === 'naming') {
  return (
    <NamingScreen
      players={players}
      setPlayers={setPlayers}
      onFinalize={finalizeStart}
    />
  );
}
if (gameState === 'gameover') {
  return <GameOverScreen players={players} />;
}

  const currentPlayer = players[turnIndex];

  return (
    <div className="flex h-screen w-full bg-slate-900 p-4 gap-4 font-sans text-slate-200 overflow-hidden">
      <div className="w-[380px] flex flex-col gap-4 shrink-0">
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50"></div>
          <h2 className="text-xs font-black text-slate-400 mb-3 uppercase tracking-widest flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="flex items-center gap-2"><span className="w-1.5 h-4 bg-amber-500 rounded-sm"></span> 玩家資訊欄</span>
            {currentPlayer && !currentPlayer.isFinished && (
              <span className="text-[10px] bg-emerald-900/40 text-emerald-400 px-2 py-1 rounded-md border border-emerald-800/50 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                行動中：{currentPlayer.name}
              </span>
            )}
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {players.map((p, idx) => (
              <div 
  key={p.id} 
  className={`p-3 rounded-lg border transition-all cursor-pointer hover:ring-2 hover:ring-purple-400 ${idx === turnIndex && !p.isFinished ? 'border-blue-500/80 bg-slate-900 scale-[1.02]' : 'border-slate-800 bg-slate-950 opacity-80'}`}
  onClick={() => setShowInventory(idx)}
>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-black text-sm flex items-center gap-2 text-slate-100">
                    <ShapeSVG color={p.color} shape={p.shape} size={16} />
                    {p.name}
                    {p.isAI && <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded ml-1">AI</span>}
                    {p.isFinished && <span className="text-[9px] bg-amber-900/50 text-amber-400 px-1.5 py-0.5 rounded ml-1">已達終點</span>}
                  </span>
                  <span className="font-black text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">圈數: {p.lap}/{MAX_LAPS}</span>
                </div>
                <div className="space-y-2">
                  <StatBar label="體力" val={p.stamina} max={100} color="bg-emerald-500" />
                  <StatBar label="財力" val={p.wealth} max={10000} color="bg-amber-400" />
                  <StatBar label="壓力" val={p.stress} max={100} color="bg-rose-500" />
                  <StatBar label="精神" val={p.spirit} max={100} color="bg-cyan-500" />
                  <StatBar label="信念" val={p.belief} max={100} color="bg-indigo-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="h-[30vh] bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/50"></div>
          <div className="flex gap-2 mb-3">
            <input type="number" min="1" max="24" value={customSteps} onChange={e => setCustomSteps(e.target.value)} disabled={players[turnIndex]?.isAI || isMoving || activeEvent || viewingDeck || players[turnIndex]?.isFinished} className="w-20 bg-slate-900 border border-slate-700 rounded-lg text-center font-black text-xl outline-none focus:border-blue-500 transition-colors text-slate-200" />
            <button onClick={() => handleMove(customSteps)} disabled={players[turnIndex]?.isAI || isMoving || activeEvent || viewingDeck || players[turnIndex]?.isFinished} className="flex-1 bg-blue-600 text-white font-black text-lg rounded-lg hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-30 tracking-widest">確認行動</button>
          </div>
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-3 overflow-y-auto text-[11px] font-mono text-slate-400 space-y-1.5">
            {logs.map(l => <div key={l.id} className="border-b border-slate-800/50 pb-1">{l.text}</div>)}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      <div className="flex-1 border border-slate-800 bg-slate-950/50 rounded-xl p-2 flex items-center justify-center overflow-hidden shadow-inner relative">
        <div className="relative aspect-square grid grid-cols-7 grid-rows-7 gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800/80" style={{ height: 'min(100%, 90vw)' }}>
          {BOARD_CELLS.map(cell => <BoardCell key={cell.id} data={cell} players={players.filter(p => p.pos === cell.id && !p.isFinished)} />)}
          <div className="col-start-2 col-end-7 row-start-2 row-end-7 flex flex-col items-center justify-center gap-4 z-0 relative">
             <button 
  onClick={() => {
    const cp = players[turnIndex];
    if (cp && !cp.isAI && !isMoving && !activeEvent && !viewingDeck && !cp.isFinished) {
      setShowShop(true);
    } else if (cp && cp.isAI) {
      addLog("🤖 AI 無法購買道具卡");
    }
  }}
  className="group relative w-[18vh] h-[13vh] bg-slate-900 border-2 border-purple-500/50 rounded-xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:scale-105 transition-transform"
>
               <p className="text-[2.2vh] font-black text-purple-300 leading-tight text-center tracking-widest">道具卡</p>
             </button>
             <div className="flex gap-8">
                <button
  onClick={() => setViewingDeck('work')}
  className="group relative w-[13vh] h-[18vh] bg-slate-900 border-2 border-blue-500/50 rounded-xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:scale-105 transition-transform"
>
  <div className="absolute top-1 right-2 text-[10px] font-black text-blue-400">
    {workDeck.length}/{WORK_POSITIVE_EVENTS.length + WORK_NEGATIVE_EVENTS.length}
  </div>
  <p className="text-[2.2vh] font-black text-blue-300 leading-tight text-center tracking-widest">
    工作日<br />事件卡
  </p>
</button>

<button
  onClick={() => setViewingDeck('holiday')}
  className="group relative w-[13vh] h-[18vh] bg-slate-900 border-2 border-emerald-500/50 rounded-xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:scale-105 transition-transform"
>
  <div className="absolute top-1 right-2 text-[10px] font-black text-emerald-400">
    {holidayDeck.length}/{HOLIDAY_POSITIVE_EVENTS.length + HOLIDAY_NEGATIVE_EVENTS.length}
  </div>
  <p className="text-[2.2vh] font-black text-emerald-300 leading-tight text-center tracking-widest">
    假日<br />事件卡
  </p>
</button>
             </div>
             <div className="mt-2 text-center select-none pointer-events-none opacity-20"><h2 className="text-[5vh] font-black tracking-[0.2em] text-white">無間輪迴</h2></div>
          </div>
        </div>

        {activeEvent && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="w-[420px] bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200">
              <div className={`py-4 text-center text-xs font-black text-white tracking-widest uppercase ${activeEvent.isWork ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                {activeEvent.isWork ? '📁 工作日隨機事件' : '🌴 假日隨機事件'}
              </div>
              <div className="p-8 text-center">
                <p className="text-[10px] font-bold text-slate-400 mb-2 tracking-widest uppercase border-b border-slate-700 pb-2 inline-block">事件對象：{players[activeEvent.playerIndex]?.name}</p>
                <h3 className="text-2xl font-black text-slate-200 mb-4">{activeEvent.event?.title}</h3>
                <p className="text-sm font-bold text-slate-400 mb-8 leading-relaxed">{activeEvent.event?.desc}</p>
                <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                  {activeEvent.event?.effect && Object.entries(activeEvent.event.effect).map(([k, v]) => (
                    <div key={k} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center px-4">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{k === 'wealth' ? '財力' : k === 'stamina' ? '體力' : k === 'stress' ? '壓力' : k === 'spirit' ? '精神' : '信念'}</span>
                      <span className={`text-sm font-black font-mono ${v > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{v > 0 ? '+' : ''}{v}</span>
                    </div>
                  ))}
                </div>
                <button onClick={applyEventEffect} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-sm font-black shadow-lg transition-all active:scale-95 uppercase tracking-widest">確認並結算</button>
              </div>
            </div>
          </div>
        )}

{viewingDeck && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="w-[500px] max-h-[80vh] flex flex-col bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200">
              <div className={`py-4 flex justify-between items-center px-6 ${viewingDeck === 'work' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                <span className="text-sm font-black text-white tracking-widest uppercase">{viewingDeck === 'work' ? '工作日事件卡池' : '假日事件卡池'}</span>
                <span className="text-xs font-black text-white/80">剩餘: {viewingDeck === 'work' ? workDeck.length : holidayDeck.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950">
                {(viewingDeck === 'work' ? workDeck : holidayDeck).map((card, i) => (
                  <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <h4 className="text-sm font-black text-slate-200 mb-1">{card.title}</h4>
                    <p className="text-[11px] text-slate-400 font-bold mb-3">{card.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(card.effect).map(([k, v]) => (
                         <span key={k} className={`text-[10px] px-2 py-0.5 rounded font-black ${v > 0 ? 'bg-emerald-950/50 text-emerald-400' : 'bg-rose-950/50 text-rose-400'}`}>{k === 'wealth' ? '財力' : k === 'stamina' ? '體力' : k === 'stress' ? '壓力' : k === 'spirit' ? '精神' : '信念'} {v > 0 ? '+' : ''}{v}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-slate-900 border-t border-slate-800">
                <button onClick={() => setViewingDeck(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-sm font-black transition-all active:scale-95 uppercase tracking-widest">關閉視窗</button>
              </div>
            </div>
          </div>
        )}

{/* ==================== 道具卡商店 Modal ==================== */}
{showShop && (
  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="w-[760px] max-h-[85vh] bg-slate-900 border-2 border-purple-500 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.3)] overflow-hidden flex flex-col">
      
      {/* 標題 */}
      <div className="py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-center font-black text-lg tracking-widest shrink-0">
        🛍️ 道具卡商店
      </div>

      {/* 可捲動的內容區 */}
      <div className="flex-1 p-6 grid grid-cols-2 gap-6 overflow-y-auto">
        {ITEM_DATA.map((item) => {
          const qty = shopQuantities[item.id] || 1;
          const totalPrice = item.price * qty;
          return (
            <div key={item.id} className="bg-slate-950 border border-slate-700 rounded-2xl p-4 flex flex-col">
              <img src={item.imageUrl} alt={item.title} className="w-28 h-28 mx-auto mb-4 object-contain rounded-xl" />
              <h4 className="font-black text-lg text-center text-purple-300 mb-1">{item.title}</h4>
              <p className="text-sm text-slate-400 text-center mb-4">{item.desc}</p>
              <div className="flex justify-between items-center text-amber-400 font-black mb-4">
                <span>💰 單價 {item.price}</span>
                <span className="text-lg">總價 {totalPrice}</span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  min="1" 
                  max="99"
                  value={qty}
                  onChange={(e) => setShopQuantities(prev => ({ ...prev, [item.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-xl text-center font-black text-2xl focus:border-purple-400"
                />
                <button 
                  onClick={() => handleBuyItem(item, qty)}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-black text-sm tracking-widest transition-all active:scale-95"
                >
                  確認購買
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 關閉按鈕 - 固定在底部 */}
      <div className="p-4 border-t border-slate-700 shrink-0">
        <button 
          onClick={() => {
            setShowShop(false);
            setShopQuantities({});   // 清空購買數量
          }} 
          className="w-full bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-black text-white transition-all active:scale-95"
        >
          關閉商店
        </button>
      </div>
    </div>
  </div>
)}
        {/* ==================== 玩家道具卡清單 Modal ==================== */}
        {showInventory !== null && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="w-[520px] bg-slate-900 border-2 border-emerald-500 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.3)] overflow-hidden">
              <div className="py-4 px-6 bg-emerald-600 text-white font-black flex justify-between">
                <span>{players[showInventory].name} 的道具卡</span>
                <span className="text-xs bg-emerald-700 px-3 py-1 rounded-full">共 {players[showInventory].items?.length || 0} 張</span>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                {players[showInventory].items && players[showInventory].items.length > 0 ? (
                  players[showInventory].items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 bg-slate-950 border border-slate-700 rounded-2xl p-4 items-center">
                      <img src={item.imageUrl} alt="" className="w-20 h-20 object-contain flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-black">{item.title}</h4>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                      <button 
                        onClick={() => handleUseItem(idx, showInventory)}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm whitespace-nowrap transition-all active:scale-95"
                      >
                        使用
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400">目前沒有任何道具卡</div>
                )}
              </div>
              <div className="p-4 border-t border-slate-700">
                <button onClick={() => setShowInventory(null)} className="w-full bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-black text-white">關閉</button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 使用道具後的效果圖片 Modal ==================== */}
        {showItemEffect && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-[60]">
            <div className="max-w-md text-center">
              <img 
                src={showItemEffect.imageUrl} 
                alt={showItemEffect.title}
                className="mx-auto w-80 h-80 object-contain drop-shadow-2xl mb-8"
              />
              <div className="bg-slate-900 border border-purple-400 rounded-3xl p-8 inline-block">
                <h2 className="text-3xl font-black text-purple-300 mb-2">{showItemEffect.title}</h2>
                <p className="text-slate-200 mb-6">效果已成功觸發！</p>
                <button 
  onClick={() => {
    setShowItemEffect(null);
    setPendingRecovery({ playerIndex: turnIndex, source: 'item', ts: Date.now() });
  }}
  className="px-10 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-lg tracking-widest transition-all active:scale-95"
>
  確認並繼續
</button>
              </div>
            </div>
          </div>
        )}

      </div>
 {/* ==================== 指定目標道具：選擇目標玩家 Modal ==================== */}
        {showTargetSelector && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="w-[420px] bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.6)] p-6">
              <h2 className="text-sm font-black text-slate-100 mb-3">
                選擇道具目標玩家
              </h2>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {players.map((p, idx) => (
                  idx !== turnIndex && (
                    <button
                      key={p.id}
                      onClick={() => handleApplyTargetEffect(idx, showTargetSelector)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
                    >
                      <span className="font-black text-slate-100">{p.name}</span>
                      {p.isAI && (
                        <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded">
                          AI
                        </span>
                      )}
                    </button>
                  )
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowTargetSelector(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-700 text-slate-100 text-xs font-bold hover:bg-slate-600"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

{hiddenGoalPopup && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-[420px] bg-slate-900 border-2 border-purple-500 rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.6)] p-6">
            <h2 className="text-xl font-black text-purple-300 mb-3 flex items-center gap-2">
              🔓 隱藏目標解鎖
            </h2>
            <p className="text-sm text-slate-200 mb-2">
              {hiddenGoalPopup.playerName} 已觸發隱藏遊戲目標：
            </p>
            <p className="text-lg font-black text-amber-300 mb-3">
              【{hiddenGoalPopup.goalTitle}】
            </p>
            <p className="text-sm text-slate-300 mb-5">
              {hiddenGoalPopup.message}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setHiddenGoalPopup(null)}
                className="px-4 py-1.5 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-500"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function StatBar({ label, val, max, color }) {
  const percentage = clamp((val / max) * 100, 0, 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center px-0.5">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-mono font-bold text-slate-500">{Math.floor(val)}/{max}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
        <div className={`h-full ${color} transition-all duration-300 ease-out`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function BoardCell({ data, players }) {
  const getTokenPosition = (type) => {
    switch (type) {
      case 'corner-bl': return "bottom-2 left-2";
      case 'corner-tr': return "top-2 right-2";
      case 'corner-3-tl': return "top-1 left-1";
      case 'corner-3-mid': return "items-center justify-center inset-0";
      case 'corner-3-br': return "bottom-1 right-1";
      default: return "bottom-1 flex justify-center w-full";
    }
  };

  const renderContent = () => {
    switch (data.type) {
      case 'corner-tr': 
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-10 pointer-events-none">
            <path d="M 100 0 L 100 100 L 0 0 Z" fill="#065f46" stroke="#0f172a" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <text x="67" y="33" transform="rotate(45 67 33)" textAnchor="middle" fill="#d1fae5" fontSize="13" fontWeight="900" dominantBaseline="middle">{data.name}</text>
          </svg>
        );
      case 'corner-bl': 
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-10 pointer-events-none">
            <path d="M 0 0 L 100 100 L 0 100 Z" fill="#0f766e" stroke="#0f172a" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <text x="33" y="67" transform="rotate(45 33 67)" textAnchor="middle" fill="#ccfbf1" fontSize="13" fontWeight="900" dominantBaseline="middle">{data.name}</text>
          </svg>
        );
      case 'corner-3-tl': 
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-10 pointer-events-none">
            <path d="M 0 0 L 60 0 L 0 60 Z" fill="#1e40af" stroke="#0f172a" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <text x="20" y="20" transform="rotate(-45 20 20)" textAnchor="middle" fill="#dbeafe" fontSize="10" fontWeight="900" dominantBaseline="middle">{data.name}</text>
          </svg>
        );
      case 'corner-3-mid': 
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-10 pointer-events-none">
            <path d="M 60 0 L 100 0 L 100 40 L 40 100 L 0 100 L 0 60 Z" fill="#2563eb" stroke="#0f172a" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <text x="50" y="50" transform="rotate(-45 50 50)" textAnchor="middle" fill="#bfdbfe" fontSize="12" fontWeight="900" dominantBaseline="middle">{data.name}</text>
          </svg>
        );
      case 'corner-3-br': 
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-10 pointer-events-none">
            <path d="M 100 40 L 100 100 L 40 100 Z" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <text x="80" y="80" transform="rotate(-45 80 80)" textAnchor="middle" fill="#eff6ff" fontSize="10" fontWeight="900" dominantBaseline="middle">{data.name}</text>
          </svg>
        );
      default:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 border border-slate-700 rounded">
            <p className="text-[1.5vh] font-black text-slate-300 tracking-tighter">{data.name}</p>
            <p className="text-[1.6vh] font-black text-rose-400 mt-1 font-mono">+/-{data.cost}</p>
          </div>
        );
    }
  };

  return (
    <div className={`relative w-full h-full bg-transparent overflow-hidden rounded transition-all ${players.length > 0 && !data.type.includes('corner') ? 'scale-105 shadow-xl ring-2 ring-amber-500 z-20' : 'z-10'}`} style={{ gridColumn: data.col, gridRow: data.row }}>
      {renderContent()}
      <div className={`absolute flex flex-wrap gap-0.5 p-1 z-30 ${getTokenPosition(data.type)}`}>
        {players.map(p => <ShapeSVG key={p.id} color={p.color} shape={p.shape} size={14} className="animate-bounce drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" />)}
      </div>
    </div>
  );
}

function SetupScreen({ onProceed }) {
  const [h, setH] = useState(1);
  const [a, setA] = useState(1);
  const isValid = h >= 1 && (h + a) <= 8;
  
  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-800 p-6 font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
      <div className="bg-slate-700 p-8 rounded-3xl border border-slate-500 shadow-[0_0_50px_rgba(0,0,0,0.8)] w-[650px] text-center relative overflow-hidden flex flex-col max-h-full">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
        <h1 className="text-5xl font-black mb-2 text-yellow-300 tracking-tighter mt-2 drop-shadow-[0_0_18px_rgba(252,211,77,0.75)]">課金帝國</h1>
        <p className="text-sm tracking-[0.35em] uppercase text-yellow-200 mb-6 text-center">THE IAP EMPIRE</p>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 mb-6 text-left overflow-y-auto custom-scrollbar flex-1 max-h-[45vh]">
          <h3 className="text-blue-400 font-black text-sm mb-3 tracking-widest border-b border-slate-800 pb-2">📜 遊戲玩法與規則</h3>
          <ul className="text-[11px] text-slate-300 space-y-2 mb-6 leading-relaxed">
            <li><span className="text-emerald-400 font-bold"> 📆行動與消耗：</span>1. 玩家可以自由選擇移動距離，經過「起點」可領薪 $1000。經過「工作日」會消耗該格相應的體力、精神及增加壓力；停留在「假日」則可恢復10點體力及精神與減少10點壓力。2. 每次經過棋盤的「工作日5」，都必須繳納一週的固定開支 $50。3. 當停留在工作日或假日時會觸發相應隨機事件卡抽取。4. 玩家需在36個圈內爭取完成任一遊戲目標，若走完36圈都未能完成則失去資格。5. 當全部玩家都走完36圈時，遊戲結束。</li>
            <li><span className="text-emerald-400 font-bold">🛍️ 道具卡：</span>玩家可以在自己回合內點擊道具卡區購買道具卡，點擊自己的玩家資訊欄查看及使用已購買的道具卡。每回合只能使用一次且使用後會在原地停留。</li>
                        <li><span className="text-rose-400 font-bold">⚠️ 數值預警：</span>1. 當玩家「壓力 {'>'} 80」或「精神 {'<'} 20」時，抽中<span className="text-rose-400">負面事件</span>的機率將會飆升！2. 當玩家信念低於30時，隨機事件的負面效果加倍，大於70時則減半。</li>
            <li><span className="text-indigo-400 font-bold">🚑 社會救濟金：</span>體力透支時可花相應體力的10倍財力強行移動 1 格；若財力不足以支付每週開支，將強制遣返起點獲社會救濟 $500且圈數+1。</li>
          </ul>

          <h3 className="text-blue-400 font-black text-sm mb-3 tracking-widest border-b border-slate-800 pb-2">🏆 勝利條件</h3>
          <ul className="text-[11px] text-slate-300 space-y-2 leading-relaxed">
            <li><span className="text-amber-400 font-bold">🏁  遊戲目標：</span>任一玩家在36圈內達成以下任一遊戲目標即直接獲勝。</li>
            <li><span className="text-rose-500 font-bold">👑 打工皇帝：</span>36圈內從未停留在假日格。</li>
            <li><span className="text-slate-100 font-bold">👑 King of Leisure：</span>36圈內從未停留在工作日格。</li>
            <li><span className="text-yellow-400 font-bold">👑 山大王：</span>購買並持有超過50%公司股份。</li>
            <li><span className="text-purple-400 font-bold">👑 兩個隱藏目標：</span>請在遊戲中探索。</li>
            </ul>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 px-1 tracking-widest">人類玩家 (1-8人)</label>
            <input type="number" min="1" max="8" value={h} onChange={e=>setH(parseInt(e.target.value)||0)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-blue-500 font-black text-xl text-slate-200 transition-colors text-center" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 px-1 tracking-widest">AI玩家</label>
            <input type="number" min="0" max="8" value={a} onChange={e=>setA(parseInt(e.target.value)||0)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-blue-500 font-black text-xl text-slate-200 transition-colors text-center" />
          </div>
        </div>
        {!isValid && <p className="text-[10px] text-rose-500 font-black text-center animate-pulse tracking-widest mb-4">⚠️ 玩家總和需在 1 至 8 名之間</p>}
        <button
  onClick={() => onProceed(h, a)}
  disabled={!isValid}
  className="mx-auto w-48 bg-blue-600 text-white py-3 rounded-xl font-black text-lg hover:bg-blue-500 active:scale-95 transition-all tracking-widest uppercase disabled:opacity-30 shrink-0"
>
  開始遊戲
</button>
<img
          src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDIwMDEwOTA0Ly9FTiIKICJodHRwOi8vd3d3LnczLm9yZy9UUi8yMDAxL1JFQy1TVkctMjAwMTA5MDQvRFREL3N2ZzEwLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4wIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiB3aWR0aD0iMTAyNC4wMDAwMDBwdCIgaGVpZ2h0PSIxMDI0LjAwMDAwMHB0IiB2aWV3Qm94PSIwIDAgMTAyNC4wMDAwMDAgMTAyNC4wMDAwMDAiCiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0Ij4KCjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAuMDAwMDAwLDEwMjQuMDAwMDAwKSBzY2FsZSgwLjEwMDAwMCwtMC4xMDAwMDApIgpmaWxsPSIjMDAwMDAwIiBzdHJva2U9Im5vbmUiPgo8cGF0aCBkPSJNNDgwMCA5ODkzIGMtMjUgLTIgLTk3IC0xMCAtMTYwIC0xOSAtNjMgLTggLTE1MyAtMTkgLTE5OSAtMjUgLTkxCi0xMCAtMzMxIC01NSAtMzcxIC02OCAtMTQgLTUgLTUwIC0xNCAtODAgLTIxIC03MSAtMTUgLTIxOSAtNTkgLTM5NSAtMTE3Ci0zMDQgLTk5IC02NDUgLTI2MSAtMTAzMCAtNDkwIC05NCAtNTYgLTI5NCAtMjAwIC00MjQgLTMwNiAtNzYgLTYyIC0zMDQgLTI1OAotMzExIC0yNjggLTMgLTQgLTYzIC02NyAtMTM1IC0xNDEgLTE0NCAtMTQ4IC0yNDggLTI2OCAtMzUwIC00MDMgLTM3IC00OSAtNzUKLTk3IC04NCAtMTA2IC0yMiAtMjAgLTIxMSAtMzA2IC0yNzcgLTQxNyAtNTMgLTkwIC0xODcgLTM1MSAtMjQxIC00NzIgLTMwCi02NiAtMTAwIC0yNDggLTEyMyAtMzIxIC00IC0xNCAtMTMgLTM2IC0xOSAtNDcgLTE3IC0zMiAtNTIgLTE2MCAtMTEwIC00MDIKLTI4IC0xMTggLTU2IC0yMzEgLTYxIC0yNTAgLTQgLTE5IC0xNCAtNzggLTIwIC0xMzAgLTYgLTUyIC0xNiAtMTIwIC0yMiAtMTUwCi0xNSAtNzYgLTE3IC0xMDcgLTIyIC0zMzUgLTIgLTExMCAtNyAtMjA4IC0xMSAtMjE4IC00IC0xMCAtNCAtNDggMCAtODUgNAotMzcgNyAtOTMgNyAtMTI1IDAgLTMxIDQgLTYwIDkgLTYzIDUgLTMgOSAtMTAgOSAtMTUgMCAtNiAtNSAtNyAtMTAgLTQgLTcgNAotMTAgLTQ3IC0xMCAtMTQ3IDAgLTI0MSA0NyAtNTY0IDEyMCAtODM4IDY4IC0yNTIgNzYgLTI4MCAxMTUgLTM4MCAyMCAtNTIgNDMKLTExMSA1MCAtMTMwIDczIC0xOTIgMjk5IC02MjggNDE1IC04MDAgMjEgLTMwIDcyIC0xMDcgMTE0IC0xNzAgNzIgLTExMCAxNDcKLTIxMCAyMDQgLTI3NSAxNSAtMTcgNDcgLTU1IDcyIC04NSA4OSAtMTEwIDM0MyAtMzcxIDQ3MSAtNDg2IDU4NCAtNTI1IDEyNTMKLTg5MSAxOTc5IC0xMDgyIDQxIC0xMSAxMDIgLTI4IDEzNSAtMzcgMTM2IC0zNyAzNTcgLTczIDYyMCAtMTAxIDI5NSAtMzAgODc3Ci0xNyAxMTY1IDI3IDI3OSA0MiA4MDcgMTgxIDk2NiAyNTQgMzAgMTQgNTkgMjUgNjQgMjUgMzYgMCA0MjkgMTg3IDU5NSAyODMKMTIyIDcwIDI3MCAxNjAgMjc1IDE2NyAzIDMgNTIgMzggMTEwIDc3IDU4IDQwIDE1NyAxMTMgMjIwIDE2NCA2MyA1MSAxNTEgMTIyCjE5NSAxNTcgOTMgNzUgMzc0IDM0NyA0MjUgNDExIDE5IDI1IDQ5IDU5IDY1IDc1IDE3IDE3IDU1IDYwIDg1IDk2IDMwIDM2IDU4CjY3IDYxIDcwIDE1IDEzIDE5MCAyNTMgMjI5IDMxMyAyNCAzNyA2MiA5OCA4NiAxMzUgMTAzIDE2MSAyODcgNTA5IDMxNCA1OTcgNwoyMiAxOSA1MSAyNiA2NSAyNSA0NSA4MCAyMDMgMTQ1IDQxMCAyMyA3NCA1MCAxNjIgNjAgMTk1IDExIDMzIDI1IDkyIDMzIDEzMAo0NCAyMTkgNTUgMjgwIDcwIDM4MCAzNiAyNDMgNDggMzkyIDUzIDY2MCA0IDIzOSAyIDMxMCAtMTYgNDg1IC0yMSAyMDIgLTI3CjI0MSAtNzcgNTEwIC0xNCA3NCAtMzAgMTU5IC0zNSAxODkgLTUgMjkgLTE5IDgxIC0zMCAxMTUgLTE5IDU2IC01MiAxNjQgLTk5CjMyNiAtMTAgMzYgLTQ0IDEyNiAtNzUgMjAwIC0zMSA3NCAtNTkgMTQzIC02MiAxNTMgLTE4IDU5IC0xOTkgNDAyIC0yODMgNTM3Ci0yOSA0NyAtNjUgMTA0IC03OSAxMjcgLTU2IDkxIC0xNDYgMjIxIC0xOTAgMjczIC0yNiAzMCAtNjYgODIgLTkxIDExNSAtMjUKMzMgLTQ3IDYyIC01MCA2NSAtMyAzIC0yOSAzNCAtNTkgNzAgLTY5IDgzIC05NyAxMTMgLTIxMSAyMzIgLTUyIDU0IC05NiAxMDIKLTk5IDEwNiAtNyAxMCAtMjAyIDE3OCAtMjc2IDIzNyAtMjggMjIgLTU0IDQ1IC02MCA1MSAtMzggNDUgLTQ2NCAzMzQgLTYyMAo0MjEgLTg0IDQ3IC0yNzEgMTQ3IC0zMDUgMTY0IC0xODAgODYgLTM2NiAxNTkgLTU1NSAyMTkgLTcyIDIzIC0xNDggNDcgLTE3MAo1NSAtMTQxIDUwIC00NzggMTI0IC02NTUgMTQ0IC01MiA2IC0xNDkgMTggLTIxNSAyNyAtMTE2IDE0IC02NzkgMjcgLTc4NSAxN3oKbTU1MCAtMTMzIGMyNDQgLTEzIDU1NyAtNTEgNzA5IC04NSAxOTYgLTQ1IDI1NiAtNjAgMzU2IC05MCA2MSAtMTggMTMzIC0zOAoxNjAgLTQ1IDExMCAtMjggNDM5IC0xNjYgNjY5IC0yODIgMTQ2IC03MiAzNDQgLTE4MyAzNTYgLTE5OSAzIC0zIDIwIC0xNCAzOQotMjQgMTkgLTkgNjMgLTM3IDk5IC02MiAzNSAtMjUgODggLTYyIDExNyAtODIgNDYgLTMyIDExOSAtODggMTgwIC0xMzkgMTEKLTEwIDM2IC0yOCA1NSAtNDIgNTcgLTQwIDEwNiAtODUgMjcwIC0yNTAgMTc5IC0xNzggMzAxIC0zMTcgMzgwIC00MzAgMTMgLTE5CjMzIC00NCA0MyAtNTUgMTkgLTIxIDIyOSAtMzMyIDIzNiAtMzQ5IDIgLTYgMTkgLTMxIDM4IC01NSAxOCAtMjQgMzMgLTQ5IDMzCi01NCAwIC02IDkgLTIwIDE5IC0zMSAzNSAtMzkgMzIxIC01OTYgMzIxIC02MjcgMCAtNSAyNCAtNzIgNTQgLTE0NyA2NyAtMTcxCjg2IC0yMjkgMTM2IC00MjIgNDkgLTE4OCAxMTcgLTUxOSAxMjUgLTYxNCAzNyAtNDIzIDQyIC03MTUgMTYgLTkyMSAtNiAtNDkKLTE4IC0xNDYgLTI2IC0yMTUgLTE5IC0xNjMgLTUxIC0zNzYgLTU5IC0zODggLTMgLTUgLTE3IC02MyAtMzAgLTEyOCAtMjAgLTk3Ci0xMTcgLTQwOCAtMTY1IC01MjcgLTYgLTE2IC0xMSAtMzEgLTExIC0zNCAwIC0zMCAtMjQ0IC01MzUgLTMxMSAtNjQzIC0yMgotMzYgLTYyIC0xMDUgLTkwIC0xNTUgLTI4IC00OSAtNzQgLTEyNCAtMTA0IC0xNjUgLTMwIC00MSAtNjMgLTg4IC03NSAtMTA1Ci0xMSAtMTYgLTUxIC03MCAtODggLTExOCAtMzcgLTQ5IC03OCAtMTAzIC05MiAtMTIyIC0xNCAtMTggLTU0IC02MyAtOTAgLTEwMQotMjAyIC0yMTIgLTI2MCAtMjcxIC0zMDUgLTMxMyAtMjcgLTI1IC03MCAtNjYgLTk2IC05MSAtMjYgLTI1IC02NSAtNTkgLTg2Ci03NiAtMjEgLTE4IC01MCAtNDIgLTY0IC01NSAtNjIgLTU2IC0zMjkgLTI1MiAtMzk5IC0yOTQgLTMwIC0xNyAtOTEgLTU0Ci0xMzUgLTgyIC0xMzIgLTgxIC0zMTQgLTE3OSAtNDI1IC0yMjggLTU4IC0yNiAtMTI3IC01NyAtMTU1IC03MCAtNjEgLTI5Ci0yNzggLTEwNyAtMzYwIC0xMzAgLTMzIC0xMCAtMTI1IC0zNiAtMjA1IC02MCAtNDUwIC0xMzIgLTgzMyAtMTg1IC0xMzQyCi0xODUgLTIxNSAwIC0zNzUgMTQgLTYyMyA1NSAtMzMyIDU1IC04MzMgMTk4IC0xMDc0IDMwNiAtMzUgMTYgLTY5IDI5IC03NiAyOQotMjEgMCAtNDA0IDE5MSAtNDg0IDI0MiAtMjUgMTUgLTQ5IDI4IC01MyAyOCAtMTEgMCAtMTMyIDgyIC0xMzYgOTMgLTIgNCAtOAo3IC0xMyA3IC01IDAgLTM3IDE5IC03MSA0MyAtMzQzIDIzNiAtNTg0IDQ0NCAtODA2IDY5NyAtMzEgMzUgLTcyIDgwIC05MSAxMDAKLTE5IDE5IC02MSA2OSAtOTQgMTEwIC0zMyA0MSAtNjQgNzggLTY5IDgxIC01IDQgLTE1IDE1IC0yMSAyNiAtNyAxMSAtNTcgODQKLTExMiAxNjEgLTU1IDc4IC0xMjAgMTc1IC0xNDUgMjE3IC0yNSA0MSAtNzQgMTIxIC0xMDggMTc4IC0xNzQgMjgwIC0zOTYgODMyCi01MDEgMTI0MiAtMzEgMTIyIC02OCAzNzMgLTgxIDU0MCAtNiA4MyAtMTQgMTU4IC0xNyAxNjggLTEyIDQyIC0yOSAxOTcgLTIxCjE5NyA0IDAgOCAxNSA4IDMzIC0xIDE3IDIgNTkgNSA5MSAzIDMzIDEgNjIgLTQgNjUgLTUgNCAtNSA0MSAwIDk2IDYgNTAgOAoxMDcgNSAxMjcgLTQgMjAgLTIgMzggMyA0MCA1IDIgMTYgNjYgMjUgMTQzIDggNzcgMjMgMTc4IDMyIDIyNSA5IDQ3IDE5IDEwOAoyNCAxMzUgMTUgOTcgNDEgMjIwIDUwIDI0MCA1IDExIDE2IDQ3IDI0IDgwIDQyIDE3MiAxMDYgMzgxIDE0MSA0NjAgOCAxNyAyOAo2OCA0NSAxMTUgMTcgNDcgNDIgMTEwIDU1IDE0MCA4MCAxODQgOTkgMjI1IDE1MCAzMjAgMTE2IDIxNSAxOTggMzQ0IDMyNiA1MTQKNDEgNTQgOTMgMTI0IDExNSAxNTcgNTIgNzMgNzcgMTA1IDExNyAxNDkgMTggMTkgNTkgNjYgOTIgMTA0IDEwOSAxMjUgMTE5CjEzNyAxODAgMTk5IDMwMyAzMDkgNzE1IDYwNyAxMTM5IDgyMyAzMDYgMTU2IDYwOCAyNzYgODYxIDM0NCAzOSAxMCA4NCAyMwoxMDAgMjggMTcgNiA2NiAxNyAxMTAgMjcgNDQgOSA5OCAyMCAxMjAgMjUgMTg1IDQzIDU0NSA4OSA3MjcgOTMgNDggMSAxMjIgMwoxNjUgNSA0MyAxIDE3MCAtMiAyODMgLTh6IG0tNDkwNSAtNDU5MCBjMyAtNSAyIC0xMCAtNCAtMTAgLTUgMCAtMTMgNSAtMTYgMTAKLTMgNiAtMiAxMCA0IDEwIDUgMCAxMyAtNCAxNiAtMTB6Ii8+CjxwYXRoIGQ9Ik00ODIwIDk1NjYgYy04IC0xMyAtMzQgLTUxIC01OCAtODUgbC00MiAtNjAgLTQ5IDYgYy01OCA3IC02NiAtNwotNDMgLTgyIDggLTI4IDE1IC03MCAxNiAtOTQgMSAtNDEgNCAtNDUgMzYgLTU3IDQ1IC0xNiA4NiAtMTcgMTEyIC0zIDIwIDExCjIxIDkgMTUgLTI3IC0xMiAtNzUgLTczIC0xNzUgLTE2MyAtMjY5IC00NyAtNDkgLTExMyAtMTI2IC0xNDYgLTE3MCBsLTYwIC04MAo0IDY1IGMzIDM2IC0xIDk0IC03IDEyOCAtMTAgNTIgLTEwIDY1IDEgNjkgMjkgMTEgNTQgNzMgNTQgMTM2IDAgNjQgLTggMTA3Ci0xOSAxMDcgLTMgMCAtMTMgLTIyIC0yMiAtNDggLTIxIC01OSAtNTMgLTE0NiAtNTcgLTE1MSAtMSAtMyAtMTUgNyAtMzAgMjEKLTE1IDE0IC00OSAzOCAtNzcgNTIgLTI3IDE0IC02MSAzNCAtNzQgNDMgbC0yMyAxNyAyMiAtNDQgYzEyIC0yNSAzNCAtNTggNDkKLTczIDI4IC0zMSA5MSAtNjcgMTE1IC02NyAxNCAwIDE4IC0xMiAzMSAtOTEgMTIgLTY0IC0xMiAtMTg4IC01MSAtMjY2IC02MQotMTI1IC0xNjcgLTIxNiAtMzQ5IC0yOTggbC04MCAtMzcgNjYgNjkgYzk2IDk5IDEzNCAxNzQgMjA0IDQwMyAxNCA0NyAzNyAxMDIKNTEgMTIzIDI4IDQzIDI2IDc1IC0zIDU4IC03NCAtNDIgLTE1MyAtMTUyIC0xOTYgLTI3MiAtNzAgLTE5NCAtMTQwIC0zMDQKLTI2NiAtNDIwIC04NiAtNzkgLTIxMSAtMTU3IC0xOTYgLTEyMyA1NiAxMzIgNzIgMjExIDU3IDI4NyAtOSA0MyAtOCA0NyA3IDQxCjYyIC0yNiAxNTcgLTIzIDIxMiA3IDMzIDE3IDk5IDgwIDk5IDk0IDAgNyAtMTUgMzIgLTM0IDU1IC0zMyA0MiAtMzQgNDUgLTIwCjcyIDM3IDcxIDU0IDIzMiAyNyAyNTkgLTEwIDEwIC0xMzIgLTcgLTE5OCAtMjggbC00OSAtMTYgLTIxIDI5IGMtNTUgNzggLTIzNgoyNDQgLTI2NiAyNDQgLTI3IDAgLTg5IC0xOTIgLTk2IC0yOTggLTMgLTQ3IC0xMSAtODUgLTE3IC04OCAtNzkgLTI3IC0xMzAKLTQ5IC0xNzAgLTc0IGwtNDcgLTMwIDI3IC01MSBjMTYgLTI4IDU3IC03NyA5MiAtMTEwIGw2NCAtNjEgLTExIC01NSBjLTYgLTMxCi0xMSAtNjAgLTExIC02NCAwIC0xNCA3MiAtMjkgMTM2IC0yOSA3NiAwIDE1NCAzNiAxODkgODggMzIgNDYgMzkgMjkgMzMgLTc4Ci03IC0xMjAgLTQ5IC0xOTYgLTE4MCAtMzMwIC01NyAtNTggLTEyMiAtMTE5IC0xNDUgLTEzNyAtMzAgLTI0IC00OCAtNTEgLTcxCi0xMDQgbC0yOSAtNzEgLTc5IC0zOCBjLTQ0IC0yMSAtODEgLTM2IC04MyAtMzQgLTMgMiAxMSAyMSAzMSA0MiA1MSA1NCA5MQoxMTggMTIzIDE5NyAyNCA1OCAyOSA4NSAyOSAxNjAgMSA5MiAtMTIgMTU1IC0zOSAxOTAgLTEzIDE3IC0xNiAxOCAtMjUgNSAtNQotOCAtMTAgLTQwIC0xMCAtNzAgLTEgLTE5MCAtMTI0IC00ODYgLTI1MyAtNjExIGwtNDAgLTM4IC01OCAzMiBjLTc2IDQyIC03Ngo0MSAtMTA2IC0xMDUgLTQgLTIxIC0xMSAtMjggLTI5IC0yOCAtMjAgMCAtMjQgLTUgLTI0IC0zMSAwIC00NyAyOCAtOTYgNjUKLTExMyAxOCAtOSAzOSAtMTYgNDUgLTE2IDE4IDAgLTM3IC0zOCAtMTUwIC0xMDYgLTUyIC0zMSAtMTIwIC03MiAtMTUwIC05MQotMzAgLTE5IC04NCAtNTMgLTExOSAtNzUgbC02NCAtMzkgMzkgNTMgYzIxIDI5IDQyIDU1IDQ2IDU4IDggNiA4MCAxMDIgMTUzCjIwNSA2MiA4NiAxMjQgMTg4IDEyNCAyMDUgMSA5IDEwIDM0IDIyIDU1IDExIDIyIDI4IDYyIDM4IDkwIDE1IDQ1IDIxIDUwIDUyCjU2IDU1IDkgMTIzIDQ2IDE0MiA3OCAxMCAxNyAyMyAzNiAzMCA0MyAxOCAxOCA1NyAxMDQgNTcgMTI1IDAgMTEgLTExIDMgLTI5Ci0yMyAtMjQgLTMxIC00MiAtNDQgLTg4IC01OCAtNTYgLTE4IC0xMDkgLTYwIC0xNDAgLTExMSAtMTAgLTE3IC0xMiAtMTQgLTEyCjI4IC0xIDUwIC0xNyA4OSAtNzAgMTY3IC0yMyAzMyAtMzEgNTcgLTMxIDg4IDAgMzEgLTQgNDIgLTEyIDQwIC05IC0zIC0xNAotMzUgLTE2IC0xMDMgLTMgLTExNSAxMCAtMTY1IDYyIC0yMjggbDM0IC00MiAtMjcgLTcxIGMtNDAgLTEwMyAtMTAzIC0yMTQKLTE3NCAtMzExIC0zNCAtNDYgLTg1IC0xMTUgLTExMyAtMTUzIC01MiAtNzAgLTE1NSAtMTgzIC0xNjEgLTE3NiAtMiAxIDQgMjMKMTMgNDcgMjcgNzYgNTQgMjM2IDU0IDMyNCBsMCA4MyAzNiAyMyBjNDcgMjkgNzkgMTAwIDg4IDE5NCA3IDc5IC03IDEyMyAtMTgKNTUgLTUgLTMwIC0xOSAtNTUgLTUxIC04OSAtNDYgLTQ5IC03NSAtMTEyIC03NSAtMTYzIDAgLTE2IC00IC0yNyAtOSAtMjQgLTUKMyAtNyAxNSAtNCAyNSAxMCA0MCAtMTcgOTAgLTc1IDEzNyAtMzEgMjUgLTY1IDYwIC03NCA3OCBsLTE3IDMxIC0xIC0zMiBjMAotNDMgMzYgLTEzNiA2NyAtMTc0IDE0IC0xNiAzOCAtMzYgNTQgLTQ0IDM4IC0yMCA0NCAtNjEgMzAgLTE4OCAtMTUgLTEyOSAtNDMKLTIzMSAtOTIgLTMzMiAtNDQgLTkxIC02NCAtMTE4IC0yMDQgLTI3NiAtMTQ1IC0xNjMgLTE2OCAtMTg3IC0xNTkgLTE2NCAxNgo0MSAxNiAxOTkgMSAyNjUgLTE0IDU5IC0xMCA5OSA3IDcxIDEwIC0xNiAxMDcgLTEzIDE1NiA0IDUzIDE5IDk2IDU1IDEzNyAxMTQKbDMxIDQ2IC00NSA0NyAtNDYgNDcgMTQgNDggYzE5IDY3IDE4IDIyNSAtMSAyNDggLTIxIDI2IC0xMTMgMTMgLTIxNyAtMzIgLTE3Ci03IC0zNiAtMTMgLTQyIC0xMyAtNiAwIC0zNCAyMyAtNjMgNTEgLTI5IDI4IC03NiA2NiAtMTA0IDg0IC01NiAzNyAtMjI3IDEyNQotMjQyIDEyNSAtMTcgMCAtMzQgLTE5NCAtMzAgLTMzMyBsMyAtMTMzIC00OCAtMjIgYy0yNyAtMTIgLTQ2IC0yNiAtNDIgLTMyIDMKLTUgMCAtOCAtNyAtNSAtMTQgNiAtMTE3IC02NyAtMTMxIC05MSAtMTEgLTE5IDg1IC0xMjAgMTcxIC0xODEgbDYzIC00NSAtNwotNzMgLTYgLTcyIDM4IC02IGM2MiAtMTEgMTA3IC04IDE2MyA5IDY5IDIwIDE0NyA5MCAxNjEgMTQ1IDYgMjIgMTUgMzkgMTkgMzkKMjcgMCA0MyAtMjM5IDIyIC0zMzAgLTEyIC01NiAtNDQgLTEzOSAtMTE2IC0zMTEgLTUyIC0xMjMgLTEwMSAtMjczIC0xNDYKLTQ0NSAtMjcgLTEwNCAtNjkgLTM1OSAtNjkgLTQyMSAwIC02MSAtMTUgLTcwIC0yNSAtMTUgLTggNDQgLTMxIDEyMSAtODcgMjkxCi00MyAxMzAgLTQzIDEyNCA1IDE1MiAxMCA2IDE2IDEzIDEzIDE2IC0zIDMgNCAyMiAxNiA0MSAyOCA0NSAzNyAxNzcgMTUgMjM2Ci0xOCA1MyAtMzMgNTYgLTI5IDYgNSAtNTMgLTMgLTgyIC0zMiAtMTE3IC0zNCAtNDAgLTU3IC0xMjYgLTUxIC0xODggNCAtNDAgMwotNDMgLTQgLTE4IC0xOCA2OCAtNjAgMTEyIC0xMzEgMTQwIC0yNSA5IC02MCAyOSAtNzggNDUgLTY0IDU1IC02MSAzOCAxNCAtODIKNDAgLTY1IDEyNyAtMTI2IDE2NiAtMTE4IDE1IDQgODQgLTIwMSAxMzIgLTM5MiA1MCAtMTk4IDk2IC00ODYgNjYgLTQxNSAtMTIKMjggLTE0NiAxNzEgLTIwMyAyMTcgLTQ4IDM3IC00OCAzOCAtMjAgMzggMzcgMCAxMDEgMTggMTA5IDMxIDMgNiAtNiAyNyAtMjEKNDkgLTI0IDM1IC0yNSA0MSAtMTUgNzcgNiAyMSAxMCA1MyA4IDcyIC0yIDI5IC04IDM2IC0zMyA0MyAtMTYgNSAtNTUgNiAtODUKMyAtNTMgLTYgLTU2IC01IC05MCAzMSAtNDAgNDIgLTE0OSAxMTggLTE1NyAxMTAgLTExIC0xMCAtNDMgLTE0MSAtNDMgLTE3MyAwCi0yMiAtNSAtMzMgLTE0IC0zMyAtMjIgMCAtMTU2IC03MiAtMTU2IC04NCAwIC0xNCAxMjkgLTEzNCAxNTEgLTE0MSAxNCAtNSAxOAotMjEgMjAgLTg1IDIgLTQzIDcgLTgxIDEwIC04NCA4IC05IDEyOCAzMCAxNjYgNTMgMjIgMTQgMzYgMzMgNDQgNjMgNyAyNCAxNQo0NiAxOCA1MCAxMSAxMyAxMTcgLTc4IDE5NiAtMTY5IDEyNyAtMTQ1IDIxNyAtMzMxIDk4IC0yMDMgLTcyIDc5IC0xNDIgMTIwCi0yMDQgMTIwIC01NiAwIC02OSAtMTIgLTY5IC02NiAwIC0zNyAzIC00MyAzMCAtNTQgMjkgLTEyIDYwIC04IDYwIDcgMCA1IC0xNAoxNCAtMzAgMjAgLTM0IDEzIC00MyA1MiAtMTIgNTQgNjIgNCAxMjUgLTI3IDE5OCAtOTkgNDYgLTQ2IDE0NSAtMjM4IDE2OAotMzI4IDkgLTM0IDM0IC0xMDUgNTYgLTE1OSAyMyAtNTMgNDAgLTEwMSAzOCAtMTA2IC0yIC01IC0zMCAxOCAtNjMgNTAgLTU0CjUzIC0yMTEgMTYzIC0yOTAgMjA0IC0yNSAxMiAtMzEgMjIgLTMzIDUyIC02IDc5IC0zOSAxMTAgLTE5NiAxODMgLTQ5IDIzIC05Mwo0MiAtOTggNDIgLTExIDAgMSAtNDkgMjAgLTc4IDE0IC0yMSAxMyAtMjIgLTE1IC0yMiAtNDEgMCAtOTMgLTE5IC05MyAtMzQgMAotMTQgNjYgLTc1IDgzIC03NyA3IC0xIC02IC03IC0yNyAtMTMgLTIyIC03IC00MSAtMTcgLTQzIC0yMyAtNCAtMTEgMTA3IC04NgoxNjIgLTExMSA0NSAtMjAgMTE3IC0xMCAxNjAgMjIgbDM2IDI3IDY2IC0zNyBjOTcgLTU0IDI1MyAtMTc2IDMzMSAtMjU5IDQ1Ci00OCA4OCAtMTEwIDEzMyAtMTkxIDE1NiAtMjgzIDIzOSAtNDM0IDIzOSAtNDM5IDAgLTMgLTI1IDEzIC01NiAzNyAtMzcgMjgKLTYzIDU2IC03NCA4MyAtNDUgMTA2IC0xODMgMjgwIC0yOTEgMzY2IC01MiA0MyAtMTk1IDEyOSAtMjEzIDEyOSAtNyAwIC00NgoxMiAtODcgMjYgLTk5IDM1IC0yOTIgNDYgLTM1NCAyMCAtNDggLTIxIC00MCAtMjggNjAgLTUyIDEwMiAtMjUgMTg2IC04MSAzNDEKLTIyOSAxNzMgLTE2NSAyNzkgLTIzNiA0NTYgLTMwNiA1MyAtMjEgMTQxIC02OSAxMzYgLTc1IC0yIC0xIC0zNSA2IC03MyAxNwotODAgMjMgLTIwOSAyMCAtMjcyIC02IGwtMzUgLTE1IDggMjggYzQgMTUgOCA0MyA4IDYyIGwxIDM1IC00OSAtMyBjLTQ1IC0zCi01MCAtMSAtODMgMzggLTUwIDU4IC02OSA2NiAtODcgMzggLTggLTEzIC0yMSAtNDcgLTI5IC03NyBsLTE0IC01NCAtNjQgLTE2CmMtNjggLTE3IC0xMjkgLTUzIC0xMjkgLTc3IDAgLTE4IDgyIC03OCAxMzcgLTEwMSA0MSAtMTcgNDMgLTIwIDQzIC02MyAwIC01OQoxOCAtMTIwIDM1IC0xMjAgMTQgMCAxMDAgNjUgMTIzIDkyIDEwIDEzIDIwIDE0IDQ1IDcgMTggLTUgNDkgLTkgNjkgLTkgbDM4IDAKMCA1NSBjMCA0NiAtNCA1OSAtMzAgODkgbC0zMCAzNCA0NiAxNiBjMTI0IDQyIDI2MyAyMyA0MDQgLTU3IDk2IC01NCAxNjYKLTEyNiAzMTAgLTMxNiA2MyAtODQgMTMyIC0xNjggMTUzIC0xODcgNDQgLTQwIDQwIC00MSAtMzMgLTEyIC00NiAxOCAtNzcgMjIKLTE4MyAyMiAtMTA5IDEgLTEyNiAzIC0xMjEgMTYgMzIgNzQgMzYgOTYgMjQgMTQ4IC0xNSA2NyAtNzkgMTQ0IC0xNjIgMTk0Ci03MSA0MyAtNzkgNDAgLTk4IC0yOCAtNyAtMjQgLTIxIC00OSAtMzEgLTU0IC0xMCAtNiAtNTIgLTEwIC05NCAtMTAgLTYxIDAKLTE1OCAtMTQgLTE3MyAtMjUgLTcgLTUgNDMgLTEyOCA3MyAtMTc4IDE5IC0zMiAzNSAtNjIgMzUgLTY3IDAgLTUgLTExIC0yMQotMjQgLTM3IC00NyAtNTcgLTE0MyAtMjc5IC0xMzIgLTMwOCA1IC0xNSA2NyAtMjAgMTk5IC0xOCA2OSAxIDExMyA2IDEyMyAxNAo4IDYgMTYgMTAgMTcgOCAyIC0yIDE2IC0zMCAzMyAtNjIgMTYgLTMyIDQ0IC03NSA2MSAtOTUgbDMyIC0zNyA0MyA0NiBjMjQgMjUKNTkgNjYgNzggOTIgbDM1IDQ2IDYzIDEgNjIgMCAwIDUzIGMwIDU2IC0yMiAxMzQgLTQ5IDE3NiAtOCAxMyAtMzYgMzcgLTYxIDU0CmwtNDUgMjkgMTIwIC01IGM5MCAtNCAxMzEgLTEwIDE2NSAtMjUgMjUgLTExIDYzIC0yNyA4NSAtMzcgNTMgLTIyIDE2NCAtOTUKMjQ4IC0xNjIgMzcgLTMwIDcyIC01MSA3NyAtNDggNiA0IDkgMSA4IC02IC00IC0xNiAzMTggLTIzMCA0ODcgLTMyNCA3NyAtNDIKMTI3IC03NCAxMTAgLTcwIC03OCAxNyAtMjUwIDM1IC0zNDcgMzUgLTk2IDAgLTEwNyAyIC0xMTMgMTkgLTkgMjkgLTU2IDcyCi0xMDAgOTEgLTIyIDEwIC03NCAyMSAtMTE1IDI1IGwtNzUgNiA0NSAtMjYgYzI1IC0xNSA2MSAtNDEgODAgLTYwIDM4IC0zNSA3OAotNTggMTI1IC03MCBsMzAgLTcgLTQzIC0xOSBjLTMxIC0xMyAtNTAgLTMxIC03MCAtNjUgLTE1IC0yNiAtNDUgLTY2IC02NiAtOTAKLTQzIC00OSAtNDMgLTY0IDEgLTQxIDE1IDggNDcgMjMgNzEgMzMgNDIgMTcgMTAyIDc0IDEwMiA5NSAwIDYgMTAgMjUgMjIgNDEKbDIxIDMxIDE2MSAtNiBjMjAxIC04IDM5MCAtNDggNjIxIC0xMzIgNTUgLTIwIDEyMCAtNDAgMTQ0IC00NiA2OSAtMTQgNjIgLTIwCi0xNiAtMTMgLTExOSAxMSAtMzI5IC0yOCAtNDMzIC04MSAtNjIgLTMxIC02NyAtMzEgLTYzIDMgOCA1NiAtNjkgMTU3IC0xMzQKMTc3IC0xOCA1IC0yNSAtMSAtNDIgLTM0IC0yMiAtNDIgLTI5IC00NiAtMTAxIC01NiAtNjEgLTggLTEwMCAtMjUgLTEwMCAtNDEKMCAtNyAxMCAtMzMgMjEgLTU4IGwyMiAtNDQgLTg3IC05NiBjLTEwMSAtMTEyIC0xMDYgLTEyOSAtNDQgLTE0MSAxMyAtMyA1MgotMTIgODYgLTIxIDM1IC04IDg2IC0xNCAxMTQgLTEzIGw1MCAzIDI0IC00OSBjMTQgLTI2IDM0IC02MSA0NSAtNzcgMTkgLTI2CjIyIC0yNyA0NyAtMTQgMTUgOCA1NCA0NiA4NyA4NCA1NyA2NyA2MyA3MSAxMTMgNzcgbDUyIDYgMCA1OCBjMCA3MCAtMjYgMTE1Ci04NSAxNDggbC0zOSAyMiA2NCAzMCBjOTIgNDMgMjMzIDcxIDM2MCA3MCBsMTA1IDAgLTcyIC0zNSBjLTE0MSAtNzAgLTIyMgotMTk0IC0yMDggLTMyMCBsNiAtNjAgLTMzIDMgYy0zNiA0IC05NSAtMjIgLTExMiAtNDkgLTggLTE0IC01IC0yMyAxNiAtNDUgMjYKLTI4IDI2IC0yOCA3IC01OCAtMjMgLTM3IC0yNSAtODMgLTMgLTkyIDkgLTMgMzcgLTIgNjMgMyBsNDYgOSA0MyAtNDcgYzUwCi01NCAxMTAgLTk1IDEyMiAtODIgMTIgMTMgNDAgMTEzIDQwIDE0NSAwIDIyIDYgMzAgMzQgMzkgMTkgNiA0NiAyMiA2MSAzNgpsMjggMjUgLTM4IDM5IGMtMjEgMjEgLTUxIDQ0IC02NiA1MSAtMTkgNyAtMjkgMTkgLTI5IDMzIDAgMTEgLTMgMzEgLTYgNDMKLTEwIDM3IC01OSAyNyAtMTEzIC0yMSBsLTIzIC0yMSAzIDc1IGM0IDY1IDkgODMgMzcgMTI3IDc2IDExOCAyNzAgMTkzIDQxNwoxNjMgMTc1IC0zNiA0OTEgLTE1MyA2MDggLTIyNyBsNDkgLTMwIC04NCAtNiBjLTk5IC03IC0xNDMgLTE5IC0xOTIgLTUyIC0yMAotMTQgLTQxIC0yNSAtNDUgLTI1IC01IDAgLTExIDE3IC0xNCAzNyAtNCAyMCAtMjMgNjEgLTQzIDkxIC0zNyA1MyAtNzQgNzkKLTE1NyAxMDggLTM2IDEzIC00MiAxMiAtNTkgLTIgLTExIC0xMSAtMTggLTMxIC0xOCAtNTUgbDAgLTM3IC02NyAtMjIgYy0zOAotMTIgLTkyIC0zMSAtMTIwIC00MiBsLTUzIC0yMCAzMSAtNDMgYzE3IC0yMyA1MCAtNjEgNzMgLTg0IGw0MyAtNDIgLTMzIC02NwpjLTMyIC02NSAtODQgLTIzOSAtODQgLTI4MSAwIC0xNiA2IC0yMSAyOSAtMjEgNTAgMCAyMjYgMzkgMjk3IDY2IGw2NyAyNSA0MQotMzkgYzUwIC00NyAxMDkgLTkyIDEyMyAtOTIgMTQgMCA1MCA3OCA1OCAxMjUgOSA1MSAyOSA4MiA1NyA5MCAxMyAzIDQwIDEzCjYwIDIyIDMzIDE0IDM3IDE5IDMxIDQyIC0xOSA4MSAtNzkgMTUxIC0xNjEgMTg4IC0yOSAxNCAtNTAgMjggLTQ3IDMyIDIgNSAzMwoxOSA2NyAzMiAxMzcgNTIgMzA1IDIwIDQ1OSAtODYgbDQ4IC0zMyAtMzEgLTI4IGMtNTEgLTQ5IC0xNjAgLTE5NCAtMjA1IC0yNzMKLTUwIC04NyAtNTQgLTEyMyAtMjIgLTIwMCAzMSAtNzIgNDMgLTY3IDczIDMxIDI3IDg3IDE3MCAzMDQgMjQ1IDM3MiAyMiAyMAoyMiAyMCA2NyAtMjUgNzggLTc1IDIwMyAtMjY2IDIzOSAtMzY0IDI0IC02NiAyOCAtNjkgNTEgLTQ0IDE1IDE3IDE5IDM2IDE5Cjk4IDAgNzEgLTMgODAgLTM5IDE0MSAtNTEgODUgLTExOCAxNzIgLTE4MCAyMzcgLTI3IDI5IC00OCA1NCAtNDUgNTYgMzUgMzEKMTMxIDg0IDE5MiAxMDggMTAxIDM5IDE4MiA0NiAyNjUgMjUgNjIgLTE2IDE0OSAtNTUgMTIzIC01NiAtMzMgLTEgLTE0MSAtNjIKLTE1NCAtODggLTggLTE1IC0yNCAtNDUgLTM2IC02NyAtMzQgLTY0IC0yOSAtNzkgMzUgLTEwNiA0OCAtMTkgNTkgLTI5IDc1Ci02MyAxMCAtMjMgMTkgLTQ3IDE5IC01NSAwIC03IDEyIC00MCAyNiAtNzIgbDI2IC01OCAzNiAzMiBjMjAgMTggNTkgNTMgODcKNzkgbDUwIDQ2IDM1IC0xOCBjMTkgLTExIDg3IC0zMSAxNTAgLTQ1IDYzIC0xNCAxMzAgLTMwIDE0OCAtMzUgMjAgLTUgMzIgLTQKMzIgMiAwIDUgNSA2IDEwIDMgNiAtMyAxMCAtMiAxMCA0IDAgMzIgLTY0IDI1NSAtODcgMzA0IC0zMSA2NiAtMzQgNTYgNTEgMTUxCjQ2IDUzIDU2IDY5IDQ3IDgwIC02IDggLTU2IDI5IC0xMTEgNDcgbC0xMDAgMzMgLTYgNDkgYy00IDI3IC0xMyA1MSAtMjAgNTQKLTI0IDkgLTEyMSAtMjYgLTE2NCAtNjEgLTQ3IC0zNyAtOTAgLTEwMyAtOTAgLTEzOSAwIC00NyAtMTQgLTUwIC02NSAtMTggLTUzCjM0IC0xMTggNTAgLTIxNyA1MyAtMzggMiAtNjggNCAtNjggNSAwIDcgMTcxIDg4IDI2OCAxMjcgMTk1IDc5IDQ0OCAxNDYgNTQ5CjE0NiA0NiAwIDczIC03IDEyMCAtMzAgMTMzIC02NyAxOTIgLTE2OSAxODUgLTMxOSBsLTIgLTM1IC0zMiAzMSBjLTQ0IDQyIC04Mwo1MiAtOTcgMjUgLTYgLTEyIC0xMSAtMzIgLTExIC00NiAwIC0yMCAtOSAtMzAgLTM5IC00NSAtMjEgLTExIC01MCAtMzQgLTY1Ci01MiAtMjUgLTMwIC0yNiAtMzMgLTEwIC01MCA5IC0xMCAzNiAtMjggNjAgLTQwIDQwIC0xOSA0NCAtMjQgNDQgLTU3IDAgLTQyCjE3IC0xMTEgMzIgLTEyOSAxMyAtMTcgNjUgMTYgMTIyIDc3IDQzIDQ2IDQ3IDQ4IDc4IDM5IDQ3IC0xMyA4OCAtMTEgOTQgNSAzCjcgLTQgMzcgLTE1IDY3IC0yMSA1MyAtMjEgNTMgLTEgNzQgMTEgMTIgMjAgMjkgMjAgMzcgMCAyNiAtNjUgNjEgLTEwNCA1NgpsLTMzIC00IDAgODYgYzAgNjkgLTQgOTUgLTI1IDE0MSAtMzIgNzEgLTc4IDEyMyAtMTQyIDE2MSBsLTUxIDI5IDEyNSAtNApjMTAwIC00IDEzOSAtMTAgMTk1IC0zMCA4NyAtMzEgMTQ1IC01NiAxNDUgLTYyIDAgLTIgLTE4IC0xNCAtNDAgLTI1IC00OSAtMjUKLTc3IC03NyAtODEgLTE1MCBsLTMgLTU1IDU5IC04IGM1NCAtOCA2MyAtMTIgOTAgLTQ5IDQyIC01NiAxMjMgLTEzMCAxMzUKLTEyMyA2IDMgMjggMzggNDkgNzggbDQwIDcxIDQ5IC0zIGM2OCAtMyAyNDIgMzggMjQyIDU4IDAgNSAtNzYgMTExIC05OCAxMzYKLTQgNiAtMjQgMjIgLTQyIDM2IGwtMzQgMjYgMjIgNTEgYzEyIDI4IDIyIDU3IDIyIDY1IDAgMTYgLTExOCA1NyAtMTY0IDU3Ci0yMSAwIC0yNyA3IC0zNyA0MCAtNyAyMiAtMTcgNDAgLTIyIDQwIC01IDAgLTM0IC0xNCAtNjQgLTMxIC02MCAtMzUgLTkzIC04NQotOTMgLTE0NCAwIC0xOSAtMiAtMzUgLTQgLTM1IC0yIDAgLTIzIDExIC00NyAyNCAtODQgNDcgLTIxMyA3NyAtMzUzIDgzCmwtMTI4IDYgMTM4IDQzIGMyMjggNzAgNDE2IDEyMyA0NTkgMTI5IDIyIDQgMTEyIDkgMjAwIDEyIGwxNjEgNSAxMiAtMjYgYzcKLTE1IDEyIC0zMyAxMiAtNDAgMCAtMjMgNjQgLTc1IDE0OSAtMTIxIDQ3IC0yNSA4NiAtNDMgODggLTQxIDIgMiAtMTQgMjUgLTM1CjUyIC0yMSAyNyAtNTEgNjggLTY3IDkyIC0yOCA0MyAtOTcgOTIgLTEyOCA5MiAtOSAwIC0xNCA2IC0xMSAxMyAzIDggMTggMTEKNDMgOSAyNSAtMyA0MyAxIDU0IDEyIDggOSAyMCAxNiAyNSAxNiA1IDAgMjggMTggNTAgMzkgMjIgMjEgNTYgNDUgNzYgNTIgNTcKMjAgNDQgNDUgLTE1IDI5IC0xOSAtNCAtNjAgLTExIC05MSAtMTUgLTQ3IC01IC02NCAtMTMgLTEwMiAtNDYgLTI0IC0yMiAtNDYKLTUwIC00OCAtNjIgLTMgLTIxIC02IC0yMiAtMTA4IC0xOSAtNjkgMiAtMTU1IC00IC0yNDkgLTE3IC04MCAtMTIgLTE0NiAtMTkKLTE0OCAtMTcgLTMgMiAxMyA5IDM0IDE2IDExNiAzNyA1MTkgMjg0IDY2OCA0MTAgNzcgNjUgMjM3IDE3MSAyOTggMTk4IDI2IDEyCjc2IDI4IDExMCAzNyA2OCAxNiAyMjcgMjYgMjI3IDEzIDAgLTQgLTQgLTggLTggLTggLTQgMCAtMjggLTE5IC01MSAtNDIgLTU5Ci01OCAtODMgLTExNiAtNzkgLTE5MiBsMyAtNjAgNjAgLTQgYzQ3IC0yIDY0IC04IDc3IC0yNSA4MSAtMTAzIDEyMyAtMTQ3IDE0MAotMTQ3IDE1IDAgODQgOTYgMTA5IDE1MyA5IDIwIDE3IDI2IDI4IDIwIDkgLTQgODUgLTkgMTY5IC0xMSAxMzUgLTMgMTUzIC0yCjE1OSAxMyAxNCAzNyAtNjIgMjEzIC0xMjggMjk3IGwtMzMgNDEgNDIgNzggYzQxIDc3IDc3IDE2NyA2OSAxNzUgLTcgNyAtMTAyCjIyIC0xODggMjkgLTgzIDYgLTg2IDcgLTEwMiAzOCAtOSAxOCAtMTkgNDQgLTIzIDU5IC0zIDE2IC0xMSAyOCAtMTggMjggLTE3Ci0xIC0xMzYgLTc5IC0xMzYgLTkwIDAgLTYgLTUgLTkgLTExIC04IC0xOCA0IC02NyAtNzIgLTgxIC0xMjQgLTEyIC00NyAtMTEKLTU4IDE5IC0xNTggMyAtMTMgLTExIC0xNSAtOTQgLTEyIC04MSAzIC0xMTIgLTEgLTE4MyAtMjIgLTQ2IC0xNCAtODcgLTIzCi04OSAtMjAgLTggNyA3MiA3MyA4MiA2NyA0IC0yIDYgMCA1IDUgLTIgNSAyMSAzNyA1MCA3MCA4NiAxMDAgMTU1IDE4NiAxOTIKMjM5IDM1IDUwIDEzNyAxMzIgMjE2IDE3MSA1NyAyOSAxNTMgNTIgMjE1IDUyIDUwIDAgMTU0IC0yMiAxNjcgLTM0IDMgLTMgLTcKLTE3IC0yMSAtMzAgLTI2IC0yNCAtNDEgLTc0IC0zNSAtMTE3IDIgLTIwIDEwIC0yNSA0MSAtMjcgMjIgLTIgNTMgMiA3MCA4IDIyCjcgMzMgNyAzNSAwIDYgLTE2IDExMiAtMTAwIDEyNyAtMTAwIDE4IDAgMzUgNTMgMzUgMTEwIGwwIDQ3IDYzIDMxIGM3MCAzNQoxMzEgODYgMTI0IDEwNSAtNiAxOCAtMTA2IDY2IC0xNTcgNzUgLTQyIDcgLTQ1IDEwIC01MSA0NSAtNyA0NiAtMzkgMTE3IC01MgoxMTcgLTUgMCAtMzAgLTIxIC01NiAtNDcgLTQxIC00MyAtNTAgLTQ4IC05MSAtNDggbC00NSAwIDEgLTQ1IGMwIC0yNSA0IC01Mwo4IC02MiA3IC0xNSAzIC0xNSAtNTEgLTEgLTc3IDIwIC0yMTggMTMgLTI5MCAtMTUgLTExMyAtNDMgLTExIDI3IDExMiA3NyAxOTgKODIgMjc1IDEzNCA0NTUgMzA2IDE4NyAxNzkgMjc2IDIzNSAzNzYgMjM1IDQxIDAgNjEgMjIgMzggNDEgLTI5IDI0IC0yNTIgMTkKLTM0NyAtOSAtMTAxIC0yOSAtMjQzIC0xMDEgLTMyMCAtMTYyIC0xMTEgLTg3IC0yMzggLTI0NCAtMjg3IC0zNTIgLTkgLTIxCi00MiAtNjAgLTc0IC04OCAtNTQgLTQ3IC03MyAtNjAgLTYzIC00MiAzIDQgMjMgMzcgNDUgNzMgMjEgMzYgNjQgMTEyIDk0IDE3MAoxMTIgMjExIDE4NiAzMjkgMjQ3IDM5MiA1OCA2MiAxNzAgMTU0IDI0MSAxOTkgMzAgMjAgNjYgNDUgNzkgNTcgMzkgMzQgNTkgMzUKMTAyIDUgMjggLTE5IDU3IC0yOSA5MyAtMzIgNTEgLTQgNTYgLTIgMTM2IDUyIDQ2IDMxIDg3IDU2IDkyIDU2IDQgMCA4IDcgOAoxNSAwIDEwIC0xNCAxNyAtNDAgMjEgLTQzIDcgLTUyIDE5IC0yMiAyOCAyNiA5IDc1IDYyIDY4IDc0IC0zIDYgLTMzIDEzIC02NgoxNyBsLTYwIDcgMjMgMzggYzE3IDMwIDE5IDQyIDEwIDUxIC05IDkgLTI0IDQgLTY0IC0yMSAtMjkgLTE4IC01OCAtMzMgLTY0Ci0zNSAtNzIgLTE2IC0xMzkgLTc5IC0xNTYgLTE0NyAtMTEgLTQzIC0xOCAtNTAgLTgxIC05MCAtMTAyIC02MyAtMTg0IC0xMjUKLTI1NSAtMTkyIC0zNSAtMzIgLTYzIC01NyAtNjMgLTU1IDAgMiAyOSA4MCA2NSAxNzQgMzYgOTMgNjUgMTc2IDY1IDE4NSAwIDI5Cjc5IDE3MSAxMjUgMjI1IDgzIDk3IDE5NCAxNTcgMjI0IDEyMSAxOCAtMjIgNyAtNDYgLTI5IC01OSAtMTcgLTYgLTMwIC0xNQotMzAgLTE5IDAgLTE3IDUwIC03IDc0IDE0IDUzIDQ5IDM4IDk2IC0zMiAxMDUgLTcyIDEwIC0xODEgLTU4IC0yNjIgLTE2MgpsLTIzIC0zMCA3IDM0IGMzIDE4IDEyIDQ1IDIwIDYwIDggMTQgMjIgNDAgMzEgNTggNDMgODEgMjc3IDMxNyAyOTUgMjk2IDMgLTQKMTIgLTI3IDE5IC01MCA4IC0zMCAyMSAtNDggNDUgLTYyIDQ4IC0zMCAxNDkgLTYyIDE2MCAtNTEgNSA1IDExIDQzIDE0IDg0IDQKNzIgNiA3NyAzNiA5NSAxNyAxMSA1MyA0MiA4MCA3MCA0OCA0OCA0OSA1MSAzMiA2OSAtOSAxMSAtNDYgMzMgLTgxIDQ4IC02MAoyNyAtNjQgMzEgLTcwIDY5IC0xMiA3MSAtMzcgMTY1IC00NSAxNjUgLTEyIDAgLTE0NCAtOTcgLTE3MyAtMTI3IC0yNiAtMjgKLTMwIC0yOSAtNzEgLTIwIC01MyAxMiAtMTE1IDIgLTEyMyAtMjAgLTQgLTkgMCAtNDQgOSAtNzcgMTYgLTYwIDE2IC02MSAtOAotODkgLTQ1IC01NCAtMzQgLTcwIDU4IC04MiBsNDcgLTcgLTk4IC05NyBjLTU0IC01MyAtMTA5IC0xMTIgLTEyNCAtMTMxIGwtMjYKLTM1IDQgMzAgYzM5IDI0NiA5NyA1MTMgMTM0IDYxNSA1NSAxNTEgNjUgMTcxIDkwIDE3NyA3NyAxOCAxNDMgNzggMTkwIDE3MAozMCA1OSAyNiA3MCAtMTEgMzQgLTE3IC0xNyAtNTMgLTM4IC03OSAtNDYgLTI2IC05IC02OCAtMzQgLTkyIC01NiAtMjUgLTIxCi00OCAtMzkgLTUxIC0zOSAtMyAwIC02IDE1IC02IDMzIDAgMjEgLTE0IDU2IC0zNyA5MyAtMjcgNDQgLTM3IDczIC00MSAxMTcKLTUgNjcgLTE5IDc1IC0yNiAxNSAtMTggLTE0MiAtMTcgLTE1NCA1IC0yMTQgMTIgLTMyIDM0IC03MSA0OSAtODYgbDI3IC0yNwotNDggLTE0NSBjLTI2IC04MCAtNTMgLTE3MiAtNjEgLTIwMyBsLTEzIC01OCAtNiAxNTAgYy02IDEzNSAtMTggMjU0IC0zNCAzNDAKLTIxIDEwNyAtOTYgMzcwIC0xMzAgNDUwIC01NyAxMzYgLTk4IDI5NyAtOTcgMzg1IDAgNzcgMTkgMjAwIDMxIDIwMCAzIDAgMTQKLTIwIDI1IC00NSAyMiAtNTYgOTEgLTExOCAxNTMgLTEzOSA0NyAtMTYgMTQ4IC0yMSAxOTIgLTkgMjMgNiAyMyA4IDE3IDgyCmwtNiA3NyAzMiAxOCBjNTYgMzMgMTA0IDc0IDE1NyAxMzUgbDUxIDU5IC02MyA1MSBjLTM1IDI5IC04NyA2NCAtMTE2IDgwCmwtNTIgMjcgLTMgMTcwIGMtNSAyMjkgLTEzIDI5NCAtMzcgMjk0IC0yNSAwIC0xOTUgLTk1IC0yNjEgLTE0NSAtMjkgLTIyIC02OQotNTcgLTg5IC03OCBsLTM2IC0zOCAtNzUgMjUgYy04NiAyOCAtMTc3IDQxIC0xOTcgMjggLTI2IC0xOCAtMjQgLTIxMyA0IC0yODMKNCAtMTEgLTkgLTMxIC0zOSAtNjMgLTI4IC0yOCAtNDMgLTUyIC00MCAtNjEgNCAtOCA5IC0xNSAxMyAtMTUgMyAwIDEyIC0xMwoxOCAtMjggMTYgLTM1IDk1IC05NSAxNDcgLTExMiAyMyAtNyA2NCAtMTAgMTAxIC04IGw2MiA1IC0xNSAtNTYgYy0xMCAtMzUKLTE2IC0xMDEgLTE2IC0xNzggMCAtNjcgLTMgLTExOSAtNyAtMTE1IC0zIDQgLTI5IDQxIC01NyA4MiAtMjggNDEgLTgzIDEwOQotMTIyIDE1MCAtMTY3IDE3NSAtMjUwIDM4MiAtMjUwIDYyNCAwIDU3IC00IDk2IC0xMCA5NiAtNSAwIC0xMCAxOSAtMTAgNDEgMAo1MSAtMzQgMTIyIC03NSAxNTYgLTE4IDE1IC0zNCA0MiAtNDEgNjcgbC0xMCA0MSAtNyAtNjMgYy05IC04MiAxOCAtMTU3IDcyCi0yMDQgbDM4IC0zMyA2IC0xNDUgYzYgLTEyMyAxMSAtMTU5IDM2IC0yMzUgMTYgLTQ5IDI5IC05MSAyNyAtOTIgLTYgLTYgLTIxMQoyNTUgLTI3NiAzNTIgLTcwIDEwMyAtMTkwIDM0NCAtMTkwIDM3OSAwIDkgNiAxOSAxNCAyMiAyOCAxMSA3MCA4NiA4MiAxNDcgMTQKNjcgMTEgMTg0IC02IDIwMSAtNSA1IC0xMCA3IC0xMCA0IDAgLTQzIC0yNSAtMTE2IC00OSAtMTQ0IC00OCAtNTQgLTcyIC0xMTkKLTY2IC0xNzggNSAtNTAgNSAtNTEgLTggLTE3IC0yNiA2NyAtNzAgMTA2IC0xNDcgMTMxIC00MCAxMyAtNzcgMzIgLTg1IDQzCi0yOCA0MSAtMjkgNSAtMSAtNDYgNjMgLTExNSA5OCAtMTQ1IDE5MCAtMTY2IDUxIC0xMSA1NCAtMTQgNjYgLTU0IDI0IC04MAoxMjQgLTI4NiAxNzUgLTM1NyAxNyAtMjUgNDkgLTcwIDcwIC0xMDAgMjEgLTMwIDY5IC05MiAxMDYgLTEzNyA3NSAtODggODUKLTEwOCA0MCAtNzEgLTI5IDIzIC0xMDAgNjggLTI1MSAxNTkgLTEwMSA2MSAtMjEwIDEzNyAtMjEwIDE0NyAwIDQgMTAgOCAyMiA5CjMyIDMgNzggNTQgODggOTkgMTAgNDEgNCA1NCAtMjYgNTggLTEzIDIgLTI0IDIyIC0zOSA3MiAtMjQgODAgLTM2IDg2IC05NCA1MAotNDkgLTMxIC00NSAtMzEgLTgwIC01IC0zMCAyMiAtMTczIDU4IC0yMDQgNTEgLTI0IC01IC0xOCAtMzkgMjQgLTE2MyAxNiAtNDgKMjkgLTkyIDI5IC05OCAwIC03IC0xOSAtNDAgLTQxIC03MyAtNDggLTcwIC00OSAtNjggNTIgLTExNSA0OSAtMjMgNjAgLTMzIDgzCi03OSAxNCAtMzAgMzAgLTU0IDM1IC01NCAyMSAwIDkyIDEwMSAxMDcgMTUxIDEyIDQwIDE4IDQ5IDI1IDM3IDE0IC0yNiAxNDYKLTEyMSAyNjkgLTE5NCAyNjEgLTE1NSA0OTcgLTM4MCA2NTIgLTYyMCA4MCAtMTI1IDE2MyAtMzIzIDE5NyAtNDc0IDY1IC0yODMKODIgLTQyOSAyNiAtMjE4IC0xOSA3MCAtNDAgMTQyIC00OSAxNjAgLTggMTggLTIwIDUxIC0yNyA3MyAtMTUgNTEgLTEwOCAyMzgKLTE1NSAzMTIgLTI0MiAzODMgLTU2MiA2MDEgLTk4NCA2NzIgLTE4NyAzMSAtMjMyIDM0IC0yNTUgMTcgLTIwIC0xNCAtMjAgLTE1CjUgLTQxIDM4IC00MSA1MCAtNDUgMjA4IC03MSAxODAgLTI5IDI0NyAtNDggMzgyIC0xMTAgOTMgLTQyIDIxMCAtMTEwIDIxMAotMTIxIDAgLTIgLTUgLTEgLTExIDIgLTI1IDE2IC04MiA1IC0xNDggLTMwIC00MCAtMjEgLTczIC0zNiAtNzQgLTM0IC0yIDIKLTExIDIzIC0yMSA0NiAtNDQgMTAwIC0xNDQgMTYzIC0yNjMgMTYzIC01OSAwIC03NiAtMjAgLTcxIC04NSBsNCAtNTIgLTUzCi0zNCBjLTMwIC0xOSAtODQgLTU4IC0xMjEgLTg4IC0zNyAtMzAgLTY5IC01NiAtNzEgLTU4IC05IC02IDU1IC02NiAxMDkgLTEwMgozMCAtMjEgODIgLTUwIDExNSAtNjYgMzMgLTE1IDYxIC0yOSA2MyAtMzAgMiAtMSAtNyAtMjMgLTE5IC00OSAtMTMgLTI1IC0yMAotNDkgLTE2IC01MiA0IC00IDM5IDYgNzkgMjEgNTQgMjEgNzMgMjUgNzYgMTYgMTUgLTQ2IDE2MyAtMjMxIDE4NCAtMjMxIDEyIDAKNjggNjQgNjggNzggMCA2IDQgMTIgOSAxMiAxMCAwIDgzIDEzOSA5MyAxNzYgNCAxNSAxNyAyNCAzOSAyOSA1MiAxMiAxMzkgNTIKMTQ1IDY5IDggMjEgLTMzIDk1IC04MCAxNDQgLTUyIDU0IC0xMjIgNzggLTE4NyA2MyAtNjggLTE2IC02OCAtMTMgNyAyNSA2MQozMSA3NSAzNSAxMjYgMzEgNzUgLTYgMTIxIC00MCAyMzUgLTE3MSAxOTcgLTIyNyAzMzQgLTQ4OCA0MTcgLTc5NiAyNyAtMTAxCjM0IC0xNTcgMTQgLTExMCAtMTM0IDMwMyAtMjk0IDQ4OCAtNTMzIDYxNCAtNDggMjUgLTk1IDM0IC05NSAxOSAwIC0xNCAxNQotMjggNjUgLTY1IDEzOSAtMTAwIDMxNiAtMzMxIDQxMCAtNTMzIDEwMiAtMjE4IDE0NyAtMzk5IDE2MCAtNjUwIDYgLTEwNCA0Ci0xMzMgLTE1IC0yMTUgLTQwIC0xNzUgLTEyNyAtNDI4IC0yMDcgLTYwMCAtNDUgLTk5IC0xMTggLTIzOSAtMTIxIC0yMzUgLTIgMgo1IDQ4IDE3IDEwMiA1MCAyMzYgNTUgNTYzIDkgNTk3IC05IDcgLTIyIDMyIC0yOSA1NiAtMTcgNjIgLTUyIDEwNiAtMTAyIDEyOQotNTEgMjMgLTEwNCA3MyAtMTI0IDExNSBsLTE0IDMxIDYgLTQ0IGM2IC00MyA1OCAtMTU5IDk1IC0yMTEgMTEgLTE1IDM5IC0zOAo2NSAtNTEgMjUgLTEzIDQ1IC0yNyA0NSAtMzEgMCAtNSA4IC04IDE5IC04IDE2IDAgMTkgLTEzIDI1IC0xMzcgNiAtMTI5IDIKLTI1NiAtMTEgLTMxMyAtNCAtMTkgLTEwIC04IC0yMyA1MCAtMTAgNDEgLTI2IDkzIC0zNSAxMTUgLTIxIDUxIC03NiAxMzQKLTEwNSAxNjAgLTEzIDExIC0zMyA0MyAtNDUgNzEgLTQ2IDEwMSAtMTAwIDE0NCAtMTgzIDE0NCAtMjYgMCAtNTMgNSAtNjAgMTIKLTMzIDMzIC0yMSAtNDYgMTcgLTEwOCAxOSAtMzIgNjQgLTU4IDExNiAtNjkgMjggLTYgMjggLTUgLTggMTUgLTQ3IDI2IC00NAozMyA2IDE5IDExMSAtMzAgMjI2IC0xODcgMjYyIC0zNTYgMTcgLTgxIDE5IC0yNDIgNCAtMjk4IC0zMyAtMTIwIC0xMDYgLTI4MAotMTkyIC00MjIgLTEwOSAtMTc4IC0zMzAgLTQ1MSAtNDMyIC01MzMgLTIyIC0xNyAtMTggLTkgMTkgNDUgNDcgNjggMTI2IDIxNAoxNTQgMjg1IDU2IDE0MyA3MiAyNTcgNzIgNTIzIDAgNCAxMSAwIDI1IC05IDE2IC0xMCA0OCAtMTcgODcgLTE3IDU4IC0xIDY4IDIKMTIwIDM4IDMyIDIyIDYwIDQ4IDY0IDU4IDQgMTMgLTUgMzQgLTI2IDYzIC0yOCA0MCAtMzAgNDggLTIxIDc3IDE2IDQ5IDQwCjIwOSAzMyAyMjUgLTQgMTIgLTE5IDEzIC03NiA4IC0zOSAtMyAtODAgLTggLTkyIC0xMiAtMTcgLTQgLTI3IDYgLTU5IDU4IC0zNwo2MCAtMTc5IDIyMCAtMjAwIDIyNiAtMjIgNiAtMTM0IC0yODEgLTEzNSAtMzQ2IDAgLTIyIC02IC0zNCAtMTcgLTM4IC0zOCAtMTIKLTE2MCAtNzUgLTE4NyAtOTggbC0zMCAtMjMgMjUgLTMyIGM0NSAtNjEgMTIxIC0xNDAgMTM4IC0xNDYgMTUgLTUgMTcgLTE2IDEzCi04NSBsLTUgLTgwIDYyIDAgYzEwNSAwIDE0OCAxNiAxODkgNzEgMjEgMjYgNDAgNDggNDUgNDggMTMgMSA4IC0xNzEgLTggLTI1NAotNDUgLTIzOSAtMTc3IC01MTEgLTMyNyAtNjc3IC01NiAtNjIgLTIwOSAtMjEzIC0yMjAgLTIxNyAtNiAtMiA4IDIxIDMwIDUwCjg5IDExOSAxNDIgMjgyIDE0MiA0MzIgLTEgMTUzIC0yOSAyMDYgLTEyNCAyMjcgLTMyIDggLTY0IDI0IC04NSA0NCAtMzMgMzAKLTMzIDMwIC0yNiA2IDExIC0zOCA3NSAtMTI5IDEwMiAtMTQ3IDEzIC04IDQwIC0yMSA2MCAtMjggNDggLTE3IDU3IC00NiA0MgotMTQ1IC0yMSAtMTQ5IC02MiAtMjY0IC0xMjQgLTM1MCAtMzIgLTQ0IC0xMzggLTE2MCAtMTQ2IC0xNjAgLTMgMCA1IDIyIDE4CjQ5IDMyIDY4IDQwIDE3NSAxOSAyNjQgLTkgMzggLTE2IDcwIC0xNiA3MiAwIDIgMTUgMSAzMyAtMiAzMCAtNSAzNyAtMSA3NiA0NgozNSA0MiA0MCA1MyAzMSA3MCAtNSAxMSAtMTggMjQgLTI3IDI5IC05IDYgLTIzIDM4IC0zMiA3MyAtMTUgNTggLTE4IDY0IC00MQo2MyAtMTQgLTEgLTM5IC03IC01NyAtMTUgLTI5IC0xMiAtMzMgLTExIC02NyAxOSAtNDYgNDAgLTE2MCA5NyAtMTgwIDg5IC0xMwotNSAtMTUgLTE4IC0xMCAtNjkgMyAtMzUgMTAgLTgzIDE1IC0xMDcgMTAgLTQ0IDEwIC00NSAtMzEgLTg0IC00MyAtNDMgLTQ3Ci02NSAtMTUgLTgyIDQzIC0yMiA4NSAtNTcgNzkgLTY2IC0zIC02IC0zIC0yNiAwIC00NSA3IC0zMyA4IC0zNCA1NCAtMzQgNjEgMAoxMDggMjggMTE3IDY5IDE3IDc5IDQwIDMgNDAgLTEzNCAwIC04MyAtMyAtOTYgLTM0IC0xNTkgLTE4IC0zOCAtNTAgLTg0IC02OQotMTAzIC00MCAtMzkgLTE0OCAtMTE0IC0yMzMgLTE2MiAtNDkgLTI3IC0yNDMgLTExMSAtMjU4IC0xMTEgLTMgMCAxMCAxMSAyOQoyNCAxNTIgMTAzIDI0MSAzNjkgMTQ1IDQzMiAtMzAgMTkgLTQ4IDE0IC03MSAtMjEgLTIyIC0zNCAtMTAgLTQ1IDE2IC0xNCBsMjAKMjQgMjAgLTI0IGM1MSAtNTkgMSAtMjA5IC0xMDIgLTMxMCAtMTE1IC0xMTEgLTIwNSAtMTY1IC0zOTAgLTIzMiAtMTY2IC02MAotMTU4IC01OSAtMTE1IC02IDQ4IDU5IDkyIDE1NSAxMDggMjM4IDcgMzUgMTQgNjYgMTUgNjggMiAyIDE3IC03IDM1IC0xOSA2MAotNDQgMTYwIC0zNyAyMjQgMTQgbDMwIDI0IC0yMyA0NyAtMjMgNDggMjUgMzYgYzE0IDIwIDM1IDYyIDQ3IDk1IDE4IDQ4IDE5CjYwIDggNjcgLTIwIDEyIC0xMDQgMjkgLTE0MyAyOSAtMzIgMCAtMzMgMSAtNDMgNTcgLTEzIDY1IC03MSAyMjMgLTgyIDIyMyAtOQowIC0xNDcgLTE0MiAtMTc3IC0xODIgbC0yMSAtMjcgLTYyIDIwIGMtODUgMjYgLTExNyAyNSAtMTI1IC00IC0xMCAtMzcgLTYKLTEwOSA4IC0xNjIgbDE0IC01MCAtNTYgLTUxIC01NSAtNTAgMTkgLTMzIGMzOSAtNjcgMTc3IC0xMzAgMjUyIC0xMTYgMjEgMwo1MiAxNSA3MSAyNiBsMzMgMjAgLTcgLTQ4IGMtOCAtNjEgLTczIC0xOTYgLTExOSAtMjQ5IC02MyAtNzMgLTExNCAtMTAwIC0zODIKLTE5OCAtNjYgLTI0IC0xNzcgLTcxIC0yNDcgLTEwNCAtNzAgLTMzIC0xMjcgLTU4IC0xMjcgLTU0IDAgOSA1MSA4NCA3OSAxMTYKMTUgMTUgNjkgNjAgMTIxIDk5IDUyIDM5IDEwMyA3OSAxMTMgOTAgNDggNTUgNjkgMjI2IDUxIDQwNiAtOCA3NCAtMjIgNzggLTU4CjE3IC0xNCAtMjUgLTYwIC03MiAtMTAxIC0xMDYgLTEzOSAtMTE0IC0xNTcgLTE1MSAtMTY1IC0zNDAgbC02IC0xNDUgLTM4IC02MApjLTQ1IC03MCAtMTE3IC0xNDggLTE2NiAtMTgwIC0zMyAtMjEgLTQ2IC0zMSAtMTIzIC05NiBsLTMxIC0yNiAtODMgNTkgYy00OAozNSAtODcgNTcgLTk0IDUyIC03IC00IC05IC0zIC01IDQgMyA2IC0xMiAyNSAtMzUgNDQgLTQxIDMzIC0xMTIgMTI1IC0xNDMKMTg1IC0xMiAyNCAtMTcgNjYgLTE5IDE2MCAtMyAxNzggLTIxIDIxMSAtMTkzIDM2NCAtMjIgMjAgLTU0IDU3IC03MCA4MiAtMTYKMjUgLTM0IDQ2IC00MSA0NyAtMTQgMCAtMjcgLTE2MSAtMjEgLTI3MyA2IC0xMDggNDUgLTE5NyAxMTMgLTI1MyAyNiAtMjEgNzEKLTYwIDEwMCAtODUgMjkgLTI2IDU5IC01MSA2NyAtNTUgNyAtNSAyMSAtMjAgMzAgLTM0IDEwIC0xNCAyNyAtMzcgMzggLTUyCmwyMSAtMjYgLTQxIDE5IGMtMTI4IDYyIC0yMTMgOTggLTM3MyAxNTkgLTIwMCA3NyAtMjkwIDEyOSAtMzUwIDIwNSAtNTIgNjYKLTk0IDE1OSAtMTAyIDIzMiBsLTggNTggMjYgLTIzIGMzNiAtMzQgMTI3IC00MSAxOTggLTE2IDUwIDE4IDE0OSA5OSAxNDkgMTIyCjAgNSAtMjUgMjggLTU1IDUxIC01NyA0MyAtNjMgNTggLTQ0IDEwOCAxMCAyOCAxNSAxNzAgNiAxNzkgLTggOCAtMTE3IC0xNAotMTUwIC0zMSAtMTcgLTggLTMxIC0xNCAtMzIgLTEzIC0xMCAyMiAtOTcgMTI2IC0xMzkgMTY3IC02MiA2MSAtODEgNjIgLTkyIDQKLTQgLTIwIC0xNSAtNTUgLTI1IC03OCAtMTAgLTIyIC0yMSAtNjQgLTI1IC05MyAtNCAtMzAgLTEyIC01NSAtMTggLTU3IC02IC0xCi00NSAtOCAtODYgLTE0IC00MSAtNyAtNzkgLTE2IC04NCAtMjEgLTExIC0xMSAyNSAtMTEwIDYwIC0xNjIgbDI0IC0zOCAtMjYKLTQxIGMtMTQgLTIyIC0yMyAtNDcgLTIwIC01NSA5IC0yNCAxMDIgLTY0IDE1MiAtNjQgNDYgMCAxMTQgMjQgMTE0IDQxIDAgNSA2CjkgMTQgOSA5IDAgMTYgLTE5IDIxIC01NyA0IC0zMiAxNSAtNzggMjQgLTEwMyAyMSAtNTUgODIgLTE0NiAxMTkgLTE3OSAyMQotMTggMjIgLTIyIDcgLTE2IC0xMSA0IC03MiAyNSAtMTM1IDQ3IC0yODggMTAwIC00NzYgMjQ3IC01MjYgNDE0IC0xNSA1MCAtMTAKMTEyIDExIDE0MSAxMyAxNyAxNSAxNyAzOSAtNiAzMSAtMzAgNDUgLTIxIDIyIDE0IC0xMSAxNyAtMjUgMjUgLTQ2IDI1IC0yNCAwCi0zMyAtNyAtNTAgLTQwIC0xMSAtMjEgLTIwIC01NCAtMjAgLTczIDAgLTEwNyA5MiAtMjU2IDIxOCAtMzUzIDIxIC0xNyAtMTAyCjM3IC0yMjUgOTkgLTEwNSA1MyAtMTI1IDcwIC0xODEgMTUzIC05NiAxNDEgLTEyMCAyNDEgLTg3IDM3MiAxNSA2MyAxNSA3MiAxCjEwNiAtMjAgNDcgLTUxIDQ2IC03OSAtMSAtMjQgLTQyIC0yNyAtMTY4IC00IC0xOTAgMTMgLTEzIDE1IC02IDE0IDYzIC0xIDkxCjE1IDE0MyAzOCAxMjQgMTUgLTEyIDExIC01NyAtNyAtOTQgLTYgLTEwIC0xNCAtNDUgLTE4IC03NyAtMTAgLTY3IDEwIC0xNDAKNjkgLTI1NyA0MCAtODAgMjQgLTczIC04MCAzNSAtMTY2IDE3MiAtMjI0IDMwMSAtMjMwIDUxMyBsLTMgOTUgMzQgNiBjNjcgMTEKOTggMzkgMTUxIDEzNiAzNiA2NyAzNCA5MSAtMyA1MSAtMTMgLTE0IC00MyAtMzMgLTY4IC00MyAtODAgLTMxIC05MCAtMzgKLTExMiAtNzYgbC0yMyAtMzkgLTEgNTQgYzAgNDQgLTcgNjUgLTM3IDExNCAtMjUgNDAgLTM3IDcyIC0zNyA5NiAwIDYyIC0xNwozOSAtMjkgLTM5IC02IC00MiAtMTEgLTg2IC0xMSAtOTggMSAtNTEgNjggLTE1NCA5NSAtMTQ0IDkgNCAxMSAtMTUgNyAtODYgLTgKLTE2MiA0NSAtMzM4IDEzOCAtNDU2IDIyIC0yOCAzOCAtNTEgMzUgLTUxIC0xNCAwIC0xMjUgOTggLTE4MSAxNjAgLTcyIDc5Ci0xODIgMjQzIC0yMzYgMzUxIC05OCAxOTYgLTE0NyAzOTAgLTE0OCA1ODYgbDAgOTMgNTMgLTU0IGM0NSAtNDYgNjAgLTU2IDEwOQotNjYgMzIgLTYgNzQgLTEwIDk1IC04IGwzOCAzIDAgNzggYzAgNzMgMSA3OCAyOCA5NiAzMiAyMSAxMjQgMTI1IDE0MCAxNTkgMTMKMjkgMTMgMjkgLTExMCA5MiBsLTEwMiA1MiAtMTEgNTcgYy05IDQ1IC0xMTEgMzA1IC0xMjYgMzIwIC0xMCAxMSAtMTc0IC0xNjcKLTIwOCAtMjI3IGwtNDAgLTY3IC03MiAxNCBjLTQwIDcgLTg0IDExIC05OCA3IC0yMyAtNiAtMjYgLTExIC0yNiAtNDkgMCAtNDQKMTkgLTEzMSA0MSAtMTgzIDEyIC0zMCAxMCAtMzQgLTI0IC03NiAtMjAgLTI1IC0zNyAtNTAgLTM3IC01NSAwIC0xNCA2MiAtNjkKMTAzIC04OSA0NyAtMjUgMTQwIC0yMyAxNzYgNCBsMjggMjEgMSAtMTM0IGMxIC0xNzUgMjEgLTI4MyA4MSAtNDQxIDYwIC0xNTkKMTAyIC0yMzggMTk1IC0zNjIgMjEgLTI5IDM3IC01NSAzNCAtNTcgLTkgLTkgLTI3NCAyNzAgLTMzMyAzNTAgLTMyIDQ0IC02Mgo4MiAtNjUgODUgLTEzIDEwIC0xMjggMTc4IC0xNzIgMjUyIC0xMTUgMTg5IC0xODEgNDQ4IC0xNTcgNjE1IDE1IDEwNCAyNyAxNDEKNzYgMjMzIDY3IDEyNiAxNjYgMjExIDI0MyAyMDkgbDM1IC0xIC0zMCAtMTQgLTMwIC0xNSAyOSA2IGM2NSAxNCAxMTEgNzEgMTIzCjE1MyBsNSAzNyAtMTcgLTI0IGMtMTYgLTIwIC0yMyAtMjMgLTYyIC0xNyAtODEgMTEgLTEzNiAtMzAgLTE5MiAtMTQxIC0xOAotMzQgLTM1IC02MyAtMzkgLTY1IC0xNiAtNyAtOTEgLTEwNiAtMTE1IC0xNTMgLTMyIC02MiAtNjcgLTE4NyAtNjggLTI0NiBsLTEKLTQ0IC04IDM1IGMtMjMgOTggLTI5IDIyMCAtMTkgMzUzIDUgNzUgOSAxNDQgNyAxNTMgLTIgMTEgOSAyMSAzNSAzMCA2NiAyMwoxMTcgNzIgMTQ5IDE0MSAxNSAzNCAyOCA3MSAyOCA4MiAwIDExIDYgMjQgMTMgMjggMTUgOSAzMCA1MyAxNyA1MyAtNCAwIC0yMAotMTggLTM1IC00MSAtMTcgLTI0IC01NSAtNTYgLTk1IC04MCAtNzQgLTQ0IC0xMjUgLTEwNyAtMTE2IC0xNDQgNCAtMTUgLTIKLTI5IC0xOSAtNDUgbC0yNCAtMjMgMiAtMjIxIGMzIC0xOTcgNiAtMjM1IDMxIC0zNDkgMTUgLTcwIDM2IC0xNDggNDYgLTE3MwozNSAtODEgMTIgLTQ2IC02MyA5OCAtODggMTY3IC0xNjggMzQxIC0yMDkgNDUzIC04NyAyMzYgLTkwIDI0NyAtOTYgMzYwIC0yNAo0MDIgOTAgNzY4IDM0NSAxMTA2IDEwNiAxNDIgMTczIDIxMSAyOTAgMzAxIDU3IDQ0IDEwMyA4NCAxMDMgOTAgMCAzMyAtMTc4Ci00OSAtMjg3IC0xMzEgLTczIC01NSAtMTgwIC0xNTggLTIzNiAtMjI2IC0zNSAtNDQgLTc1IC0xMDkgLTEzMCAtMjEwIC01NAotMTAyIC01MyAtODkgOCA3NiA2NyAxNzkgMTgwIDM5NiAyNjkgNTE0IDEzNyAxODEgMjM4IDI5MiAzMTYgMzQ5IDI1IDE4IDcxCjQxIDEwMiA1MSA1MiAxNyA2NCAxOCAxMjAgNiA1NyAtMTIgMTQzIC00NSAxNTIgLTYwIDIgLTMgLTMwIC02IC03MiAtNiAtNjcgMAotODMgLTQgLTExOSAtMjggLTIzIC0xNSAtNTAgLTM5IC02MCAtNTQgLTEwIC0xNiAtMjAgLTMwIC0yMyAtMzMgLTEwIC0xMCAtMzAKLTYxIC0zMCAtNzkgMCAtMTkgNDYgLTQ1IDEyOSAtNzEgNDYgLTE0IDU1IC0yMiA2NiAtNTEgMjAgLTU4IDc4IC0xNjMgMTE5Ci0yMTkgbDQwIC01MyA2OCA3NCBjMzggNDEgODAgOTUgOTMgMTIxIDE0IDI2IDI5IDQ5IDM1IDUzIDExIDcgNjQgLTcgMTE3IC0zMQoxNyAtOCAzNCAtMTQgMzcgLTE0IDEyIDAgLTcgNTQgLTI2IDc0IC0yMSAyMyAtMTkgMjYgNTEgNTUgNTQgMjMgMTYzIDkwIDIxNQoxMzQgMTggMTUgMjYgMjggMjIgMzYgLTE0IDIyIC0xNTAgMTI1IC0xOTkgMTUxIGwtNDcgMjUgMCA3MSBjMCA4MCA3IDc0IC05Ngo3NiAtMTEzIDEgLTIzMCAtODAgLTI1NiAtMTc5IGwtMTIgLTQxIC00NCAzMyBjLTUzIDQxIC0xMzEgNjkgLTE5NCA2OSAtMjcgMAotNDggMSAtNDggMiAwIDEgMjQgMTUgNTMgMzIgMTU0IDg3IDMzOSAxNDEgNTY3IDE2NyA4MCA5IDE4MCAyNSAyMjMgMzYgMTMyCjMzIDI1NyAxMDYgMjU3IDE1MCAwIDE2IC03IDE1IC02NyAtMTAgLTc0IC0zMCAtMTMyIC00MSAtMzg4IC03MiAtMTg3IC0yMgotMjYwIC0zNyAtMzgwIC03NSAtMjY1IC04NSAtNDkwIC0yNTAgLTY5OCAtNTExIC00NSAtNTcgLTg5IC0xMTYgLTk3IC0xMzEgLTkKLTE1IC0zMSAtNDkgLTQ4IC03NyAtMTIxIC0xODUgLTI0NyAtNTQwIC0yNzQgLTc2NSAtMTMgLTExMiAtMjkgLTE2NSAtMjEgLTcwCjIwIDI0NSAxMjUgNjQ5IDIyMiA4NTUgMTQ0IDMwNSA0MDQgNjAzIDY3NCA3NzIgMjMgMTQgNDQgMjkgNDcgMzMgMyAzIDMyIDIxCjY1IDM5IDkyIDUxIDIyNiAxNDIgMjYyIDE3NyBsMzIgMzIgMTQgLTQ5IGMxNyAtNTggODUgLTE1MSAxMDcgLTE0NyA4IDIgMjYKMjQgNDAgNTAgMjAgMzkgMzUgNTEgOTMgNzkgMzcgMTkgNzMgMzkgNzkgNDYgOCA5IC0xIDMxIC0zMSA4MCBsLTQyIDY2IDI1IDU2CmMyMiA1MCA1NiAxNjQgNTYgMTg4IDAgNiAtMTAgMTQgLTIyIDIwIC0yMSA5IC0xOCAxMiAzOSA0MiA3NiAzOCA5MCAzOCAxNTYgNAo0OSAtMjYgNTkgLTI4IDE3MCAtMjcgNzIgMSAxMjMgNiAxMzAgMTMgOCA4IDcgMTEgLTUgMTEgLTggMCAtNTEgMTggLTk0IDQwCi05OSA1MCAtMTI5IDU2IC0xOTMgMzcgLTYwIC0xNyAtNjYgLTEwIC0xNSAxOCA0NiAyNCA5MyA3OSAxMzMgMTU1IDM4IDcwIDEwNwoxMzQgMjE2IDE5OSAxMzUgODAgMzQxIDE2OSA0MjkgMTg1IDY4IDEzIDE5NyA3IDI0OSAtMTAgbDUwIC0xNyAtMzIgLTI2IGMtMjAKLTE3IC0zNyAtNDMgLTQ2IC03NSAtMjQgLTc3IC0yMSAtODYgMjMgLTg2IDM1IDAgNDEgLTQgNzEgLTUwIDE4IC0yOCA0MSAtNTUKNTIgLTYwIDE2IC05IDIyIC01IDM5IDIyIDExIDE4IDIwIDM4IDIwIDQ1IDAgMjMgMjIgMjUgMTExIDcgOTYgLTE4IDEyMCAtMTMKMTAxIDIyIC0xNSAyOCAtMzggODIgLTYyIDE0NiBsLTIxIDU3IDM2IDQ3IGMyMiAyOCAzMiA1MSAyNyA1NiAtMTEgMTEgLTEwOQozOCAtMTM5IDM4IC0xOCAwIC0yMyA2IC0yMyAyNSAwIDMyIC0xOCAzMiAtNjIgLTIgLTQyIC0zMyAtNzggLTg1IC03OCAtMTEzIDAKLTI0IDUgLTI0IC02NSAwIC0zOSAxMyAtODQgMjAgLTEzOCAyMCBsLTc5IDAgNTggMzAgYzMxIDE3IDc4IDQ2IDEwNCA2NSA1OAo0MyAxNjEgMTUyIDE5NyAyMDggOTUgMTQ5IDE0MiAyMTcgMTc3IDI1NCA4MSA4OCAyMjEgMTA4IDM0MSA0OCBsNjAgLTMwIC01NQotNiBjLTc1IC04IC0xMzIgLTQwIC0xODAgLTEwMCAtMjIgLTI4IC00MCAtNTQgLTQwIC01NyAwIC04IDU3IC00OCA4MSAtNTcgMTIKLTUgMTggLTI2IDIyIC05MSA3IC05OCAyMyAtMTQwIDUyIC0xMzYgMTEgMiA1NSAyMSA5NyA0MiBsNzcgNDAgNjQgLTQ1IGM2NAotNDUgMjAxIC0xMTUgMjI0IC0xMTUgNyAwIDE1IDEwIDE4IDIzIDkgMzUgMTEgMjI4IDMgMjY3IC03IDM0IC02IDM2IDU4IDc5CjM1IDI0IDY5IDUyIDc1IDYzIDE0IDI2IC00IDQ1IC05NCAxMDUgbC02OSA0NiA1IDQzIGM1IDQ3IDYgNDYgLTYwIDU5IC03OSAxNgotMjAzIC01NiAtMjE4IC0xMjUgbC03IC0zMCAtMzYgMzAgYy02MiA0OSAtMTI5IDczIC0yMTkgNzggbC04MiA0IDQ3IDM3IGM5Ngo3NiAyNjIgMTQ3IDQwNyAxNzcgMTAyIDIwIDM2MCAzMCAzOTggMTUgbDI4IC0xMSAtMjAgLTI4IGMtMTQgLTIwIC0yMCAtNDgKLTIzIC05NCAtMSAtMzcgMCAtNzAgNCAtNzMgNCAtNCAyMCAwIDM2IDggMzAgMTQgMzEgMTQgNzQgLTMwIDIzIC0yNCA1OCAtNTMKNzYgLTYzIGwzMyAtMjAgOCAyMyBjNSAxMyAxNCA0MSAyMSA2MyAxMSAzNyAxNiA0MiA2MCA1MyA0OSAxMyAxNTYgNTQgMTY2IDY0CjYgNiAtNTYgNzggLTEwOSAxMjYgLTQ1IDQxIC01MCA1NiAtMzYgMTE3IDggMzcgOSA1OCAyIDY1IC05IDkgLTUzIDIgLTEzMwotMjEgLTIwIC02IC0zMCAtMiAtNDcgMTkgbC0yMyAyNiAtMzUgLTM3IGMtMzIgLTM1IC0zNSAtNDIgLTM1IC0xMDIgbDAgLTY0Ci00MiAxNSBjLTYxIDIxIC0zMTkgMjEgLTQxMyAwIC05MiAtMjEgLTIwNCAtNjEgLTI4NCAtMTA0IC0zNSAtMTggLTY2IC0zMgotNjggLTI5IC0yIDIgNSAzMSAxNyA2NSAxMSAzMyAyMCA2OSAyMCA3OSAwIDI4IDExIDM0IDMyIDE2IDE0IC0xMyAyOSAtMTUgNjgKLTExIDY3IDggNzMgMTMgNjYgNTIgLTQgMjAgLTIgMzYgNSA0MCAxMyA5IDUwIDkyIDU0IDEyMyAyIDIxIC0xIDIyIC01NyAyMgpsLTU5IDAgLTIxIDQ4IGMtMjcgNjMgLTcxIDEzMiAtODMgMTMyIC01IDAgLTE3IC0xMSAtMjUgLTI0eiBtNDEgLTQ4IGM3IC0xMwoyMiAtNTAgMzMgLTgzIGwyMSAtNjAgNTggMyBjMzEgMiA1NyAyIDU3IC0xIDAgLTMgLTE2IC0zMyAtMzUgLTY2IC0yNiAtNDQKLTM0IC02NyAtMjkgLTg2IDYgLTI0IDQgLTI1IC0yNyAtMTkgLTQzIDcgLTg5IDI0IC04OSAzMyAwIDQgMTcgNiAzOCA0IDMxIC0zCjM0IC0yIDE1IDcgLTM0IDE0IC0yOCAyNSAyMiA0NCAyNSAxMCA0NSAyMiA0NSAyNyAwIDE0IC02MiAtMiAtOTMgLTI0IGwtMjkKLTIwIDIgNDkgYzMgOTEgMCAxMzQgLTEwIDEzNCAtNSAwIC04IC0xOSAtNiAtNDIgMiAtMjQgMiAtMzUgLTEgLTI1IC0xMCA0MAotMjIgMSAtMTYgLTU1IDYgLTU5IDYgLTYwIC0xNSAtNDkgLTExIDYgLTI0IDE2IC0yNyAyMSAtOSAxNSAtNjggNDQgLTY0IDMxIDIKLTUgMTkgLTIwIDM4IC0zMyA0NyAtMzIgNTAgLTQ4IDkgLTQ5IGwtMzMgLTEgMzMgLTggYzE4IC00IDM2IC0xMCAzOSAtMTMgMTAKLTExIC00NyAtMTkgLTgyIC0xMyAtMzYgNyAtNDIgMTUgLTI1IDMyIDYgNiAxIDI3IC0xNSA1OCAtMzQgNjYgLTMzIDgzIDUgODQKMTYgMCAzMiAtNCAzNSAtOSAxMyAtMjAgMzIgLTcgNTQgMzcgMjAgNDMgNjkgMTE0IDc3IDExNCAyIDAgOSAtMTAgMTUgLTIyegptODM4IC0yNDUgYzkgLTE2IDEyIC0xNiA2MyAwIDMwIDkgNjQgMTcgNzUgMTcgMjEgMCAyMSAtMSA0IC01NyBsLTE4IC01OCA3OQotNzQgNzkgLTc0IC01MSAtMTggYy0yOCAtMTAgLTcxIC0yMSAtOTUgLTI1IC01MSAtNyAtNjAgLTE2IC02OSAtNjYgLTQgLTIxCi0xMiAtNDAgLTE3IC00NCAtNiAtMyAtMzcgMTkgLTY5IDUxIC0zNSAzNSAtNjAgNTMgLTY0IDQ2IC00IC02IC0xNCAtMTEgLTIyCi0xMSAtMjcgMCAtMTcgNzEgMTYgMTEwIDMxIDM2IDM3IDMxIDIwIC0xNiAtMTUgLTM5IC00IC00MiAxNSAtNCBsMTcgMzIgMjgKLTgyIGMzOCAtMTA5IDU0IC0xMjAgMjMgLTE1IC01IDE4IC00IDE5IDEzIDUgMTQgLTExIDExIC0zIC05IDMyIC0xNSAyNiAtMjcKNTIgLTI3IDU4IDAgMTUgMzcgNCA3MSAtMjAgMTcgLTEyIDMwIC0xNSAzNiAtOSA2IDYgMjUgNCA1MyAtNiAzMCAtMTAgNDcgLTEyCjU0IC01IDcgNyA1IDEwIC00IDEwIC04IDAgLTM3IDExIC02NSAyNCAtMzkgMTkgLTQ1IDI1IC0yNiAyNSA1MyAyIDUgMTYgLTU0CjE2IC02OSAxIC05MSAxMCAtNjEgMjcgMjEgMTIgMTA2IDk0IDEwNiAxMDIgMCAxNyAtMjQgMSAtNjUgLTQxIC00NCAtNDcgLTQ1Ci00NyAtNDUgLTIwIDAgMTUgLTQgMjcgLTEwIDI3IC01IDAgLTEwIC0xMCAtMTAgLTIyIDAgLTEzIC00IC0yOSAtOSAtMzYgLTcKLTExIC0xMCAtMTAgLTE1IDMgLTExIDMwIC02IDkwIDEwIDExMyAxOCAyNiAzMCAyOCA0MyA1eiBtLTIxOTIgLTMyMCBjNDQgLTQzCjk2IC0xMDQgMTE2IC0xMzUgbDM2IC01NiA2OCAyMyBjMzcgMTIgOTIgMjYgMTIyIDMwIGw1NCA3IC01IC02NCBjLTMgLTM1IC0xNwotOTIgLTMxIC0xMjcgbC0yNiAtNjQgMzEgLTQ0IGMzMSAtNDIgMzEgLTQzIDEyIC02NCAtNTMgLTU5IC0xNDYgLTc0IC0yMjQKLTM3IGwtNDUgMjEgNjAgOCBjMTMwIDE3IDE0NSAyMSAxNDUgMzAgMCAxMSAtMTEyIDExIC0xNjIgMCAtNDMgLTEwIC00OCAwCi0yMSAzOSAyMyAzMyA0MCA0NyA4OCA3MSAzNCAxNiAzNiAxOSAxMiAxNSBsLTI3IC0zIDIyIDI4IGMxMDEgMTI0IDEwMiAxMjkgNgo0MCBsLTM4IC0zNSAwIDI5IGMtMSAyOCAtMiAyNiAtMTkgLTE1IC05IC0yNSAtMzQgLTY3IC01NCAtOTMgLTM2IC00NyAtMzcKLTQ4IC00NiAtMjUgLTI2IDcyIC0zMyAxMjUgLTIzIDE4OCAxMiA3OCA3IDkxIC05IDI2IC02IC0yNSAtMTUgLTQ4IC0xOCAtNTEKLTQgLTIgLTI3IDUyIC01MSAxMjEgLTIzIDY5IC00NCAxMjMgLTQ2IDEyMSAtNiAtNSAyNCAtMTMwIDQ1IC0xOTEgMTIgLTMzIDIxCi02MSAyMSAtNjMgMCAtMyAtMTggMTAgLTQwIDI3IC01NyA0NSAtNTAgMTcgMTAgLTM4IDQzIC00MCA1MyAtNTcgNzAgLTExNiAxMQotMzggMTggLTcxIDE3IC03MiAtNiAtNiAtMTI0IDU1IC0xMzcgNzEgLTcgOSAtMjMgMjEgLTM0IDI3IC0yMSAxMSAtMjEgMTEgLTIKLTExIDI2IC0yOSAxOCAtMzMgLTQyIC0yMCAtNzkgMTYgLTk1IDYgLTIyIC0xNSAxMDEgLTI4IDk4IC0yNyA3NSAtMzYgLTE1IC03Ci0xMCAtOSAyMiAtOSAyNCAtMSA2MSAtOCA4MyAtMTcgbDQxIC0xNyAtNDEgLTIzIGMtNDggLTI3IC0xMzIgLTk1IC0xMjYgLTEwMQo0IC00IDQ5IDE5IDEyMSA2MiA1OCAzNiA2OSAzMyA0NiAtMTIgLTQyIC04MiAtMTExIC0xMTggLTIwMyAtMTA4IC01NSA3IC01OQo5IC01NCAyOSA0IDExIDkgMzkgMTEgNjEgNSAzNyAyIDQyIC0zOCA3NSAtNTQgNDQgLTEzMSAxMzYgLTEyMyAxNDggNyAxMiAxMTgKNTggMTczIDcyIGw0MiAxMCAwIDc1IGMwIDQyIDUgOTQgMTEgMTE4IDE3IDY3IDUzIDE2NyA2MCAxNjcgNCAwIDQzIC0zNSA4NwotNzd6IG0xNzgwIC0xMDMgbC01IC00MCA3OSAtNTUgYzQzIC0zMSA3OSAtNTkgNzkgLTYzIDAgLTQgLTMyIC0yNyAtNzAgLTUyCi02MiAtNDAgLTcwIC00OCAtNjQgLTcwIDMgLTE0IDggLTc4IDExIC0xNDIgNSAtMTAwIDMgLTExOCAtOSAtMTE4IC0xOCAwCi0xNjkgODkgLTIxOSAxMjkgLTM1IDI4IC0zNiAyOSAtNTkgMTEgLTE0IC0xMCAtNTEgLTMxIC04MiAtNDYgLTc1IC0zNiAtODIKLTI5IC04MSA3OSBsMiA4MyAtNDUgMjMgYy0yNCAxMyAtNDQgMjggLTQ0IDMyIDAgMjEgNTUgNjkgMTAyIDg5IDM2IDE1IDYwIDIwCjg3IDE1IDY3IC0xMSA2MyAtMjEgLTE5IC00NCAtNDQgLTEzIC04MCAtMjcgLTgwIC0zMSAwIC04IDEwOCA2IDE0MyAxOSA0OSAxOQoyMyAtNDYgLTM3IC04OSAtNDAgLTMwIC00MiAtMzkgLTQgLTE5IGwyMSAxMiAtMjAgLTM1IGMtMTEgLTE5IC0yOCAtNDggLTM4Ci02NCAtMTEgLTE5IC0xIC0xMiAzMCAyMSAyNiAyOCA0NSA0MiA0MSAzMyAtMyAtMTAgLTEgLTIwIDMgLTIyIDUgLTMgMTEgMTEKMTUgMzIgMyAyMCAxNiA2MCAyOSA4NyBsMjQgNTAgMzAgLTU0IGMyMCAtMzQgMzQgLTc3IDM5IC0xMTUgbDggLTYxIDYgNTAgNQo1MCA1MCAtODIgYzI3IC00NSA1MSAtODAgNTMgLTc4IDcgNiAtMjUgODEgLTUzIDEyNSAtMjUgNDAgLTIxIDQ5IDE3IDI5IDExCi02IDIyIC04IDI1IC01IDMgMiAtMTggMTkgLTQ2IDM2IC0yOCAxOCAtNjUgNTIgLTgzIDc4IGwtMzEgNDUgNTMgLTYgYzI5IC00CjYwIC0xMyA2OSAtMjAgOSAtOCAyNSAtMTcgMzUgLTIxIDE5IC03IDE5IC02IDEgMTQgLTE4IDIwIC0xOCAyMCA0NCAyMCAzOSAwCjYwIDQgNTYgMTAgLTMgNiAtMjEgMTAgLTM4IDEwIC01MyAwIC03OSAxMCAtNjYgMjYgOCAxMCAxIDkgLTI5IC0zIC0yNyAtMTAKLTUzIC0xMyAtNzcgLTkgbC0zNyA3IDMxIDI2IGMzNSAyOSA4NiA5MyA3NCA5MyAtNSAwIC0zNSAtMjIgLTY4IC00OSAtMzMgLTI3Ci02MSAtNDggLTYzIC00NiAtOSA5IDM1IDg4IDU4IDEwNSAyOCAyMCA4NSAzNyAxMjkgMzkgMjIgMSAyMyAtMiAxOCAtMzl6Cm0tMTE1MSAtMjE1IGMtNjIgLTE3MiAtNjMgLTE3NCAtMTA4IC0yNDIgLTQ0IC02OCAtNjQgLTg2IC0yOCAtMjYgMTIgMjAgNDQKOTggNzIgMTcyIDQ2IDEyMyA5NSAyMjcgMTA0IDIxOSAyIC0yIC0xNiAtNTggLTQwIC0xMjN6IG0zNTkgLTQwNyBjMTcgMSA0OAotNCA3MCAtMTIgbDQwIC0xNCAtMzkgLTM3IGMtMzQgLTMyIC0zOCAtNDAgLTI4IC01NiAzMCAtNDggODUgLTE2OSA4MCAtMTc1Ci0yIC0yIC0zOSA2IC04MiAxNiAtNDMgMTEgLTgyIDIwIC04NiAyMCAtNCAwIC0xNyAtMjMgLTI5IC01MSBsLTIyIC01MSAtNDEKNTkgYy0zNCA1MCAtNDUgNTkgLTY0IDU1IC0xMyAtMiAtMjQgMCAtMjQgNSAwIDI2IDIzIDcwIDQ2IDg2IGwyNSAxOSAtMTYgLTM3CmMtOCAtMjEgLTE1IC00MCAtMTUgLTQ0IDEgLTEyIDQwIDQyIDQwIDU1IDAgOCA1IDE0IDEwIDE0IDYgMCAxMCAtMTggMTAgLTM5CjAgLTIyIDMgLTQ2IDYgLTU1IDUgLTE0IDggLTE0IDIxIDAgMTMgMTMgMTMgMTkgLTEgNTYgLTkgMjIgLTE1IDQyIC0xMyA0NCAyCjIgMjUgLTEyIDUwIC0zMSAyNSAtMTkgNDkgLTM1IDUzIC0zNSA0IDAgMTYgLTcgMjYgLTE3IDEwIC05IDIxIC0xNCAyNCAtMTEKMTIgMTMgLTI0IDUzIC04MSA4OSAtMzMgMjEgLTUyIDM5IC00MyAzOSAyMiAwIDEwOCA0MSAxMDggNTIgMCAxMiAtMjIgOSAtNTAKLTcgLTM2IC0yMCAtNjEgLTE5IC01MyAzIDYgMTUgNCAxNSAtMTUgLTIgbC0yMiAtMTkgMCAzMiBjMCAyNSA5IDQyIDM3IDcwCmwzNyAzNiA2IC0zMCBjNSAtMjYgOSAtMzAgMzUgLTI3eiBtLTEzNTkgLTM4MiBjLTE0IC02MCAtNjkgLTE4NiAtODEgLTE4NiAtMwowIDEgMTIgOSAyOCAyMyA0NSA2MyAxODMgNzIgMjQ3IDkgNTcgOSA1OCAxMiAxOSAyIC0yMyAtNCAtNzEgLTEyIC0xMDh6Cm00NzIxIC0xMDYgYy03IC0zMSAtNDcgLTEwMCAtNTkgLTEwMCAtMTQgMCAtOCAzMiAxMSA1OCAxMCAxNSAyMiAzNyAyNSA1MCAxMQozMyAzMCAyNyAyMyAtOHogbS00NTYxIC0xNyBjLTE1IC0yOSAtNDYgLTYyIC00NiAtNDkgMCAyMSA0OSA5MCA1NyA4MiAzIC0yCi0yIC0xNyAtMTEgLTMzeiBtLTY3NiAtNjUgYzAgLTUgLTUgLTggLTExIC04IC0xMiAwIC0zOSA2MSAtMzkgODcgMSAxNiA0OAotNjEgNTAgLTc5eiBtMTk4IDEwIGMtNSAtMTMgLTc1IC01OCAtOTIgLTU4IC01IDAgMTEgMTYgMzUgMzUgNDYgMzcgNjMgNDMgNTcKMjN6IG00ODMwIC0xOCBjMTcgLTExIDMyIC0yMiAzMiAtMjUgMCAtMTIgLTI5IC0zIC02MCAyMCAtNDAgMzAgLTE5IDM0IDI4IDV6Cm0tNDk4OCAtOTAgYzAgLTUgLTUgLTEwIC0xMSAtMTAgLTUgMCAtNyA1IC00IDEwIDMgNiA4IDEwIDExIDEwIDIgMCA0IC00IDQKLTEweiBtNzI2IC0xNSBjMTggLTE0IDE4IC0xNCAtNiAtMTQgLTE0IDAgLTQxIDcgLTYwIDE0IGwtMzUgMTMgNDEgMSBjMjIgMQo0OSAtNiA2MCAtMTR6IG0tMTEwNyAtMTM2IGMtMTYgLTI3IC0yNSAtMzYgLTI3IC0yNSAtNCAxNyAzNyA4MSA0NSA3MiAzIC0yCi02IC0yNCAtMTggLTQ3eiBtNTg4MSAtMTAgYzExIC0yMSAxNiAtMzkgMTAgLTM5IC0xMiAwIC0zNSAzNiAtNDUgNjkgLTExIDM2CjExIDE3IDM1IC0zMHogbS01MTM1IDkgYy0zIC0xMyAtMjIgLTY1IC00MiAtMTE1IGwtMzYgLTkzIDQ3IC01NSA0OCAtNTUgLTU0Ci0yNSBjLTI5IC0xNCAtNjEgLTI1IC03MCAtMjUgLTExIDAgLTI3IC0xOCAtNDEgLTQ2IGwtMjMgLTQ2IC0zNCA1MSBjLTIzIDM3Ci0zNSA2OSAtMzkgMTA5IGwtNiA1NiAtNTMgMTYgYy0zMCA5IC01OCAyMyAtNjMgMzEgLTEyIDIwIC0xMSA2MiAxIDU0IDE2IC0xMAo0MSAxNiAzNSAzNSAtMyAxMCAtMSAzOSA2IDY0IGwxMSA0NiA0OSAtMjcgYzQzIC0yMyA1MiAtMjUgNzMgLTE0IDMyIDE4IDE1Nwo1OSAxNzkgNjAgMTQgMSAxNyAtNCAxMiAtMjF6IG00NDU5IDEgYzM5IC0xMiA4MyAtMzAgOTkgLTQxIGwyNyAtMjAgNDIgMzIgNDMKMzEgMTIgLTMzIGM2IC0xOCAxMiAtNTAgMTIgLTcwIDEgLTMxIDUgLTM4IDIxIC0zOCAxMSAwIDIzIC03IDI2IC0xNSAxMSAtMjcKLTIzIC02MSAtNzggLTgxIGwtNTMgLTE5IC01IC01MSBjLTUgLTUwIC00NiAtMTQ0IC02NiAtMTUxIC02IC0yIC0xOSAxNSAtMzAKMzkgLTE2IDM2IC0yNyA0NCAtNzYgNjIgLTMxIDEyIC02MCAyNSAtNjQgMjkgLTQgNCAxMiAzNCAzNiA2OCBsNDMgNjEgLTIyIDQ0CmMtMTEgMjUgLTIxIDUwIC0yMSA1NyAwIDYgLTcgMjUgLTE1IDQxIC05IDE2IC0xMyAzMSAtMTEgMzQgMyAyIDEgMTMgLTUgMjMKLTEzIDI1IC00IDI0IDg1IC0yeiBtLTUzNjAgLTE0IGM5IC0xMyAxNiAtMjcgMTYgLTMxIDAgLTEwIC0zMCAxNyAtNDEgMzggLTE1CjI3IDYgMjIgMjUgLTd6IG0tNzE3IC0zNiBjMTA2IC02NCAxOTMgLTEyOCAyMzAgLTE3MCA0NSAtNTAgNjEgLTU0IDEyMyAtMjkKMzAgMTIgNzkgMjcgMTExIDM0IGw1NyAxNCA2IC00NyBjNCAtMjUgMiAtNzcgLTQgLTExNiAtMTkgLTEyMyAtMTkgLTEyNiAyMAotMTUzIDQzIC0yOSA0MiAtNTMgLTMgLTEwMCAtNjEgLTY0IC0xMjEgLTgwIC0yMDQgLTU2IC0zMCA5IC01MSAyMCAtNDYgMjQgNAo0IDQ0IDE4IDg4IDMwIDQ0IDEyIDg3IDI2IDk1IDMyIDI1IDE2IC0xMTEgMSAtMTU0IC0xNyAtMjEgLTkgLTQxIC0xNCAtNDQKLTExIC0xNSAxNiAzNiA5MSA4NyAxMjkgMzAgMjIgNDkgNDMgNDIgNDUgLTYgMiAtMjIgLTQgLTM0IC0xNCAtMjEgLTE5IC0yMQotMTkgLTcgMyA4IDEyIDM5IDU2IDY4IDk4IDY0IDkyIDM4IDg1IC0zOCAtMTAgLTI4IC0zNiAtNTQgLTY1IC01NyAtNjUgLTMgMAotMyAxMSAtMSAyNCAzIDEzIC0xIDMxIC03IDQwIC0xMSAxNCAtMTMgNiAtMTcgLTQ2IC00IC01MCAtMTMgLTc2IC00MyAtMTI2CmwtMzkgLTYzIC0yNSA1OCBjLTIyIDUyIC0yNSA3MCAtMjQgMTczIDIgMTE1IC04IDEyMiAtMjIgMTUgbC03IC01MCAtMjEgMjcKYy0xMiAxNSAtNDkgODAgLTgxIDE0MyAtMzMgNjQgLTYzIDExOCAtNjggMTIxIC0xOSAxMiAtNSAtMjkgNDMgLTEyNyA5MCAtMTg0CjkxIC0xODkgMjUgLTE0NCAtMjAgMTQgLTQxIDI1IC00NiAyNSAtMjEgMCAtOCAtMTcgNDEgLTUwIDg3IC02MCAxMDcgLTgzIDEzMwotMTQ5IGwyNSAtNjMgLTM3IDcgYy01NSAxMCAtMTEzIDM4IC0xNTQgNzQgLTIwIDE3IC0zOCAzMSAtNDIgMzEgLTEzIDAgLTUKLTI4IDE0IC00NSAxMSAtMTAgMjAgLTIxIDIwIC0yNSAwIC00IC00OCAtNSAtMTA3IC0yIC0xMTQgNSAtMTM0IC04IC0zMCAtMTkKMzQgLTQgODYgLTEwIDExNiAtMTQgbDU0IC04IC0zNCAtMTggYy00MiAtMjIgLTI2IC0yNCAzMSAtNCAyNCA4IDUwIDEzIDU5IDExCjkgLTMgMzYgLTEwIDYxIC0xNiBsNDQgLTEyIC0yOSAtMTMgYy00MCAtMTcgLTE3NSAtMTU1IC0xNTIgLTE1NSAxMyAwIDY5IDQyCjEwNyA4MCAzIDMgMjIgMTggNDMgMzMgbDM3IDI4IDAgLTI4IGMwIC0zNyAtNTUgLTEyNSAtODggLTE0MSAtNjQgLTMyIC0xMDMKLTQxIC0xNTAgLTM1IGwtNDggNSAwIDY1IDEgNjYgLTUwIDM0IGMtNzYgNTIgLTE1NSAxMjMgLTE1NSAxMzkgMCAyMCA5NyA5MAoxNTUgMTExIGw1MCAxOSAtNCAxMjYgYy0zIDExOCA2IDMxOCAxNSAzMTggMiAwIDM0IC0xOSA3MSAtNDF6IG03NjY4IC0xNjggYzMKLTkzIDEgLTE0OSAtNiAtMTU3IC02IC03IC05IC0yNyAtNyAtNDQgMyAtMjggOSAtMzQgNTEgLTUwIDI3IC0xMCA3NyAtMzcgMTEyCi02MCA2MyAtNDEgNjQgLTQzIDQ4IC02MyAtMjUgLTMzIC0xMjQgLTExNSAtMTY4IC0xNDEgbC00MCAtMjIgMyAtNjcgNCAtNjcKLTM5IC0xIGMtNzQgLTIgLTk4IDIgLTE1MCAyNyAtNDcgMjIgLTU0IDMwIC03MiA4MCAtMjAgNTMgLTI2IDg0IC0xNiA4NCAzIDAKNDYgLTMxIDk3IC03MCA1MSAtMzggOTcgLTcwIDEwMyAtNzAgMTIgMSAtMTMwIDEzOSAtMTU5IDE1NCAtMzMgMTkgLTIzIDMxIDM3CjQ1IDUzIDEyIDYzIDEyIDkzIC0zIDQ2IC0yMiA2MiAtMjAgMzMgMyBsLTI0IDE5IDcwIDcgYzM5IDQgODggMTQgMTEwIDIxIDM3CjEzIDMyIDEzIC03MiAxMCBsLTExMyAtNCAzMCAzNSBjMTcgMTggMzAgMzkgMzAgNDUgMCAxMSAtMTggLTIgLTc2IC01NSAtMjcKLTI0IC0xNDEgLTY0IC0xNTIgLTUyIC03IDYgMjMgOTEgNDIgMTIyIDEyIDE4IDMwIDM2IDQxIDM5IDI1IDggMTE4IDg1IDExMQo5MiAtMyAzIC0yOCAtOSAtNTYgLTI2IC0zMyAtMjAgLTUwIC0yNyAtNTAgLTE4IDAgNyAyOSA3MyA2NSAxNDYgMzYgNzMgNjQKMTM4IDYyIDE0NCAtNSAxNSAtNTQgLTY0IC0xMTcgLTE5MCBsLTU0IC0xMDggLTE2IDcwIGMtMTkgODYgLTMwIDY0IC0xNyAtMzQKMTAgLTY1IDkgLTc3IC0xMCAtMTE1IC0xMSAtMjMgLTI0IC01NyAtMjcgLTc1IC0xMSAtNDggLTE2IC00NSAtNjkgNDcgLTEyIDIxCi0yMyA2MyAtMjYgMTAxIC03IDcxIC0yNCA4NyAtMjkgMjcgbC0zIC0zOCAtNTAgNjIgYy0yNyAzNCAtNDkgNjUgLTQ5IDcwIDAgNQotNyA5IC0xNSA5IC0yMyAwIC0xOSAtMTAgNDAgLTg3IDUxIC02NyA3MiAtMTA0IDQzIC03NSAtMTMgMTMgLTQ4IDE2IC00OCA0IDAKLTQgMjAgLTE4IDQ1IC0zMSAzMyAtMTcgNTQgLTM5IDc2IC03OCAzNCAtNTkgMzMgLTcxIC0zIC01MiAtMjIgMTIgLTE0MiAzNwotMTgyIDM4IC0zOSAyIDAgLTE3IDEwMiAtNDggNTYgLTE4IDEwMCAtMzYgOTcgLTQxIC0zIC01IC0yOSAtMTQgLTU4IC0yMCAtOTIKLTE5IC0xODQgMjQgLTIyNyAxMDYgLTEzIDIzIC0xMiAyNyAxNiA0OSAxNiAxMyAzNSAyNCA0MiAyNSAxNSAwIDE1IDExIC0zIDg1Ci0xNyA3MCAtMjAgMjE1IC01IDIxNSAyNiAwIDE4NyAtNDUgMjA1IC01NyAzMSAtMjEgNDIgLTE2IDEwMyA0NSAzMyAzMyAxMDgKOTEgMTY4IDEzMCBsMTA5IDcyIDcgLTMzIGM0IC0xNyAxMCAtOTcgMTMgLTE3NnogbS02NDk1IC0xODUgYzAgLTcgLTEyNyAtOTYKLTE0NyAtMTAzIC00OCAtMTcgLTI1OSAtMTczIC0zNzYgLTI3NyAtMzcgLTMzIC0xMDQgLTEwNCAtMTQ5IC0xNTggLTIxOSAtMjY1Ci0zMDIgLTQyNyAtNDA3IC03OTMgLTU3IC0yMDEgLTc5IC0zMjAgLTkzIC01MTkgLTMyIC00NTcgNTAgLTgyOCAyODkgLTEzMTEKMjYxIC01MjYgNTAwIC04ODYgNzU3IC0xMTM4IDE2NCAtMTYxIDQxOCAtMzY0IDU2MCAtNDQ3IDI0IC0xNCA3OCAtNDggMTIwCi03NyAxODUgLTEyNSA2MDcgLTMwMCA5NTEgLTM5MyAzMTMgLTg2IDcwOSAtMjY0IDkzNSAtNDIxIDk2IC02NyA5NiAtNjcgODAKLTg0IC0xMyAtMTIgLTIxIC05IC02NSAyNCAtNjMgNDggLTI4MSAxNzkgLTM4NiAyMzEgLTEwMSA1MSAtMjcyIDExNyAtNDE0CjE1OSAtMTU3IDQ2IC0yODEgODYgLTM0NSAxMTAgLTMwIDExIC0xMTMgNDEgLTE4NSA2NiAtNzEgMjYgLTE1NyA1OSAtMTkwIDc1Ci0zMyAxNSAtMTAzIDQ4IC0xNTUgNzIgLTI3NCAxMjkgLTY4MCA0MTAgLTg5NCA2MjAgLTM3IDM3IC03MyA2NSAtNzkgNjEgLTYKLTQgLTcgLTEgLTIgNiA0IDggMCAxOCAtMTEgMjYgLTE3IDEyIC02NSA3MCAtMTkxIDIzMCAtNjUgODMgLTI3MCAzODkgLTMwMAo0NTAgLTE0IDI4IC0zMyA2MSAtNDMgNzUgLTQ0IDY0IC0yMzUgNDUxIC0yODkgNTg3IC0xMTEgMjgwIC0xOTEgNjUzIC0xOTEKODkzIDAgMTI1IDIzIDM1NSA0NSA0NTkgNzMgMzQ2IDIwNSA2OTIgMzM0IDg3NiA2MCA4NSAxNzIgMjE2IDI1MSAyOTUgODEgODEKMjgzIDIzMSAzODkgMjkwIDM2IDIwIDk1IDU1IDEzMSA3NyA3MyA0NiA3MCA0NCA3MCAzOXogbTUzMDUgLTQxIGwyMCAtMTYgLTIwCjEwIGMtMTEgNSAtMjkgMTcgLTQwIDI2IGwtMjAgMTYgMjAgLTEwIGMxMSAtNSAyOSAtMTcgNDAgLTI2eiBtMjQ0IC0xNDMgYzY1Ci00NSAxMDMgLTc0IDE0OSAtMTEyIDEzIC0xMSAyNyAtMTggMzIgLTE1IDQgMyA1NCAtNDUgMTExIC0xMDYgMTcyIC0xODQgMzE2Ci00MTMgMzc3IC01OTkgMTIgLTM2IDMyIC05OSA0NiAtMTQwIDcyIC0yMjAgMTAxIC00NjMgOTIgLTc2MCAtMTIgLTM3OCAtODIKLTcxMSAtMjIzIC0xMDU4IC0zMCAtNzUgLTYyIC0xNTUgLTcwIC0xNzYgLTggLTIyIC0yMiAtNTEgLTMyIC02NSAtMTAgLTE0Ci00NCAtNzUgLTc2IC0xMzYgLTE4MyAtMzQ3IC0zNTEgLTYxNCAtNDkxIC03NzkgLTU4IC02OSAtMjg3IC0yOTMgLTM4NSAtMzc4Ci0xNjQgLTE0MiAtNDg0IC0zNTggLTYzOCAtNDMwIC0zNSAtMTYgLTEwNCAtNTAgLTE1NSAtNzUgLTk1IC00NyAtMjE3IC05NgotMzQ1IC0xMzkgLTQyIC0xNCAtODAgLTI5IC04NiAtMzMgLTEwIC04IC0xMDAgLTM3IC0zOTUgLTEyNyAtMzQ0IC0xMDYgLTYyMwotMjUwIC04NjkgLTQ1MSAtMTA4IC04NyAtMjMzIC0yNDggLTMwNyAtMzk1IC0xNiAtMzIgLTMyIC01OCAtMzUgLTU4IC00IDAKLTEwIDE2IC0xMyAzNSAtNiAzMCAwIDQ4IDMzIDEwOCA1MiA5NCAxNTMgMjIwIDIzMiAyODggMzUgMzAgNzQgNjUgODggNzggNzkKNzIgMjc1IDE5MSA0NjEgMjc5IDE4NyA4OCAzMDYgMTMyIDU3NSAyMTIgMzI2IDk3IDU1MCAxODMgNzkwIDMwNSA5OSA1MCAyMDMKMTA3IDIzMCAxMjYgMjggMjAgNzIgNTEgMTAwIDcwIDU5IDQxIDMxNSAyNDMgMzg4IDMwNiA2OCA2MCAyMzMgMjIyIDI3NSAyNzAKMTM0IDE1NSAyNzUgMzY0IDM3OCA1NTkgMzEgNjAgNjcgMTIzIDc5IDEzOSAzMSA0MyAxNjUgMzA2IDIwNCA0MDAgMTggNDQgNDAKOTYgNDggMTE1IDU5IDEzNyAxMjYgMzY4IDE2MiA1NjUgMzkgMjA5IDU0IDYwMSAzMSA3OTUgLTI1IDIwMyAtODYgNDU2IC0xNDUKNjAwIC0zMSA3NCAtOTIgMTk3IC0xMDYgMjE0IC01IDYgLTI0IDMzIC00MiA2MCAtNjggMTA1IC04NSAxMjYgLTE2NCAyMTIKLTExOCAxMjkgLTI3MCAyNjAgLTM4OCAzMzQgLTE0MyA5MCAtMTUxIDk3IC02MSA0OSA0NCAtMjMgMTA5IC02MiAxNDUgLTg3egptLTUwMzQgLTU4IGMtMjcgLTggLTEwOCAtMjEgLTE3OSAtMjkgLTcxIC05IC0xNDkgLTIwIC0xNzUgLTI2IC01OSAtMTMgLTIyOQotNjggLTI2MSAtODUgLTE0IC03IC00NyAtMjIgLTc0IC0zNCAtMTI3IC01MyAtMzgyIC0yNzQgLTUxMCAtNDQxIC00NyAtNjEKLTE3MiAtMjQ4IC0yMjMgLTMzNCAtMzcgLTYwIC0xOCAtNCAzMCA5MCAxMDQgMjA2IDMwOCA0NTggNDU1IDU2MiAyOSAyMSA2Ngo0OSA4MyA2MyAzMyAyOCAyMDQgMTE3IDI4NCAxNDkgMTQwIDU0IDM4NCA5OCA1NTUgOTkgbDY1IDAgLTUwIC0xNHogbTQ1NTAKLTIwIGMyNzMgLTUyIDUwMyAtMTczIDcwMCAtMzY4IDEyMSAtMTE5IDE5MSAtMjEyIDI2OSAtMzU2IDUzIC05OCAxMTYgLTI0NAoxMzAgLTMwMCBsNiAtMjUgLTEyIDI1IGMtMTMzIDI3OSAtMjAwIDM4OCAtMzQwIDU1MiAtNDYgNTQgLTExMCAxMTcgLTE0MyAxNDIKLTMzIDI0IC03MiA1NyAtODYgNzIgLTM0IDM3IC0xNTMgMTA1IC0yNjMgMTUwIC05MCAzNyAtMjI2IDczIC0zNTYgOTUgLTQxIDcKLTg2IDE4IC0xMDAgMjYgLTIzIDEyIC0xOCAxMyA0NSA4IDM5IC0zIDEwNiAtMTMgMTUwIC0yMXogbS00NzM1IC0yMjQgYzAgLTYzCjggLTc0IDc2IC0xMDggMjIgLTExIDY2IC00MiA5OCAtNjcgbDU3IC00NyAtMjIgLTI0IGMtMzcgLTQwIC0yMDMgLTExNyAtMjc3Ci0xMjkgbC02NyAtMTEgLTMwIC01OSBjLTMxIC02MSAtOTkgLTE2MCAtMTI3IC0xODMgLTkgLTcgLTIzIC05IC0zMiAtNiAtMTkgNwotMTE2IDE5OSAtMTE2IDIyOSAwIDMwIC0xOSA0NSAtNTcgNDUgLTE4IDAgLTUzIDEwIC03NyAyMiBsLTQ1IDIxIDE5IDM2IGMyOAo1NiA3MiA5MiAxMTggOTggNDUgNiAxMzIgLTQgMTMyIC0xNSAwIC03IC05NyAtNDYgLTE0MiAtNTcgLTI5IC03IC0zOSAtMjUKLTE0IC0yNSAyMiAwIDE1MCA0MSAxNjQgNTIgMjQgMjEgMjQgLTEgLTIgLTU2IC0yNyAtNTcgLTMyIC03NiAtMTggLTc2IDQgMAoxNCAxNiAyMSAzNSA3IDE5IDE3IDM1IDIyIDM1IDUgMCA5IC02MyAxMCAtMTQ3IDEgLTExOCAzIC0xNDIgMTEgLTExOCA2IDE3CjExIDkyIDExIDE2OCAwIDc1IDIgMTM3IDYgMTM3IDMgMCAyNCAtMjggNDUgLTYzIDI5IC00NiA0MSAtNTcgNDQgLTQ0IDIgMTEKLTEwIDQxIC0yNyA2OSAtMzkgNjMgLTQwIDgxIC0zIDc0IDE1IC0yIDQ0IC03IDY1IC0xMSAyMSAtMyA1MyAtMTUgNzAgLTI2IDQ0Ci0yNiA2NiAtMjUgNDEgMiBsLTE5IDIxIDEwNyAtNCBjMTI0IC00IDEzMyAxMyAxMSAxOSAtMTA0IDYgLTExMSA5IC04MyAzMyAyOAoyNCAyNSAyNCAtMzEgNCAtMzQgLTEyIC02MyAtMTQgLTEyNCAtOCBsLTc5IDYgMzQgMTggYzM5IDIxIDE1NyAxMzYgMTQ4IDE0NQotMyA0IC00MyAtMjMgLTg3IC01OSAtOTEgLTczIC0xMTQgLTgyIC0xMDIgLTM4IDE2IDU0IDQyIDkyIDgxIDExOCA1MyAzNSAxMDcKNTQgMTUzIDUyIGwzNyAtMiAwIC01NnogbTQ4ODIgNSBjMzAgLTIxIDUzIC00OSA3NSAtOTQgNTMgLTEwMyAzNiAtMTAwIC05OQoxNyAtNTggNTAgLTc4IDYxIC03OCA0NCAwIC00IDM0IC00MCA3NiAtODAgNDEgLTQwIDczIC03NiA2OSAtODEgLTMgLTYgLTI2Ci0xMyAtNTEgLTE3IC0zNCAtNSAtNTggLTEgLTEwMCAxNSAtNzEgMjcgLTc4IDI2IC0zNCAtMiBsMzUgLTIyIC01NSAtMiBjLTE2MwotOCAtMTkyIC0zMyAtMzggLTMzIGwxMDEgMCAtMjMgLTI1IGMtMTMgLTE0IC0xOCAtMjUgLTEyIC0yNSA2IDAgMTQgNSAxNyAxMAoxMiAxOSA3MCA0MyAxMzUgNTYgMzYgNiA2NyAxMCA2OSA4IDIgLTIgLTEyIC0zMCAtMzIgLTYzIC0yMSAtMzIgLTM3IC02NCAtMzcKLTcwIDAgLTIyIDE2IC0xMCA0NSAzNyBsMzAgNDcgNyAtMTMwIGM5IC0xOTAgMjcgLTIxOCAyNiAtNDIgMCA3NiAyIDE0MCA0CjE0MyAzIDIgMTcgLTE0IDMyIC0zNiAzMyAtNTEgNTUgLTUzIDI1IC0yIC0xMiAyMCAtMzEgNTIgLTQyIDcwIC0xMCAxOCAtMTcKMzYgLTEzIDM5IDMgMyAzNiAtOCA3MyAtMjQgNjAgLTI3IDE2NyAtNTUgMTUzIC00MCAtMTAgMTEgLTE1NSA2NyAtMTcyIDY3Ci0yNCAwIC0yMyAyNyAyIDM1IDQxIDEzIDEyMCA3IDE1MiAtMTIgMzAgLTE3IDk4IC0xMDMgOTggLTEyMyAwIC0xMiAtNzYgLTQwCi0xMjUgLTQ3IGwtNDMgLTUgLTIyIC03NCBjLTIwIC03MCAtOTggLTE5NCAtMTIwIC0xOTQgLTIwIDAgLTEyNSAxNTEgLTE1NQoyMjMgLTE1IDM2IC0yNyA0MiAtNzUgMzkgLTQ4IC0zIC0yNzIgMTA1IC0yODUgMTM4IC00IDkgMTIgMzIgNDUgNjIgMjkgMjcgNTYKNDggNjAgNDggNSAwIDMxIDE0IDU5IDMxIGw1MSAzMiAwIDYwIDAgNTkgNjUgLTQgYzUxIC0zIDczIC0xMCAxMDcgLTMzegptLTQ5MTYgLTQ1MiBjLTIgLTIgLTE2IDIgLTMyIDggLTI3IDEwIC0yNyAxMiAtOSAxOSAxNCA1IDI0IDMgMzIgLTggNyAtOCAxMQotMTcgOSAtMTl6IG00ODE3IDAgYy0zMyAtMTcgLTUxIC0xMyAtMzggNiAzIDYgMjEgMTEgMzggMTAgbDMyIDAgLTMyIC0xNnoKbS01Nzc0IC0yODAgYy0yMTcgLTIyNSAtMzg1IC01NDIgLTQ0NSAtODM4IC0xNyAtODkgLTE3IC0yMCAxIDkxIDM0IDIxMiAxNTMKNDYyIDMwNCA2MzkgNTEgNjAgMTg4IDE4MyAyMDUgMTg0IDUgMSAtMjQgLTM0IC02NSAtNzZ6IG02NTgxIC00MCBjMTgyIC0xOTEKMjc4IC0zODQgMzM4IC02NzMgMjQgLTExNSAzOCAtMjYyIDIzIC0yNDAgLTYgOCAtMTEgMzQgLTExIDU3IDAgMjMgLTQgNDQgLTkKNDcgLTUgMyAtMTIgMjcgLTE2IDUzIC0zMiAyMTUgLTE0MyA0NjkgLTI5NiA2NzggLTQ0IDYxIC05MCAxMjEgLTEwMiAxMzQgLTQ5CjUzIDE4IDMgNzMgLTU2eiBtLTcyNjYgLTY2IGMtOSAtMjYgLTE4IC00NyAtMjEgLTQ3IC0xMCAwIDUgNzEgMTggODYgMTkgMjMKMjAgMTEgMyAtMzl6IG03ODM2IC0zIGM3IC0xOSAxMCAtMzggNyAtNDEgLTcgLTcgLTM3IDUyIC0zNyA3MiAwIDI2IDE3IDggMzAKLTMxeiBtLTc5NzcgLTczIGM3IC04IC02IC01IC0zMSA4IC0yMyAxMiAtNDIgMjYgLTQyIDMyIDAgMTEgNTUgLTE5IDczIC00MHoKbTgxNjcgMjkgYy0yOSAtMjMgLTg0IC00NCAtNzUgLTMwIDcgMTIgNzYgNDkgOTAgNDkgNiAwIC0xIC04IC0xNSAtMTl6Cm0tODM1MCAtMzM1IGMzMiAtMjUgNjcgLTU2IDc3IC03MSAxOCAtMjQgMjEgLTI1IDcyIC0xNiA3MyAxMyA5MyA3IDg1IC0yNyAtNAotMTQgLTEyIC00MCAtMTkgLTU3IC0xMSAtMjcgLTEwIC0zNCA2IC01NSAxMCAtMTMgMTkgLTI3IDE5IC0zMSAwIC0xMCAtOTYKLTEwIC0xMjggLTEgLTMyIDggLTkgMjMgMzggMjMgMjYgMCAzMSAzIDIwIDEwIC04IDUgLTI4IDEwIC00NSAxMCBsLTMwIDEgNDIKMzkgYzIzIDIyIDM4IDQwIDMyIDQwIC0yMCAwIC02OCAtMzAgLTg3IC01NSAtMTEgLTE0IC0yMyAtMjUgLTI2IC0yNSAtMyAwIC02CjI1IC02IDU1IDAgMzAgLTQgNTUgLTEwIDU1IC01IDAgLTEwIC04IC0xMCAtMTcgLTEgLTEwIC0xNSA4IC0zMSA0MSAtMTcgMzIKLTMzIDU2IC0zNiA1MyAtNyAtOCAyNSAtMTE0IDQ4IC0xNTkgbDE5IC0zNiAtNDYgMTQgYy01MyAxNiAtMTQ0IDE5IC0xMDkgNAoxMSAtNSAzMyAtMTIgNTAgLTE1IGwzMCAtNyAtMjUgLTEzIGMtMjMgLTEyIC0xOSAtMTMgMzggLTggMzQgMyA2MiAyIDYyIC0yIDAKLTUgLTEzIC0zMiAtMzAgLTYyIC0xNiAtMjkgLTMwIC01OCAtMzAgLTY1IDEgLTEyIDM1IDIzIDcyIDc0IGwxNyAyMyAxIC0yOApjMSAtNzEgLTM2IC0xMTEgLTEyNSAtMTMzIGwtMjggLTcgNSA2NyA2IDY2IC0zMiAxNSBjLTE4IDkgLTU0IDM1IC04MSA1OQpsLTUwIDQzIDM1IDE4IGMxOSAxMCA1MyAyNCA3NSAzMCBsNDAgMTIgMTMgOTIgYzggNTAgMTYgOTEgMTkgOTEgMiAwIDMxIC0yMAo2MyAtNDV6IG04NTQyIC01NCBjMTIgLTc3IDE1IC04NSAzOCAtOTIgMTQgLTQgNDggLTE3IDc1IC0yOSBsNTAgLTIyIC00MCAtMzQKYy0yMiAtMTkgLTU5IC00NyAtODMgLTYyIGwtNDMgLTI3IDcgLTY0IDcgLTYzIC0zNCA3IGMtODQgMTggLTExOSA1NiAtMTE5CjEyNSBsMSA0NSAxOSAtMzUgYzI1IC00NiA1NyAtODYgNjQgLTgwIDIgMyAtNiAyNiAtMTggNTEgLTEzIDI1IC0yNyA1NiAtMzEKNjkgLTcgMjIgLTYgMjMgNDkgMTggNDMgLTQgNTMgLTIgNDYgNyAtOCA5IDEgMTUgMzUgMjQgMjUgNiA0NSAxNCA0NSAxNyAwIDcKLTk4IC0yIC0xNTQgLTEzIC0yNyAtNiAtMjggLTUgLTE2IDE3IDE4IDM0IDYxIDE2MyA1NSAxNjggLTIgMiAtMTcgLTIxIC0zMgotNTIgLTI2IC01MyAtMjggLTU1IC0zNyAtMzQgLTkgMjAgLTExIDE2IC0xMyAtMjcgLTUgLTc4IC0xMCAtODMgLTQyIC00OCAtMjgKMzEgLTg5IDY4IC05NyA2MCAtMiAtMiAxNiAtMjMgNDEgLTQ2IGw0NSAtNDEgLTM1IDAgYy02NiAwIC00MyAtMjggMjUgLTMxIDIzCjAgMjMgLTEgNSAtOSAtMjQgLTEwIC0xNDUgLTEzIC0xNDUgLTMgMCA0IDEwIDE3IDIxIDI5IDIxIDIyIDIxIDI0IDUgNjQgLTIwCjUwIC0yMSA5MCAtMiA5MCA4IDAgMzcgLTUgNjYgLTEyIGw1MSAtMTIgNDcgNDYgYzY1IDYyIDExNSA5OSAxMjQgOTAgNCAtNCAxMwotNDUgMjAgLTkxeiBtLTQ4NSAtMTU4IGMtMyAtMTAgLTUgLTQgLTUgMTIgMCAxNyAyIDI0IDUgMTggMiAtNyAyIC0yMSAwIC0zMHoKbS02OTk3IC01NjQgYzAgLTE1IC03MyAtNzkgLTkwIC03OSAtOSAwIDUgMTkgMzIgNDUgNDkgNDcgNTggNTIgNTggMzR6IG02NDA1Ci0yMCBjMzkgLTM1IDYyIC02OSA0NiAtNjkgLTEyIDAgLTkxIDgwIC05MSA5MiAwIDEzIDggOSA0NSAtMjN6IG0tNzI4NSAtMTU0CmM1MCAtNTEgMzEgLTU5IC0zMyAtMTQgbC01OSA0MCAyNCAtNDIgYzEyIC0yMyAzNiAtNTIgNTEgLTY1IGwyOSAtMjQgLTQwIDAKYy01NSAwIC0xMDEgMjEgLTE1OCA3NCBsLTQ5IDQ1IDUzIDEgYzI5IDAgNjMgLTUgNzQgLTExIGwyMSAtMTIgLTIxIDM3IGMtMTIKMjEgLTIyIDQxIC0yMiA0NiAwIDE1IDk2IC00MCAxMzAgLTc1eiBtODIzNiA2MCBjLTIwIC0zMCAtMTMgLTQ3IDE3IC00NCAxMiAwCjM5IDEgNjAgMCBsMzggLTEgLTY2IC01MCBjLTgyIC02MiAtODkgLTY2IC0xNDggLTc0IGwtNDkgLTYgNjEgNjggYzMzIDM3IDU1CjY5IDUwIDcxIC02IDIgLTM3IC0xOCAtNzAgLTQzIC0zMiAtMjUgLTU5IC00MiAtNTkgLTM3IDAgMjUgNTIgNzggMTA1IDEwOCA3MgozOSA4MiA0MSA2MSA4eiBtLTcwNTggLTYgYy0yIC0xNyAtMTYgLTI1IC03MyAtMzkgLTM4IC0xMCAtNzIgLTE2IC03NCAtMTQgLTcKNiAyMyAzNiA1NCA1NiAxNyAxMCA0NSAxOCA2MyAxOCAyOCAwIDMzIC0zIDMwIC0yMXogbTU4OTIgLTUgYzU3IC0zOCA2NiAtNzEKMTQgLTQ5IC0yMCA4IC00OSAxNSAtNjUgMTUgLTI1IDAgLTQ5IDIyIC00OSA0NCAwIDEzIDc3IDUgMTAwIC0xMHogbTEyMzAKLTE1MyBjMCAtMjAgLTY4IC01MSAtMTExIC01MSBsLTQ0IDEgMzggMTMgYzIwIDggNDcgMjEgNjAgMjkgMjUgMTggNTcgMjIgNTcKOHogbS04NDAxIC0yNSBjNDYgLTE3IDU4IC0yNCA0NCAtMjggLTIzIC02IC03OSAxMSAtMTE0IDM1IC0zMyAyNCAtNyAyMSA3MAotN3ogbTE0NjYgLTUgYy0zIC01IDE1IC01OCAzOSAtMTE4IDI0IC01OSA0OSAtMTM0IDU2IC0xNjUgNiAtMzEgMTYgLTYxIDIzCi02NiA3IC02IDQ0IC0yMyA4MiAtMzggNjggLTI2IDEwNSAtNDkgMTA1IC02NSAwIC0xMSAtMTEyIC0xMjQgLTE0MyAtMTQ0IC0yNgotMTcgLTI4IC0yMiAtMjMgLTU5IDQgLTIzIDEwIC01MiAxMyAtNjUgNiAtMjQgNSAtMjQgLTUwIC0xOCAtNjkgNyAtMTQwIDQ2Ci0xNTcgODcgLTIwIDQ5IC04IDU1IDQwIDE4IDI1IC0xOSA1MiAtMzggNTkgLTQzIDI2IC0xNSAtMjggNTMgLTY1IDg0IGwtMzYKMjkgMzggMTIgYzIwIDcgNjIgMTIgOTMgMTIgNDAgMCA1MCAyIDM2IDggLTExIDUgLTMxIDkgLTQ1IDkgLTQwIDIgLTYgMTggNjcKMzEgNjYgMTMgOTQgMzAgNDYgMzAgLTMyIC0xIC05OSAtMTQgLTEyOCAtMjUgLTE5IC04IC0xOCAtNiAzIDE3IDM2IDQwIDI1IDQ1Ci0xNSA2IC0zMyAtMzEgLTExMyAtODIgLTExOSAtNzUgLTEgMSAzIDM0IDEwIDcyIDkgNTUgMjAgODEgNDkgMTE5IDcyIDkzIDczCjExNyAyIDM5IGwtNDMgLTQ4IDE1IDc1IGM4IDQxIDE3IDEwMCAxOSAxMzAgNiA3OCAtMTIgNDQgLTM2IC02NyAtMjEgLTEwMQotMzggLTE1MSAtNDAgLTExOCAwIDExIC04IDI5IC0xNyA0MCAtMTUgMTkgLTE1IDE4IC05IC0xNCAzIC0xOSAxMyAtNDcgMjAKLTYzIDEyIC0yNCAxMyAtMzggMiAtOTAgbC0xMiAtNjEgLTU2IDc0IGMtNjggODkgLTEwOCAxMjkgLTEwOCAxMDcgMCAtOCA5Ci0yMyAyMCAtMzMgMjcgLTI0IDI1IC0zOCAtMiAtMzAgLTIyIDYgLTIyIDUgMiAtMTYgMTQgLTEyIDMyIC0yNyA0MCAtMzMgMzIKLTI1IDczIC03NiA2NiAtODMgLTQgLTQgLTM3IC04IC03MyAtMTAgLTEwMSAtNCAtMTA1IC0yMyAtNSAtMjMgNDUgMCA4MiAtNAo4MiAtOCAwIC0xNyAtNzkgLTUyIC0xMTcgLTUyIC0zNyAwIC0xMzMgNDggLTEzMyA2NyAwIDQgMTQgMjIgMzEgMzkgMzYgMzcgNDAKNjggMTYgMTMwIC05IDIzIC0xOSA2NCAtMjMgOTMgbC03IDUxIDM0IDAgYzM0IDAgOTAgLTEyIDExOSAtMjQgMTIgLTUgMjMgOQo0NCA1MSAzMCA2MSA4NSAxMzIgMTUxIDE5NSA0MSAzOCA1MSA0NSA0MCAyOXogbTU1MjMgLTc2IGMzNCAtMzggNzcgLTk4IDk1Ci0xMzMgbDMyIC02MyA0MCA3IGMxMDggMTggMTI1IDIwIDEyOSAxNyAxMSAtMTEgLTkgLTEyMyAtMzAgLTE3MiBsLTI0IC01MyAzNQotNDEgYzE5IC0yMiAzNSAtNDUgMzUgLTUxIDAgLTE3IC05NSAtNjYgLTEyOSAtNjYgLTMyIDAgLTEyMSAzOCAtMTIxIDUyIDAgNAozOSA4IDg4IDggNjggMSA4MyAzIDY4IDEyIC0xMCA2IC00NyAxMyAtODIgMTYgbC02MyA1IDE0IDI3IGMxNyAzMyA4MyA5MCAxMDQKOTAgMTEgMCAxMiAzIDMgMTIgLTggOCAtNiAxOCAxMCA0MCAxMSAxNiAxNyAzMiAxNCAzNSAtOCA4IC01MCAtMzMgLTEyMyAtMTE4Ci01MiAtNjEgLTU5IC02NiAtNjUgLTQ2IC0xMCAzNiAtOSAxMTcgMyAxMzkgMTcgMzIgMjkgNzggMTkgNzggLTUgMCAtMTQgLTE2Ci0yMCAtMzYgLTcgLTE5IC0xNCAtMzMgLTE3IC0zMCAtMyAzIC0xNSA1MiAtMjggMTA5IC0yNyAxMjUgLTQ4IDE3MSAtNDEgODcgMwotMzAgMTIgLTg5IDIwIC0xMzAgOCAtNDEgMTMgLTc2IDEyIC03NyAtMiAtMiAtMjAgMTkgLTQyIDQ3IC0zNyA0NiAtNTQgNjAKLTU0IDQzIDAgLTUgMjQgLTM5IDUyIC03NyA0NiAtNjEgNTIgLTc2IDU2IC0xMjggMyAtNDAgMSAtNTggLTcgLTU4IC0xMiAwCi03NSA0MyAtOTYgNjUgLTUgNiAtMTkgMTcgLTMwIDI1IC0xOSAxNCAtMTkgMTQgLTIgLTYgMjUgLTMwIDEzIC0zNCAtNTEgLTE4Ci02NSAxNSAtMTAyIDE4IC0xMDIgNiAwIC02IDkzIC0zNSAxNDUgLTQ1IDE0IC0yIDYgLTggLTI1IC0xNyAtNTUgLTE2IC00MgotMjMgMjAgLTEyIDM2IDcgNTMgNSA4MiAtMTAgbDM4IC0xOCAtNTAgLTQ4IGMtNjcgLTY1IC02MyAtODEgNyAtMzIgMzEgMjIgNTgKMzggNjEgMzYgOCAtOSAtNDAgLTc3IC03MSAtMTAwIC0zNSAtMjUgLTEzMiAtNDIgLTE0MyAtMjUgLTMgNSAwIDMzIDcgNjEgbDEyCjUyIC0zOSAzMCBjLTU5IDQ3IC0xMzQgMTI2IC0xMzQgMTQyIDAgMTMgMTIzIDc3IDE3MyA4OSAyOCA3IDQ3IDUxIDQ3IDEwNSAwCjI3IDkxIDI1MSAxMDEgMjQ3IDMgLTEgMzQgLTMzIDY3IC03MnogbTEzMjIgLTIxOCBjMCAtMiAtMzIgLTIzIC03MiAtNDcgLTM5Ci0yMyAtODYgLTU3IC0xMDIgLTc0IC00OSAtNDkgLTIzNyAtMjIxIC0yNzkgLTI1NSAtMjEgLTE2IC04NCAtNTMgLTE0MCAtODIKbC0xMDIgLTUxIDQ1IDQ3IGM2OSA3MyA5NSA5NyAyMjIgMTk3IDExMiA5MCAxNTYgMTMzIDEwNSAxMDcgLTUzIC0yOSAtMTg3Ci0xMjkgLTI4NSAtMjE1IC01OSAtNTEgLTEwOSAtOTAgLTExMSAtODggLTIgMiA4IDE5IDIzIDM4IDE0IDE5IDI2IDM5IDI2IDQzCjAgMTcgMTQxIDE2MiAyMDIgMjA4IDExMCA4MyAyNTcgMTQyIDQwNiAxNjQgMzEgNSA1OCA5IDYwIDEwIDEgMCAyIC0xIDIgLTJ6Cm0tODExMCAtMzkgYzExNiAtMzcgMjAzIC04NCAyODUgLTE1MCAxMDQgLTg2IDE1MiAtMTM4IDIwMyAtMjIxIDQ5IC03OSA1MwotOTQgMTQgLTUyIC03MCA3OCAtMzk0IDMyNiAtNDA4IDMxMiAtMiAtMiAyNCAtMjYgNTggLTUzIDE3OCAtMTM4IDM1OCAtMzA0CjMyOSAtMzA0IC0xNiAwIC0xOTAgOTggLTIzNiAxMzMgLTIyIDE3IC04NyA3NiAtMTQ1IDEzMSAtMTIwIDExNSAtMTY0IDE1MwotMjM1IDIwMyBsLTUwIDM1IDYwIC02IGMzMyAtNCA4OSAtMTcgMTI1IC0yOHogbTE0MSAtNDk3IGwzMyAtNDggMzQgMTQgYzE5IDgKMzYgMTIgMzkgMTAgNiAtNiAtMjEgLTY3IC00MSAtOTIgLTE1IC0xOSAtMTUgLTE4IC0xMCAxNSBsNSAzNSAtMjIgLTI5IC0yMwotMzAgLTI4IDYwIGMtMzAgNjUgLTM2IDU1IC0xMyAtMjIgOCAtMjcgMTUgLTUwIDE1IC01MSAwIC0yIC0zMSAtMyAtNjkgLTMKLTM5IDAgLTcyIC00IC03NSAtOSAtNiAtOSA0OSAtMjEgMTAxIC0yMSA0MSAwIDQ2IC0xMCAyNyAtNTUgLTIyIC01MyAtMTAgLTU0CjIwIC0yIGwyNyA0NSAyOSAtMjkgYzQwIC00MCA1NyAtMzcgMzAgNiAtMjcgNDMgLTEwIDQ2IDMxIDYgMjYgLTI3IDM4IC02OSAyMwotODQgLTMgLTMgLTI3IDEgLTUyIDggbC00NiAxNCAtNTIgLTQ5IGMtNzEgLTY4IC03OCAtNjYgLTcwIDE5IGw2IDY5IC00MyAxMApjLTQxIDExIC0xMjcgNjAgLTEyNyA3MyAwIDEyIDY4IDQwIDEyNSA1MiA0OSAxMCA1NSAxNCA1NSAzNyAwIDM1IDE5IDEwMCAyOQoxMDAgNSAwIDI0IC0yMiA0MiAtNDl6IG03Njc3IC0yNCBsNCAtNTMgNjEgLTEzIGM2NCAtMTMgMTE3IC0zNiAxMTcgLTUwIDAKLTE0IC03MyAtNTkgLTExNyAtNzIgbC00MyAtMTIgMCAtNjkgYzAgLTQ0IC00IC02OCAtMTEgLTY4IC03IDAgLTM0IDIyIC02MQo0OSBsLTQ4IDQ5IC0zOCAtMTQgYy00NSAtMTYgLTcyIC0xNyAtNzIgLTQgMCAyMSAyOCA3NiA0OCA5NCAzMiAyOCA0NyAxNSAyMgotMTcgLTMxIC0zOSAtMTYgLTQ3IDIxIC0xMSAzMiAzMSAzMiAzMSA2NSAtMjggMjEgLTQxIDM0IC0zNCAxOCAxMCAtNyAyMCAtMTMKNDIgLTE0IDQ4IDAgNyAzMyAxNSA4MyAxOSBsODIgOCAtNjUgOSBjLTM2IDQgLTczIDYgLTg0IDQgLTE1IC00IC0xNyAwIC0xMgoyMiA0IDE1IDkgNDUgMTEgNjcgbDUgNDAgLTI2IC01NCAtMjUgLTU1IC0yNCAzMCBjLTI2IDMyIC0zMCAyOSAtMTUgLTEwIDE0Ci0zOCAtMTUgLTIyIC0zNCAxOSAtMjIgNDUgLTIxIDY5IDIgNjAgNDcgLTIwIDU3IC0xNyA5MCAzMSA0MCA1NiA1MyA1MCA2MAotMjl6IG0tNjI5OSAtMjk2IGMxMSAtMzAgMTkgLTU2IDE3IC01OCAtOSAtOSAtNDYgNjcgLTQ2IDkyIDAgMzYgNCAzMiAyOSAtMzR6Cm00ODIyIC0yMSBjMTMgLTEwIDE5IC0xOSAxMyAtMjAgLTcgMCAtMjIgOSAtMzUgMjAgLTEzIDEwIC0xOSAxOSAtMTMgMjAgNyAwCjIyIC05IDM1IC0yMHogbS00NjY5IC0zMCBjLTMyIC0zMCAtNTIgLTM4IC01MiAtMjEgMCAxMCA1OSA0OSA3NSA1MCA2IDAgLTUKLTEzIC0yMyAtMjl6IG00MzE1IC02IGMzNSAtMTkgNzMgLTQ4IDg1IC02NCAxOSAtMjYgMjQgLTI4IDM3IC0xNiA5IDggMjggMTkKNDMgMjUgMzEgMTIgMzggMSAzOCAtNjAgMCAtMzMgNCAtNDEgMzAgLTU0IDI1IC0xMyAyOSAtMTkgMjAgLTM1IC0xOSAtMzUgLTU3Ci01NyAtOTAgLTUyIGwtMzIgNSA0MSAxOCBjNTIgMjMgNTIgMzMgMSAyNCBsLTQwIC03IDE1IDQ5IGM4IDI2IDE1IDUzIDE1IDU4Ci0xIDIxIC00MCAtNDIgLTQ2IC03MyAtMTAgLTUxIC0yMSAtNDcgLTQ1IDE4IC0xMiAzMyAtMjUgNTcgLTMwIDU1IC00IC0zIC0xMwo1IC0yMCAxNyAtMTcgMzIgLTY5IDkxIC02OSA3OCAwIC0xOSAyNyAtNjQgNTQgLTg5IDM0IC0zMiAzMyAtNDYgMCAtMjQgLTI3CjE3IC0yNyAxNyAtMTUgLTUgNiAtMTIgMTYgLTIyIDIxIC0yMiA0IDAgMjMgLTE5IDQxIC00MiBsMzMgLTQxIC0zOSA3IGMtODkKMTYgLTExNSAxOCAtMTE1IDEwIDAgLTkgMTA0IC00NSAxMjkgLTQ0IDggMCAzIC0xMCAtMTMgLTI1IC0xNCAtMTMgLTI2IC0zMAotMjYgLTM2IDAgLTcgMTEgLTIgMjUgMTEgMzQgMzIgNDEgMTkgMTMgLTI0IC0xNyAtMjcgLTI4IC0zNSAtNDMgLTMxIC0xMSAyCi0yOCA1IC0zNyA1IC0xMyAwIC0xNiA3IC0xMSAzNCA1IDMyIDIgMzYgLTMzIDU1IC0yMiAxMSAtNDggMjggLTU5IDM3IC0yMCAxNgotMjAgMTYgLTEgMjcgMTEgNyAzMyAyNCA1MCAzOCAyOCAyNSAyOSAyOCAxNyA1NSAtOCAxNiAtMTUgNDUgLTE3IDY0IC0yIDE5Ci02IDQ3IC05IDYzIC02IDM2IDUgMzUgODIgLTl6IG0tNTI2NSAtMjIgYzM0IC0yNiA3MCAtNjEgNzggLTc3IDE4IC0zNiAxOAotMTM4IDAgLTE4MCBsLTEyIC0zMCAtMjggODIgYy0yNCA3MSAtODAgMTc1IC04MCAxNDggMCAtNiAxNiAtNTcgMzUgLTExNCAxOQotNTggMzMgLTEwNyAzMSAtMTA5IC0xMCAtMTAgLTg1IDUzIC0xMTAgOTMgLTMzIDUxIC0zOSA1NSAtMzAgMjAgMyAtMTQgNCAtMjUKMiAtMjUgLTMgMCAtMjkgMTMgLTU5IDMwIC04NyA0OCAtMTAzIDM2IC0yNCAtMTcgMzggLTI1IDY0IC00OCA1OCAtNTAgLTcgLTMKMjMgLTIyIDY3IC00NCA0NCAtMjIgODAgLTQzIDgwIC00NyAwIC00IC0yNSAtMjIgLTU2IC0zOSAtNDcgLTI4IC02NSAtMzMKLTEyMCAtMzMgLTQxIDAgLTYzIC00IC01OSAtMTAgMyAtNSAyMyAtMTAgNDMgLTEwIGwzNyAwIC00NSAtMjYgYy01NCAtMzEKLTEzMyAtOTQgLTEyNiAtMTAxIDMgLTMgMTcgNCAzMyAxNSA0MiAzMCAxNTMgODMgMTUzIDc0IDAgLTQgLTQgLTEyIC05IC0xOAotMTMgLTE0IC0yNCAtNTQgLTE0IC01NCA0IDAgMjQgMjUgNDMgNTUgMjUgMzkgNDYgNTkgNzUgNzEgMjIgMTAgNDkgMjUgNTkgMzMKMTggMTUgMTkgMTUgMTMgLTkgLTQgLTE0IC03IC0zMyAtNyAtNDIgMCAtOSAtNiAtMjMgLTEzIC0zMCAtMjQgLTI1IC01NiAtODcKLTQ3IC05MyA1IC0zIDE2IDggMjUgMjUgOCAxNiAxNyAzMCAyMCAzMCAyIDAgMSAtNDIgLTIgLTkyIC0zIC01MSAtMyAtOTAgMQotODcgNCAzIDE2IDY5IDI3IDE0NSAxOCAxMjMgMjkgMTc0IDI5IDEzNCAwIC0xNiA3MiAtMTMwIDgzIC0xMzAgMTQgMCA2IDIzCi0yOCA4MCAtMTkgMzIgLTM1IDYwIC0zNSA2NCAwIDcgNjkgLTMxIDkyIC01MSAyMCAtMTcgNDQgLTgwIDUzIC0xMzUgbDYgLTM4Ci01MyAwIC01MyAwIC01OSAtODEgYy0zMiAtNDQgLTY0IC03OCAtNzAgLTc2IC0xOSA2IC04NyAxMDEgLTkzIDEzMSAtNiAyNyAtOAoyOCAtNDIgMjAgLTQyIC04IC0yOTEgLTEzIC0yOTEgLTUgMCAxMCAzNCA5NiA0MCAxMDEgMyAzIDEyIDIxIDIwIDQwIDE2IDQxCjkwIDE1MCAxMDIgMTUwIDEzIDAgOSAzMiAtNiA0NCAtMTkgMTUgLTExMCAxODYgLTEwMyAxOTMgNCAzIDU5IDggMTI0IDExIDY1CjIgMTI0IDkgMTMxIDE1IDcgNSAxNyAyOSAyMyA1MyA2IDI0IDE1IDQ0IDIwIDQ0IDQgMCAzNiAtMjEgNzEgLTQ4eiBtNjU2MCAtOApsMTYgLTQ5IDEyNyAtNyBjNzAgLTQgMTMwIC0xMCAxMzMgLTEzIDkgLTggLTU1IC0xMzQgLTkwIC0xNzggLTI4IC0zNSAtMjkKLTM5IC0xNSAtNjEgOSAtMTMgMjIgLTI5IDI5IC0zNyAyNCAtMjQgOTcgLTE0OSAxMDkgLTE4OCA2IC0yMCAxNSAtNDAgMjAgLTQ1CjUgLTYgOSAtMTIgOSAtMTUgMCAtOSAtMTk1IC02IC0yNzAgMyBsLTY1IDggLTM1IC02NyBjLTE5IC0zNiAtNDMgLTc0IC01MwotODMgLTE4IC0xNiAtMjAgLTE1IC00MCAxMyAtMTIgMTcgLTQwIDUzIC02MyA4MCAtMzggNDYgLTQ0IDUwIC04NSA1MCBsLTQ0IDAKLTMgNTAgYy00IDcxIDI5IDEzMSA4NyAxNjEgMjUgMTMgNDcgMjIgNDkgMTkgMiAtMiAtMTIgLTMzIC0zMSAtNjkgLTE5IC0zNgotMzIgLTY2IC0yOCAtNjYgOSAwIDQzIDQ2IDY2IDg5IDIyIDQ0IDI5IDMyIDQ0IC03OSAyMCAtMTQ1IDIyIC0xNTEgMzIgLTE0NAoxMCA2IDggNDUgLTcgMTI5IGwtNiAzMCAyNSAtMzAgYzM3IC00NCA0MSAtMjcgNiAyNyAtMTYgMjUgLTMzIDYzIC0zNiA4MyBsLTYKMzggNjMgLTM0IGM1MCAtMjcgNjggLTQzIDg0IC03NiAyMiAtNDQgNDggLTU5IDM5IC0yMyAtMyAxMSAtOSAyMyAtMTQgMjYgLTUKMyAtOSAxMCAtOSAxNiAwIDUgMTcgMCAzOCAtMTIgMTA2IC02NCAxNjQgLTkyIDE1NiAtNzcgLTEyIDIxIC0xMDcgOTEgLTE0NAoxMDcgLTQyIDE3IC0yOCAzMCAzMyAzMSBsNTIgMiAtNDUgOCBjLTI1IDQgLTY0IDggLTg4IDggLTM2IDEgLTEwNCAyOSAtMTQxCjU4IC02IDUgMjcgMjggNzUgNTQgMzEgMTUgNTAgMTkgNzQgMTQgMjMgLTUgMzAgLTQgMjYgNCAtNCA2IC0xNyAxMSAtMjkgMTEKLTIwIDEgLTE4IDQgMTMgMzEgMTkgMTYgNTMgMzkgNzUgNTEgMzAgMTYgMzUgMjMgMjIgMjYgLTEwIDIgLTQ3IC0xMiAtODIgLTMyCi02NiAtMzYgLTc2IC0zNiAtNTAgLTIgOCAxMSAxNSAyNCAxNSAyOSAwIDUgLTIzIC0xOSAtNTEgLTUyIC0yOCAtMzQgLTY0IC02OAotODAgLTc3IC0xNiAtOCAtMjkgLTEzIC0yOSAtMTEgMCAyIDE2IDUyIDM1IDExMiAxOSA2MCAzMyAxMTAgMzEgMTEzIC05IDgKLTU3IC05MCAtNzggLTE1NyAtMTkgLTY0IC0yMyAtNzEgLTM0IC01NiAtMTcgMjMgLTI4IDExNCAtMTkgMTU1IDExIDUxIDEyOQoxNjcgMTU5IDE1NyA2IC0yIDE4IC0yNiAyOCAtNTN6IG0tNDQ2OCAtNDEyIGM3IC0yMiA0MCAtMzAgNTEgLTEyIDMgNSAyNSAxNAo0OCAyMCAyMyA2IDUwIDEzIDYwIDE2IDE1IDUgMTcgLTIgMTcgLTQ3IDAgLTI5IC02IC03OSAtMTIgLTExMiAtMTQgLTY1IC0xNgotNjAgNjAgLTExNiBsMjcgLTE5IC0yMSAtMjggYy01NCAtNzMgLTE3MSAtOTUgLTI1MSAtNDkgLTIzIDE0IC00MyAyOSAtNDMgMzIKMCAzIDM5IDMgODggMCA3OSAtNiA4NSAtNSA2MiA4IC0yNCAxNCAtMjMgMTQgMzMgMTUgMzQgMCA1NyA0IDU3IDExIDAgNyAtMzUKOCAtMTE1IDMgbC0xMTQgLTcgMzcgNDAgYzIwIDIyIDQ3IDQzIDYwIDQ3IDI0IDggMjcgMTcgMTIgMzIgLTYgNiAtMSAyMiAxNQo0NiAxNCAyMCAyNSA0MSAyNSA0NiAwIDE2IC03NCAtNjMgLTExNCAtMTIxIC0yMSAtMzIgLTQ0IC01NiAtNTAgLTU0IC0xNyA2Ci0xOCA3MCAtMiAxMzMgMTggNjcgMTUgNzggLTcgMzMgbC0xNSAtMzIgLTYgMjkgYy0zIDE2IC0xMSA1NyAtMTcgOTIgLTYgMzQKLTE1IDYyIC0yMCA2MiAtNSAwIC03IC02IC00IC0xMiAyIC03IDYgLTU2IDEwIC0xMDggbDYgLTk1IC0yNyAzOCBjLTE1IDIwCi0yOSAzNSAtMzEgMzMgLTYgLTYgMTYgLTQ2IDQzIC03OSAxNiAtMTkgMjQgLTQxIDI0IC02OCAwIC00MiAtOSAtNDkgLTMxIC0yMwotNyA4IC0zMyAyNiAtNTggMzkgLTI1IDE0IC02MiAzNCAtODEgNDYgbC0zNSAyMSAzOCAtMzUgMzkgLTM2IC0yOSAtMyBjLTI0Ci0zIC0yMCAtNiAyOCAtMjEgMzEgLTkgNjcgLTI1IDgwIC0zNiBsMjMgLTE4IC02NyAtMjIgYy0zNyAtMTMgLTY5IC0yNyAtNzIKLTMyIC04IC0xMiA5IC0xMSA4MCA2IDMyIDggNjEgMTIgNjMgMTAgMiAtMiAtMSAtMTIgLTcgLTIzIC0yMSAtNDAgLTExMyAtNTQKLTE3NiAtMjggLTQwIDE3IC00MyAzMyAtMTUgNjkgMTEgMTQgMjAgMjggMjAgMzIgMCAzIC0xOCAzNyAtNDAgNzQgLTUyIDg3Ci01MiAxMDggLTIgMTE3IDM4IDggODYgOSAxMTEgMiAxMCAtMiAxNyAxMSAyMiA0MiA1IDI1IDIwIDg2IDM1IDEzNSBsMjcgOTAKNzcgLTgwIGM0MyAtNDQgODAgLTkxIDg0IC0xMDN6IG0yNDY0IDk4IGMxMiAtMzYgMjQgLTg1IDI4IC0xMTAgMTAgLTY5IDEyCi03MCA5NyAtNzQgNDMgLTEgODAgLTYgODQgLTkgOSAtOSAtMjIgLTg1IC01NyAtMTM3IGwtMjkgLTQ0IDE5IC0zMiBjMjYgLTQxCjI1IC00NyAtOSAtNjcgLTU2IC0zMyAtMTQ4IC0xNSAtMTc5IDM0IC0xNCAyMyAtMTIgMjMgNTggNCAxMDEgLTI3IDEwOCAtMTIKMTAgMjQgLTMzIDEyIC02MCAyNiAtNjAgMzEgMCAxMSA4MSA1MCAxMDYgNTAgMTAgMCAyNiA1IDM0IDEwIDEyIDcgOCAxMCAtMTUKMTAgbC0yOSAwIDM0IDMwIDM1IDMxIC01MCAtMjUgYy0yNyAtMTQgLTcwIC0zOSAtOTUgLTU1IGwtNDUgLTMxIC0zIDM2IGMtMwoyNyA1IDQ5IDI3IDg2IDM5IDYyIDM5IDY5IDAgMzIgbC0zMSAtMjkgNiAzNSBjMTEgNzMgMTggMTc1IDEyIDE2OSAtNCAtNCAtMTUKLTQ3IC0yNSAtOTUgbC0xOCAtODkgLTE2IDM4IGMtMjIgNTIgLTI5IDQ2IC0xMiAtMTAgMTQgLTUwIDE5IC04OSAxNyAtMTM3CmwtMiAtMzAgLTM2IDM1IGMtMjAgMTggLTQyIDQ2IC01MCA2MiAtMTUgMjggLTg2IDk4IC05MyA5MSAtMiAtMiAxMCAtMjUgMjcKLTUxIDI4IC00MyAyOSAtNDggMTQgLTYwIC0xNiAtMTEgLTE2IC0xMiAyIC0xMyAxMCAwIDQxIC0yMSA2OSAtNDcgbDUwIC00NgotMTIyIDcgYy04MSA0IC0xMjEgMyAtMTIxIC00IDAgLTUgMjAgLTEwIDQ0IC0xMCAyNCAwIDUzIC0zIDYzIC03IDE2IC02IDE1Ci04IC03IC0xNCAtMTQgLTQgMTYgLTUgNjUgLTEgODEgNSA4OSA0IDc3IC0xMCAtMjIgLTI3IC03OCAtNDggLTEyNSAtNDggLTU1CjAgLTEwNSAyMCAtMTUyIDYxIGwtMzYgMzIgNTEgNDYgNTEgNDYgLTE1IDYwIGMtOSAzMiAtMTYgNzkgLTE2IDEwMiBsMCA0MyAzOAowIGMyMCAwIDU3IC05IDgxIC0yMCA1NCAtMjUgNTYgLTI1IDY5IDQgMTUgMzMgMTQ2IDE3NiAxNTMgMTY4IDQgLTQgMTYgLTM2CjI3IC03MnogbTEyNjIgLTIzIGMwIC0yIC0xMiAtMTQgLTI3IC0yOCBsLTI4IC0yNCAyNCAyOCBjMjMgMjUgMzEgMzIgMzEgMjR6Cm0tMTkzMyAtNTYyIGMtNSAtMTE1IC0xOCAtMTYyIC01MyAtMjA0IC0yOCAtMzMgLTE0NCAtMTE2IC0xNDQgLTEwMiAwIDE2IDUzCjg2IDg2IDExNCAzOSAzMyA0NiA1NyA5IDMzIC0zNiAtMjQgLTMyIC02IDIxIDkxIDI1IDQ2IDQ0IDg4IDQyIDk0IC0zIDEwIC02MQotNzIgLTExMyAtMTYxIGwtMjYgLTQ1IDMgNDMgYzIgMjMgMSA0MiAtMyA0MiAtMyAwIC05IC0yOCAtMTIgLTYzIC0zIC0zNCAtMTUKLTgyIC0yNiAtMTA2IGwtMTkgLTQ0IC03IDQ3IGMtMTcgMTA5IDE4IDIwMyAxMDAgMjcwIDI3IDIzIDcwIDYxIDk1IDg2IDU0IDU0CjU0IDUzIDQ3IC05NXogbS0xMDk2IC0xMDAgYzMwIC02MSAzNyAtMTMxIDIzIC0yMDUgbC03IC0zMiAtMTkgNDggYy0xMCAyNwotMjIgODEgLTI3IDExOSAtOCA2NyAtOCA2OCAtMTAgMjAgbC0yIC01MCAtMTYgMzAgYy0zNCA2NSAtMTA1IDE3NiAtMTEwIDE3MQotMyAtMyAxMyAtNDMgMzYgLTg4IDQ2IC05MyA1MCAtMTA5IDIxIC04MyAtMzggMzUgLTMyIDYgMTIgLTUyIDQ5IC02NSA3OAotMTA5IDc4IC0xMTkgMCAtMyAtMTggMTAgLTM5IDI5IC0yMiAxOSAtNDkgNDAgLTYwIDQ3IC01OSAzMSAtMTAxIDE1OCAtMTAxCjMwOCBsMCA5MyA5NiAtODggYzc0IC02OCAxMDMgLTEwMiAxMjUgLTE0OHogbS0xODk0IDgzIGM3IC02IDEyIC0xMyA5IC0xNSAtNgotNiAtODMgMzQgLTkxIDQ3IC04IDEyIDYxIC0xNCA4MiAtMzJ6IG00NzUzIDI1IGMtMjcgLTE5IC05MiAtNDUgLTk4IC0zOSAtNwo3IDgzIDU2IDEwMyA1NiAxNyAwIDE3IC0yIC01IC0xN3ogbS00NzMwIC0xNTggYzAgLTEzIC0zNSAtNTcgLTUzIC02NiAtMjIKLTEyIC0xOSAtNiAxNyA0NCAxOCAyNCAzNiAzNSAzNiAyMnogbTQ2NzUgLTMxIGMxNSAtMTkgMjUgLTM4IDIyIC00MSAtOCAtNwotNjYgNjAgLTYxIDY5IDggMTIgMTAgMTEgMzkgLTI4eiBtLTQyOTggLTcyIGM2IC00IDI1IC0yNSA0MiAtNDYgMzAgLTM4IDQyCi05OCAyMiAtMTEwIC0xMyAtOSAtMzggMjYgLTQ2IDY0IC00IDE5IC0xMSA0MiAtMTYgNTAgLTE1IDI2IC0xMCAtNTggNSAtOTUgOAotMTkgMTEgLTM1IDcgLTM1IC01IDAgLTM4IDExIC03NSAyNSAtNjUgMjQgLTk2IDIwIC0zNSAtNSAxOCAtOCAyOCAtMTggMjUKLTI2IC00IC0xMCA1IC0xNCAzMiAtMTQgMjAgMCA0NCAtNSA1MiAtMTAgMTMgLTkgMTMgLTExIDAgLTIwIC04IC01IC00MiAtMTkKLTc1IC0zMCAtODIgLTI5IC0xOTYgLTg5IC0xNjkgLTkwIDIyIDAgNjggMTUgMTM3IDQ1IGwzOSAxNiAtMjcgLTM1IGMtMzQgLTQ0Ci0yMSAtNDcgMjAgLTUgMzQgMzUgMTE1IDk0IDExNSA4MyAwIC0yMCAtMjYgLTkzIC00MiAtMTE2IC0yMiAtMzEgLTIzIC00NSAtNAotMjkgMTIgMTAgMTMgNiA5IC0yNyAtOSAtNjcgMTQgLTU3IDI2IDExIDE0IDgwIDMwIDEzNyAzOSAxMzcgMyAwIDIzIC0xNyA0NAotMzcgNDYgLTQ1IDUxIC0yNSA2IDI2IC0yNyAzMSAtMjkgMzYgLTE0IDM5IDUzIDExIDEwNiAtNTIgMTA2IC0xMjMgMCAtMzUgMAotMzUgLTQ3IC0zNSAtNDMgLTEgLTUxIC01IC03NCAtMzUgLTQ5IC02NCAtMTAwIC0xMTYgLTEwOSAtMTEwIC0xNCA4IC02MSA5MQotNjUgMTEyIC0yIDE0IC0xMCAxNyAtMzYgMTUgLTM1IC0zIC0xODggMTQgLTIxNCAyNCAtMzAgMTIgLTE1IDM1IDgzIDEzMCAzNAozNCA2MiA2NyA2MiA3MyAwIDcgLTExIDI4IC0yNSA0OSAtMzAgNDQgLTI2IDQ3IDcyIDYzIDY5IDExIDczIDEzIDg1IDQ1IDEyCjM0IDIzIDQwIDQ1IDI2eiBtMzkyMyAtMjQgYzE0IC0zMCAyMSAtMzMgODkgLTQ0IDQwIC03IDc3IC0xNiA4MiAtMjEgNCAtNCAtNgotMzAgLTIzIC01NiBsLTMxIC00OCA1NCAtNDggYzY2IC01OSAxMTYgLTEyOCAxMDMgLTE0MSAtMTUgLTE1IC0xMzMgLTI4IC0xODkKLTIxIGwtNTAgNiAtMzUgLTcwIGMtMTkgLTM4IC00MCAtNzAgLTQ1IC03MiAtNiAtMiAtMzkgMzEgLTc1IDcyIC02MiA3MSAtNjcKNzUgLTEwNyA3NSAtNDIgMCAtNDMgMSAtNDMgMzQgMCA3MiAzOSAxMjYgOTEgMTI2IGwzMSAwIC0yNiAtMzEgYy00MyAtNTEgLTMyCi02OSAxNCAtMjQgMjkgMjggNDAgMzQgNDAgMjIgMCAtMTYgNDUgLTE4MSA1NSAtMjAyIDMgLTUgMyAxNiAxIDQ4IC0zIDQwIC0xCjU1IDYgNTEgOCAtNSA5IC0xIDMgMTIgLTQyIDEwMSAtNDUgMTE0IC0yOSAxMTQgOSAwIDQ1IC0yOCA4MCAtNjIgNjYgLTYzIDgwCi02OCA0MyAtMTcgLTE5IDI3IC0xNSA0MCA3IDIwIDEyIC0xMSAxMTYgLTQxIDE0MSAtNDAgMTAgMCAtOSAxMyAtNDEgMjggLTM3CjE4IC01NCAzMCAtNDUgMzQgOCAzIDAgNiAtMTYgNiAtMTcgMSAtNDggMTAgLTY5IDIwIC0yMCAxMSAtNTEgMjQgLTY3IDMwIC00NQoxNSAtMjYgMzEgMzcgMzEgMzAgMCA1NCA1IDU0IDEwIDAgNiAtNiAxMCAtMTIgMTAgLTcgMSA0IDEwIDI0IDIwIDgyIDQzIDQ5CjQ1IC01OSA0IC0zNCAtMTMgLTY0IC0yNCAtNjcgLTI0IC0zIDAgNiAyMyAxOSA1MiAxMyAyOCAyMSA1NiAxOCA2MiAtNCA1IC0yMAotMTkgLTM3IC01MyAtMjQgLTUyIC0zMSAtNjAgLTM3IC00NSAtMjEgNTQgLTQgMTA3IDQ0IDE0MiA0MSAyOSA0OSAyOCA2NyAtMTB6Cm0tMjg1MiAtMjgyIGMyMiAtMTQgNDkgLTM3IDYxIC01MiAyNyAtMzQgNDUgLTk5IDMzIC0xMjAgLTcgLTEzIC0yMCAtMyAtNjgKNTUgLTU4IDcxIC04MCA4MSAtNDkgMjIgOCAtMTcgMzAgLTQ3IDQ4IC02OCAzMSAtMzYgMzEgLTM2IDcgLTMwIC0yNiA4IC0xNDIKMzEgLTE5OCA0MSAtNTQgOSAtMjcgLTEyIDMzIC0yNSA1OSAtMTMgNjkgLTIzIDMzIC0zMiAtMzkgLTExIC0xNCAtMTYgMjcgLTcKMzggOSAxNTYgLTYgMTU0IC0yMCAwIC0zIC0yNCAtMjUgLTUzIC00OSAtMzQgLTI5IC03NyAtNTMgLTEyMSAtNjggLTg1IC0yOAotOTMgLTM2IC0zMiAtMzIgMjYgMyA0NyAzIDQ3IDEgMCAtMSAtMzAgLTMwIC02NiAtNjQgLTM2IC0zNCAtNjEgLTY0IC01NSAtNjYKNiAtMiAzOCAxOSA3MyA0NyAzNCAyOCA2NCA0OCA2NyA0NiAyIC0zIC0xIC0xMSAtNyAtMTcgLTE1IC0xNSAtMTUgLTI4IC0yCi0yOCA2IDAgMjAgMjEgMzEgNDggMTIgMjkgNDMgNjggODEgMTA0IDM0IDMyIDYzIDU2IDY1IDU0IDcgLTcgNyAtMTAwIDAgLTE1MQotNyAtNTAgLTcgLTUwIDYgLTE2IDE2IDQyIDIxIDM1IDM4IC00OCAxMCAtNTUgMTQgLTYxIDIxIC00MSA1IDE1IDMgNTEgLTYgOTkKLTggNDIgLTE3IDkwIC0yMCAxMDggbC01IDMyIDM3IC0yNCBjMjAgLTEzIDUwIC0zNCA2NSAtNDYgMTUgLTEyIDMxIC0xOSAzNAotMTYgNiA3IC0zNiA0OSAtOTIgOTEgLTQ3IDM2IC0zNSA0MiAzOCAyMSA1OCAtMTcgMTE4IC02OSAxMzcgLTEyMSAxNSAtMzkgMTMKLTQyIC0zMiAtNTUgLTQ2IC0xMiAtODggLTQ0IC04OCAtNjYgMCAtMTUgLTM3IC0xMjMgLTQ0IC0xMzEgLTkgLTkgLTYwIDMwCi0xMDYgODAgbC00NSA0OSAtNTAgLTI1IGMtNDcgLTI0IC0xNTUgLTU1IC0yNDkgLTcyIGwtMzkgLTcgNyA0NCBjMTUgOTMgNDEKMTY2IDk1IDI2MSAxNSAyNiAxNSAyNyAtNDcgODUgLTM0IDMyIC02MyA2NCAtNjQgNzIgLTIgOSAyOCAyNCA5MiA0NSA5NCAzMgo5NCAzMyAxMDIgNzIgMTUgNzMgMjEgNzQgMTA2IDIweiBtMTg0MiAtMTYgYzExIC00NyAxNCAtNTAgNTMgLTYwIDk3IC0yNSAxNDcKLTQxIDE0NyAtNDYgMCAtMTQgLTEwMyAtMTI0IC0xMTYgLTEyNCAtMjAgMCAtMTggLTkgMjUgLTk2IDIxIC00NCA0NCAtMTA2IDUxCi0xMzkgNyAtMzMgMTYgLTczIDIxIC04OCA5IC0yOSA4IC0yOSAtMjkgLTIzIC02NCAxMCAtMTk1IDQ2IC0yMzcgNjUgLTcxIDMzCi04NCAzMyAtMTA3IC0yIC0yNiAtNDAgLTEwOSAtMTAwIC0xMjIgLTg3IC01IDUgLTE5IDQzIC0zMSA4NiBsLTIyIDc3IC00OSAxOQpjLTY2IDI2IC02OSAzMCAtNDkgNzIgMjcgNTYgODUgMTAyIDE0NSAxMTUgMjkgNiA1NSAxMCA1NyA3IDIgLTIgLTExIC0xNCAtMjkKLTI3IC00OSAtMzQgLTExMCAtODkgLTk4IC04OSAxNCAwIDg5IDQ3IDExOCA3NCBsMjQgMjEgLTYgLTI1IGMtMjQgLTEwMSAtMzIKLTE2MyAtMjcgLTIwMSBsNiAtNDQgMTQgNzMgYzEzIDcyIDI0IDgyIDM0IDMyIDMgLTE0IDUgMiA0IDM1IDAgMzMgMCA3NyAxIDk4CmwyIDM4IDUxIC00MyBjMjggLTI0IDYxIC02MyA3NCAtODggMjcgLTUyIDYwIC05NiA1MSAtNjcgLTMgOSAtOSAyNCAtMTMgMzQKLTMgOSAyNCAtNyA2MiAtMzUgMzcgLTI5IDczIC01MiA3OCAtNTIgMTEgMCAtNTAgNzEgLTY2IDc4IC01IDIgLTIwIDE0IC0zNQoyNyBsLTI2IDIyIDU0IC0zIDU1IC00IC00MCAyMCBjLTIyIDExIC00OCAyMCAtNTcgMjAgLTIzIDAgLTY1IDI2IC0xMjIgNzcKLTQ1IDM5IC00NiA0MiAtMjQgNDggMTIgNCA1OCA4IDEwMiA4IDcwIDAgNzcgMSA2MSAxMyAtMTcgMTMgLTE2IDE0IDE4IDE0IDIwCjAgMzcgNCAzNyA5IDAgNSA5IDEzIDIxIDE2IDcxIDIzIC03MyAwIC0xOTYgLTMwIGwtMzAgLTggMjEgMjQgYzI4IDMxIDg4IDEyOQo4MiAxMzQgLTIgMyAtMjggLTI3IC01NyAtNjUgLTMwIC0zOSAtNTUgLTcwIC01NiAtNzAgLTIgMCAtMTAgLTMgLTE5IC02IC0xMgotNSAtMTYgMCAtMTYgMjIgMSA2NyA2MSAxNDggMTM1IDE4MCA1MiAyMyA2MiAxOCA3NSAtMzZ6IG00NjYgLTE1OCBjMjQgLTE5CjQ0IC01MyA0NCAtNzQgMCAtNyAtOSAtMiAtMjAgMTIgLTIyIDI5IC0zNyAyMiAtMjAgLTEwIDE0IC0yNiAxNyAtMjIgLTQ1IC00MgpsLTUwIC0xNiA1OSAtMSBjNTAgLTEgNTcgLTMgNTIgLTE4IC0xMSAtMjggLTI3IC0xMDUgLTIzIC0xMTAgMyAtMiAxNyAyNiAzMgo2MSBsMjggNjYgMzQgLTMwIGMzMCAtMjcgNTMgLTM4IDUzIC0yNSAwIDIgLTE0IDIwIC0zMSAzOSBsLTMwIDM1IDI1IDcgYzM4IDkKMzIgMjQgLTYgMTggLTMxIC01IC0zMiAtNSAtMTQgMTAgMjQgMjAgNzYgMjEgMTAwIDMgMTggLTEzIDE3IC0xNSAtMTMgLTM2CmwtMzEgLTIzIDE5IC0yNiBjMTAgLTE1IDIyIC0zNyAyNSAtNDkgOSAtMjcgLTEwIC0zMCAtNjMgLTEyIC0zMiAxMSAtMzQgMTAKLTgyIC00NSAtMjggLTMxIC01NiAtNTYgLTY0IC01NiAtMTYgMCAtMjUgMzIgLTI1IDk4IDAgNDYgLTIgNTIgLTIwIDUyIC0yNSAwCi04MCAyNyAtODAgMzkgMCAxMyAzNCAzOSA3MyA1NiAyMCA4IDM2IDE5IDM2IDIzIC00IDIzIDIgNzIgOSA3MiA0IDAgMTcgLTgKMjggLTE4eiBtLTI4NDYgLTMwIGMwIC0zNiAzIC00MCA0OSAtNjEgNzcgLTM0IDgwIC00NSAyMiAtNzAgLTI3IC0xMSAtNTQgLTIxCi01OSAtMjEgLTUgMCAtOSAtMjEgLTEwIC00NyAtMiAtNTggLTExIC0xMDMgLTIxIC0xMDMgLTE2IDAgLTUzIDM0IC04MiA3NgotMjMgMzMgLTM1IDQ0IC00NyAzOSAtMjYgLTExIC05MiAtMTggLTkyIC0xMSAwIDMgMTEgMjQgMjUgNDYgbDI1IDM5IC0yNSAyNwpjLTE0IDE1IC0yMiAzMCAtMTkgMzUgMTAgMTggNzIgMjEgMTAwIDUgbDI5IC0xNSAtMzIgLTEgYy00MCAwIC00MyAtMTUgLTcKLTI0IGwyNyAtNyAtMzQgLTI5IGMtNDQgLTM3IC0zMSAtNDkgMTcgLTE2IDIxIDE0IDM5IDI0IDQwIDIzIDEgLTEgMTUgLTMzIDMyCi03MiAzNCAtNzYgNDAgLTcxIDE3IDE1IC04IDMwIC0xNSA1OCAtMTUgNjIgMCA0IDIzIDQgNTIgMSA2MyAtOCA1OSA5IC03IDI3Ci0zMiA5IC00MyAxNiAtMzYgMjMgNiA2IDExIDIwIDExIDMyIDAgMTkgLTIgMTggLTIwIC01IC0xOSAtMjQgLTIwIC0yNCAtMjAKLTMgMCAyMCA1MSA3MyA3MSA3MyA1IDAgOSAtMTcgOSAtMzh6IG0xNTk4IC0yNTEgYzM3IC00OCA4MyAtMTE3IDEwMSAtMTUzIDMwCi01OCAzMyAtNzEgMjUgLTEwMCBsLTEwIC0zMyAtMjEgNDUgYy0xOSA0NCAtMTQ4IDI1MSAtMTg0IDI5OSAtMTAgMTMgLTE2IDI3Ci0xNCAzMiAxMSAxNyAzOSAtNyAxMDMgLTkweiIvPgo8cGF0aCBkPSJNMjg2NiA3MzA0IGMtMzYgLTM3IC02OCAtNzYgLTcyIC04NiAtMTAgLTM0IC0yMSAtMTggLTM1IDU1IGwtMTQgNzIKLTMgLTUwIGMtNSAtNzkgNCAtMTA3IDQ1IC0xMzMgNDAgLTI2IDE1MyAtNjYgMTYxIC01NyA5IDkgLTI5IDMyIC04NSA0OSAtMjkKOSAtNTMgMjIgLTUzIDI4IDAgNiAxOCAyOCA0MCA1MCAyMiAyMiAzNyA0NSAzNCA1MCAtNCA1IDkgMjUgMjcgNDQgMTggMTggMzAKMzYgMjcgNDAgLTQgMyAtMzYgLTI1IC03MiAtNjJ6Ii8+CjxwYXRoIGQ9Ik03NTE5IDczMTEgYzM0IC00MyA0MCAtNjEgMTQgLTQwIC0zNiAzMCAxIC0xNiA0NSAtNTUgbDQ1IC00MCAtNjgKLTIzIGMtNjMgLTIxIC0xMDAgLTQxIC05MiAtNDkgNyAtOCAxMTMgMjkgMTU4IDU0IDQ0IDI0IDQ3IDI5IDUzIDc2IDMgMjggNgo2MiA1IDc2IGwtMSAyNSAtOCAtMjUgYy01IC0xNCAtMTQgLTQ0IC0yMCAtNjcgLTYgLTI0IC0xNCAtNDMgLTE4IC00MyAtNCAwCi0xNSAxMiAtMjUgMjggLTE5IDMxIC0xMDMgMTIyIC0xMTIgMTIyIC00IDAgNyAtMTggMjQgLTM5eiIvPgo8cGF0aCBkPSJNNDUxMCAyMTIxIGMwIC02IDQgLTEzIDEwIC0xNiA2IC0zIDcgMSA0IDkgLTcgMTggLTE0IDIxIC0xNCA3eiIvPgo8cGF0aCBkPSJNNDQwMiAxMDcwIGMwIC0xNCAyIC0xOSA1IC0xMiAyIDYgMiAxOCAwIDI1IC0zIDYgLTUgMSAtNSAtMTN6Ii8+CjxwYXRoIGQ9Ik00MjE4IDk1MjQgYy03IC0xMSAxNiAtMjExIDI3IC0yMzcgNCAtMTAgMTYgLTIyIDI2IC0yOCAxNiAtOCAyMSAtNQoyOSAxNiAxNCAzNiAxMyA2OCAtMiA1OSAtNyAtNSAtOCAtMyAtMyA1IDQgNyAtNiA0MiAtMjIgNzkgLTE3IDM3IC0zNCA3OCAtNDAKOTEgLTUgMTQgLTEyIDIxIC0xNSAxNXoiLz4KPHBhdGggZD0iTTYyNTAgOTQ0MyBjMCAtOTQgMTkgLTIxNSAzNiAtMjM0IDIzIC0yNiAzMCAtMjQgNDIgOSAxMiAzNiAzIDg5Ci0zMSAxNjkgLTE1IDM0IC0yNyA2OSAtMjcgNzcgMCA4IC00IDE4IC0xMCAyMSAtNiA0IC0xMCAtMTIgLTEwIC00MnoiLz4KPHBhdGggZD0iTTQzMzYgOTM5NSBjMTAgLTYyIDkgLTg3IC0xMCAtMTI3IC0xNyAtMzQgLTE3IC0zOSAxIC04NyAxMCAtMjggMjAKLTUxIDIzIC01MSAxMCAwIDQwIDc2IDQzIDExMCBsMyAzNSA4IC0yOCBjNyAtMjIgMyAtNDEgLTE1IC03OSAtMjcgLTU3IC0zMQotMTE3IC05IC0xNDMgMTMgLTE1IDE2IC0xMiA0MSAzNyAzMCA1NyAzNiAxMTYgMTkgMTc5IC02IDIxIC0xOCAzOSAtMjggNDEKLTExIDMgLTI0IDI2IC0zNSA1OSAtOSAzMCAtMjQgNjQgLTMzIDc0IC0xNCAxOSAtMTUgMTggLTggLTIweiIvPgo8cGF0aCBkPSJNNDE1MCA5MzU1IGMwIC04MSA2MiAtMTg0IDEyNyAtMjExIDQyIC0xOCA0MyAtMTggNDMgNiAwIDM2IC0yMSA2NgotNjYgOTMgLTQ0IDI3IC04MyA4NyAtODQgMTI5IDAgOSAtNCAyMCAtMTAgMjMgLTYgNCAtMTAgLTEyIC0xMCAtNDB6Ii8+CjxwYXRoIGQ9Ik02Mzc0IDkzMjkgYzYgLTQ0IDMgLTY3IC0xMyAtMTEwIC0xMiAtMzAgLTIxIC02MyAtMjEgLTc1IDAgLTMzIDIxCi04NSAzMyAtODEgMTkgNiA1NyA4OSA1NyAxMjQgMCA1NCAtMzAgMTcwIC00NyAxODUgLTE0IDEyIC0xNSA3IC05IC00M3oiLz4KPHBhdGggZD0iTTYxNzAgOTMwNyBjMCAtNTEgMjkgLTEzNyA2MyAtMTg5IDI0IC0zNSA5MSAtNzggMTAzIC02NSAxNyAxNiAtMTgKODYgLTcwIDEzOCAtMzcgMzcgLTU4IDY4IC02NyA5OSAtMTggNjUgLTI5IDcxIC0yOSAxN3oiLz4KPHBhdGggZD0iTTQxNjUgOTIxMCBjMTggLTg4IDEwNSAtMTkwIDE2MiAtMTkwIDI4IDAgMzAgMjMgNSA2MyAtMTEgMjAgLTMzIDM0Ci02NyA0NSAtNDIgMTUgLTUzIDI0IC03MiA2MSAtMjkgNTggLTM3IDYzIC0yOCAyMXoiLz4KPHBhdGggZD0iTTY0NDAgOTE4MCBjMCAtMzQgLTggLTY3IC0yNSAtMTAwIC0yNyAtNTQgLTMyIC0xMTYgLTEyIC0xNDQgMTIgLTE2CjE0IC0xNiAzMSAzIDQyIDQ2IDU5IDE2OSAzNSAyNTQgLTE0IDUyIC0yOSA0NiAtMjkgLTEzeiIvPgo8cGF0aCBkPSJNNjE3NiA5MTMzIGMyMiAtMTE5IDEwNyAtMjIzIDE4MyAtMjIzIDI1IDAgMjYgMTYgNSA3MSAtMTQgMzMgLTI2CjQ0IC02OSA2MyAtNTMgMjQgLTkxIDYyIC0xMDEgMTAzIC0xMCAzOSAtMjYgMjYgLTE4IC0xNHogbTE1MSAtMTY1IGMzIC03IC04Ci0yIC0yNSAxMCAtMTcgMTMgLTM1IDI4IC0zOSAzNCAtMyA3IDggMiAyNSAtMTAgMTcgLTEzIDM1IC0yOCAzOSAtMzR6Ii8+CjxwYXRoIGQ9Ik03MDI2IDkwNTQgYy00MiAtNDIgLTgzIC04OSAtOTIgLTEwNiAtMTUgLTI4IC0xNyAtMjkgLTU3IC0yMiAtMjMgNQotNjIgOSAtODcgOSBsLTQ1IDAgMyAtNDggYzIgLTI2IDEyIC03MyAyMyAtMTA0IDE5IC01NSAxOSAtNTYgLTEgLTgzIC0xMSAtMTYKLTIwIC0zMyAtMjAgLTM5IDAgLTE5IDkwIC03MCAxMzQgLTc2IDIyIC00IDUzIC0yIDY3IDMgbDI2IDEwIDYgLTc2IGMzIC00MiA5Ci04OCAxMyAtMTAxIDYgLTIyIDIgLTIwIC00NSAxNyAtMjkgMjMgLTEwOSA2OSAtMTc3IDEwMiAtMTMyIDY1IC0yMjEgMTMwCi0yNjggMTk4IGwtMjkgNDIgMjggNTEgYzIyIDQyIDI3IDYyIDI2IDExOCAtMSA2NSAtMjkgMTc3IC0zMCAxMjMgLTEgLTEzIC0xNQotNjQgLTMyIC0xMTMgLTI0IC02OSAtMjkgLTk4IC0yNCAtMTI5IDQgLTIyIDQgLTQwIDEgLTQwIC0zIDAgLTE3IDE4IC0zMSAzOQotMTkgMjggLTQ1IDQ4IC05NiA3MiAtNTEgMjUgLTc2IDQ0IC05NiA3NCAtNDEgNjEgLTQxIDIwIDEgLTYyIDQ2IC05MyA5OAotMTM4IDE3MyAtMTU0IDUzIC0xMCA2MSAtMTUgODggLTU3IDE3IC0yNiA1MyAtNjUgODIgLTg5IGw1MiAtNDIgLTY3IDYgYy01OQo1IC0xNjQgLTYgLTI0MiAtMjQgLTIxIC01IC0yMyAtMyAtMTIgOCAxNyAxOCAxNSA0MyAtOCA5NCAtMjQgNTMgLTM0IDYwIC01NQozOSAtMTUgLTE1IC0xOSAtMTUgLTUzIC0xIC0yMCA5IC01MCAxOCAtNjcgMTkgLTI5IDMgLTMwIDIgLTI5IC00MyAwIC00NCAtMgotNDcgLTUzIC04NCAtMjkgLTIxIC02MiAtNDkgLTc0IC02MiAtMjIgLTIzIC0yMiAtMjMgLTMgLTM4IDEwIC04IDQ3IC0yNyA4MgotNDIgNDggLTIxIDY0IC0zNCA2OCAtNTMgMTYgLTcxIDIxIC03MyA4MSAtMzcgMjEgMTIgNTQgMjIgNzMgMjIgMzIgMCAzNiA0CjQ4IDM5IDEwIDMxIDEwIDQ2IDEgNjggLTYgMTYgLTEwIDMxIC03IDMzIDE1IDE1IDEzNiAyNyAyMjggMjIgMjA1IC0xMSAzMjQKLTYyIDQ2NCAtMTk4IDk0IC05MiAxMDkgLTEyMiAzNCAtNzEgLTYxIDQxIC0xMzkgNjQgLTIyMyA2NiBsLTcxIDEgLTIwIDQ5CmMtMjMgNTkgLTQ1IDc2IC03MyA1OSAtMTYgLTEwIC0yOCAtMTAgLTYyIDIgLTQ4IDE3IC02MiAxOSAtNTQgNiAzIC01IDAgLTEzCi02IC0xNiAtNiAtNCAtOCAtMjAgLTUgLTM5IDUgLTI3IC0xIC0zOSAtNTkgLTEwNiAtMzYgLTQxIC02MyAtNzkgLTYyIC04NSA0Ci0xMSAxMTggLTQ0IDE1NCAtNDUgMTcgMCAyMyAtOSAzMyAtNTAgNyAtMjggMTYgLTUzIDIxIC01NiA2IC0zIDMxIDE1IDU2IDQxCjM4IDM3IDUyIDQ1IDc3IDQzIDI4IC0zIDMxIDAgMzQgMjkgMyAzMCAtNiA3MyAtMjMgMTE2IC02IDE1IDAgMTcgNTkgMTcgMTAzCjAgMjM4IC02MSAyOTAgLTEzMiBsMjAgLTI4IC0xMDUgLTEwNiBjLTU3IC01OSAtMTM2IC0xNDAgLTE3NiAtMTc5IGwtNzEgLTcyCjMgLTg5NCBjMiAtNDkxIDEgLTg5NyAtMiAtOTAyIC0yIC00IC0xNCA1IC0yNiAyMCAtMTIgMTUgLTQ4IDYwIC04MCA5OCAtMzMKMzkgLTY5IDgxIC04MCA5NSAtNTAgNTkgLTI4MiAzMzggLTMxMSAzNzQgLTE3IDIxIC01NiA2NSAtODYgOTggLTMwIDMzIC02Mwo3MiAtNzUgODcgLTExIDE1IC00OCA1OSAtODIgOTcgLTMzIDM4IC03OCA5MCAtMTAwIDExNiAtMTU3IDE5MyAtMTk2IDIzOQotMjE1IDI1MyAtMTMgOCAtMTggMTUgLTEzIDE1IDE0IDAgLTQ1IDU4IC02NSA2MyAtMTAgMyAtMjggLTQgLTQwIC0xNSAtMjEKLTE5IC0yMSAtMjUgLTE5IC0zNDkgbDEgLTMyOSAzMCAtNDYgYzE2IC0yNiA3MyAtOTcgMTI3IC0xNTggOTYgLTExMCAxODgKLTIyMiAyNDcgLTMwMCAxNyAtMjMgMzggLTQ3IDQ3IC01NSAxMCAtNyAxNyAtMTkgMTcgLTI2IDAgLTYgLTQyIC01NSAtOTIKLTEwOCAtNTEgLTUzIC0xNjkgLTE3NiAtMjYzIC0yNzMgLTkzIC05NyAtMTgxIC0xODkgLTE5NSAtMjA0IC0xNCAtMTYgLTEyNgotMTMzIC0yNTAgLTI2MiAtMTI0IC0xMjggLTI2NiAtMjc2IC0zMTUgLTMyOCAtNDkgLTUyIC0xNTkgLTE2NyAtMjQ1IC0yNTUKLTg1IC04OCAtMTcwIC0xNzcgLTE4OCAtMTk4IGwtMzMgLTM4IDMwIC00NyBjMTcgLTI2IDQ0IC02MiA2MCAtNzkgMTYgLTE4IDU3Ci02NSA5MiAtMTA0IDM1IC0zOSA3MCAtODIgNzggLTk0IDIxIC0zNCA1NCAtNDkgNzggLTM3IDEwIDYgNzkgNzUgMTUzIDE1MwoyMjQgMjM3IDY0OSA2NjkgNjU5IDY2OSA0IDAgNiAtMzY3IDYgLTgxNiAwIC03OTYgMCAtODE2IDE5IC04MzAgMTEgLTggMjkKLTE0IDQwIC0xNCAxMiAwIDEwMiA4MyAyNDMgMjI1IGwyMjMgMjI0IDAgMTE0OCAwIDExNDcgMzYgLTM1IGMyMCAtMTggNTcgLTYxCjgyIC05NCAyNSAtMzMgNjYgLTgzIDkxIC0xMTEgMjUgLTI4IDc4IC04OCAxMTYgLTEzNCAzOSAtNDYgOTAgLTEwNyAxMTUgLTEzNQoyNSAtMjggODEgLTk2IDEyNSAtMTQ5IDQ0IC01NCA5OSAtMTE5IDEyMSAtMTQ1IDIzIC0yNSA2MyAtNzMgOTAgLTEwNyAyNyAtMzMKODEgLTk4IDEyMSAtMTQ1IDM5IC00NiA5NiAtMTEzIDEyNSAtMTQ5IDQ0IC01MyA2MCAtNjUgODMgLTY1IDIxIDAgMzMgNyA0MgoyNSAxMiAyNCAxOSAxNDMzIDE0IDMwODAgLTEgNDgxIC0xIDQ4NSAtMjIgNTAzIC0yOCAyMyAtMzMgMjIgLTcyIC0xMiBsLTMzCi0zMCAtNTEgNzggYy0yOSA0MyAtNjEgMTAyIC03MyAxMzIgLTIwIDUzIC0zOSAxNjkgLTI3IDE2OSAzIDAgMjggLTEyIDU0IC0yNgo0MCAtMjEgNTcgLTI1IDEwMSAtMjEgNzIgOCA4NSAxOSA2NyA2MSAtMTQgMzIgLTEzIDM0IDE2IDYyIDM5IDM3IDg5IDExMyA4OQoxMzQgMCAxMiAtMjEgMjQgLTcxIDQxIC03OCAyNiAtNzcgMjQgLTEwMiAxMzIgLTE4IDczIC01NSAxNjcgLTY3IDE2NyAtNCAwCi00MiAtMzQgLTg0IC03NnogbTEwMiAtNjYgYzEyIC00MCAyMyAtOTMgMjQgLTExNyBsNCAtNDUgNTcgLTE3IGM5MiAtMjcgODkKLTI2IDc2IC01MSAtNiAtMTIgLTMyIC00MyAtNTYgLTcwIC00MyAtNDUgLTQ1IC00OSAtMzQgLTc5IDYgLTE4IDExIC0zNCAxMQotMzUgMCAtMiAtMTggLTQgLTQwIC00IC00NSAwIC04NSAxNyAtMTE0IDQ5IC0yNCAyNyAtNyAyNyA0NSAwIDU3IC0yOSA2MSAtMTYKNiAxOCAtMjYgMTUgLTQ3IDMxIC00NyAzNCAwIDEwIDUwIDI5IDc4IDI5IDE1IDAgMzQgNSA0MiAxMCAxMiA4IDEwIDEwIC0xMAoxMSAtMjEgMSAtMTkgMyAxMiAxMyA1MCAxNSA1OCAyNiAxMyAxOSAtMjYgLTQgLTQwIC0yIC00NiA4IC01IDggLTkgOSAtOSAzIDAKLTEzIC05OCAtNzkgLTEwNSAtNzIgLTEwIDEwIDE5IDg1IDQ2IDExNyAzMCAzNyAzMSA1NSAxIDI4IC0xOCAtMTYgLTE4IC0xNQotNiA0NSA4IDM1IDEzIDcyIDEzIDgzIGwwIDIwIC05IC0yMCBjLTUgLTExIC0xNiAtNDcgLTI1IC04MCAtMTcgLTU5IC0xNyAtNTkKLTMxIC0zNSAtMTQgMjMgLTE0IDIxIC05IC0zNSAzIC0zMyAyIC03MyAtMyAtODkgbC04IC0zMCAtMjUgMzQgYy0xMyAxOSAtMjkKNDggLTM2IDY0IGwtMTEgMzEgLTEgLTI5IC0xIC0zMCAtMzIgMzAgYy01NSA1MCAtNzUgNjAgLTM0IDE3IDIxIC0yMyAzNiAtNDUKMzMgLTUwIC00IC02IDkgLTE3IDI4IC0yNiAxOSAtOSAzOSAtMjUgNDUgLTM3IDEwIC0xOSA4IC0yMCAtNDUgLTIwIC0zMCAwCi01NSAtNCAtNTUgLTEwIDAgLTUgMjIgLTEwIDQ5IC0xMCA2MSAwIDczIC0xNCAyNSAtMzAgLTQxIC0xNCAtODIgLTggLTExOSAxNgotMzAgMTkgLTMxIDMxIC03IDYyIDE4IDIzIDE3IDI1IC00IDcwIC0xMiAyNiAtMjUgNjQgLTI3IDg1IC03IDQ0IC0yIDQ1IDg2CjIyIDMyIC04IDYwIC0xNSA2MiAtMTUgMSAwIDE1IDIwIDI5IDQ0IDMxIDUzIDEyNSAxNTggMTM1IDE1MSA1IC0yIDE3IC0zNyAyOQotNzd6IG0tNzg2IC0xNDggYzIyIC0xNiAzNyAtMzAgMzIgLTMwIC0xMSAwIC04NCA0OCAtODQgNTUgMCAxMCAxMSA0IDUyIC0yNXoKbS0xNTQgLTE4NiBjMjEgLTE0IDI1IC0xNCA0NyAwIDI0IDE2IDI0IDE1IDMwIC0xNyA2IC0yOSAtNyAtODcgLTE5IC04NyAtMyAwCi0zIDE5IC0xIDQzIGw0IDQyIC0xMCAtMzUgLTExIC0zNSAtMzQgMzggYy0xOSAyMCAtMzYgMzcgLTM5IDM3IC0xMyAwIC0yIC0xOQozNSAtNTggbDM5IC00NCAtNDkgNCBjLTI4IDEgLTUwIDAgLTUwIC00IDAgLTUgLTEyIC04IC0yNyAtOSAtMTYgMCAtMzcgLTQKLTQ4IC05IC0yMSAtOSAzNCAtMTQgMTIzIC0xMCA0MCAxIDQzIDAgMzMgLTE4IC01IC0xMCAtMTcgLTI0IC0yNSAtMzIgLTkgLTcKLTE2IC0yMCAtMTYgLTI5IDAgLTEwIDEyIC0xIDMyIDIzIGwzMSAzOCAxNCAtMjMgYzEzIC0yMiAxNCAtMjAgOSAyNiBsLTUgNTAKMTUgLTM1IGM4IC0xOSAxNCAtNDggMTIgLTY1IC0zIC0yNiAtNyAtMzAgLTMzIC0zMCAtMTcgMCAtNDMgLTEwIC01OSAtMjIgLTQ0Ci0zNSAtNDYgLTM0IC01MCA0MSAtMSAxNSAtMTYgMjMgLTYzIDM3IC05OSAyNyAtMTAzIDMyIC01NyA2MyAyMSAxNCA0MiAyNiA0NgoyNiA0IDAgMTkgMTIgMzMgMjYgMjEgMjEgMjUgMzIgMjAgNTUgLTYgMjcgLTQgMjkgMjIgMjkgMTYgMCAzOSAtNyA1MSAtMTZ6Cm00NjYgLTI0OCBjMTQgMTggMTUgMTggMjUgLTkgNiAtMTYgMTAgLTQwIDEwIC01NSAtMiAtMjQgLTIgLTI0IC02IC00IC01IDI1Ci0yMyAzMCAtMjMgNyAwIC0yMCAtMTAgLTE5IC00MCA1IC00MCAzMSAtNDkgMjIgLTExIC0xMCAxOSAtMTYgMzIgLTMyIDMwIC0zNQotMyAtMyAtMjkgLTYgLTU3IC03IC00NCAtMiAtNTEgLTUgLTQ3IC0xOSA0IC0xMyAtMiAtMTkgLTI1IC0yNCAtMTYgLTQgLTI4Ci0xMCAtMjUgLTE1IDYgLTEwIDg4IDExIDEzMyAzNCAzOCAyMCA0MCAxMyAxNiAtNTggLTIyIC02MyAtMTEgLTcwIDE2IC0xMApsMjEgNDggMjUgLTI5IGMyNCAtMjkgMjUgLTI5IDE4IC01IC0zIDE0IC0xNCAzNCAtMjMgNDQgLTE2IDE5IC0xNiAxOSAxMSAwCjIxIC0xNSAyNyAtMjcgMjggLTU2IDAgLTM0IC0yIC0zNyAtMzIgLTQwIC0yMyAtMiAtMzYgLTExIC00NyAtMzIgLTkgLTE2IC0yMQotMjggLTI2IC0yOCAtNSAwIC0xNiAyMiAtMjUgNDggbC0xNSA0NyAtNTUgMyBjLTMxIDIgLTY2IDcgLTc5IDEyIC0yMiA4IC0yMAoxMSA0MyA2OSA2MSA1OCA2NSA2MyA1NiA5MiAtMTAgMzcgOSA0NSA1OCAyMiAzMCAtMTQgMzMgLTEzIDQ2IDV6IG01ODAgLTMyMwpjNyAtOTQgMiAtMzM1MCAtNSAtMzM1OCAtMyAtMiAtMzAgMjUgLTYwIDYxIC04OCAxMDggLTI2NSAzMjAgLTQwNCA0ODQgLTcxCjg1IC0xODEgMjE1IC0yNDMgMjg5IC02MSA3NSAtMTM1IDE2MSAtMTYyIDE5MiAtMjggMzEgLTYwIDY5IC03MiA4NSAtMTIgMTYKLTM4IDQ4IC01NyA3MCAtMjAgMjMgLTQ1IDUzIC01NyA2NyAtMTIgMTQgLTU0IDY1IC05NSAxMTQgLTQxIDQ5IC05MiAxMTEKLTExNCAxMzcgLTU5IDczIC0xMzkgMTY2IC0yNDIgMjg1IGwtOTMgMTA2IDAgMjk4IGMwIDE2MyAzIDI5NyA4IDI5NiA3IDAgMTY2Ci0xODYgNDU3IC01MzUgNTAgLTU5IDExMSAtMTMwIDEzNiAtMTU4IDI1IC0yOCA4OCAtMTAzIDEzOSAtMTY2IDUyIC02MyAxMDMKLTEyNCAxMTMgLTEzNSAyNSAtMjYgMjUzIC0yOTUgMjk1IC0zNDggMTkgLTIzIDM4IC00MyA0MiAtNDUgNiAtMiA5IDQwNiAxMAo5NzAgbDAgOTczIDEzMyAxMzIgYzcyIDczIDEzMyAxMzkgMTM1IDE0OCAyIDggOCAxMyAxMyAxMCAxMCAtNyA4MiA2MyA5MiA4OQoxNCAzNSAyNSAxMiAzMSAtNjF6IG0tMTE2MSAtMjgwNSBjLTEgLTM1OSAtMyAtODc2IC0zIC0xMTQ5IGwwIC00OTYgLTE5MgotMTkxIGMtMTA2IC0xMDUgLTE5NCAtMTg5IC0xOTYgLTE4NyAtMyAyIC00IDI5OCAtNCA2NTcgMSA2NDcgLTYgMTA2MSAtMTcKMTA1NiAtMTIgLTYgLTgxNiAtODM3IC04NDkgLTg3NyAtMTEgLTE0IC0yNSAtMjIgLTMzIC0xOSAtOCAzIC02OCA2NyAtMTMzCjE0MyBsLTExOSAxMzYgNTQgNTYgYzg2IDg5IDE2OCAxNzQgMjU4IDI2OSA0NiA0OSAxMzIgMTM5IDE5MCAxOTkgMTA2IDExMAoxNjYgMTczIDY4NyA3MTAgMTU0IDE2MCAyOTYgMzA3IDMxNCAzMjggMTggMjEgMzYgMzQgMzkgMjggNCAtNSA1IC0zMDQgNAotNjYzeiIvPgo8cGF0aCBkPSJNNzAyMyA3OTA1IGwtMTYyIC0xNjQgMCAtODUzIGMxIC00NjkgNCAtOTA3IDggLTk3MyAzIC02NiA0IC0xNDIgMQotMTY5IGwtNSAtNTAgLTkwIDEwOCBjLTEyOCAxNTMgLTQ4NyA1ODEgLTU0NCA2NDYgLTI2IDMwIC02OSA4MiAtOTYgMTE1IC0yNwozMyAtNTEgNjIgLTU1IDY1IC0xMSA5IC0yNTggMjk5IC0yODcgMzM4IC0xNSAyMCAtNDEgNTIgLTU4IDcwIC0xNiAxOSAtMzQgNDAKLTM4IDQ4IC00IDggLTEyIDE0IC0xNiAxNCAtNSAwIC04IC0xMDcgLTggLTIzNyBsMSAtMjM3IDMwIC0zMSBjMTcgLTE3IDc0Ci04NSAxMjggLTE1MCA1MyAtNjYgMTMzIC0xNjMgMTc4IC0yMTUgMTIxIC0xNDAgMjY3IC0zMTIgMzM4IC0zOTkgOTkgLTEyMgoxNzQgLTIxMSAyMTAgLTI1MCAxOCAtMjAgNDMgLTQ5IDU1IC02NSAyMyAtMjkgMTI0IC0xNTIgMTQyIC0xNzIgNSAtNiA0OCAtNTgKOTUgLTExNCA0NyAtNTYgMTI2IC0xNTAgMTc1IC0yMDggNTAgLTU3IDEwNCAtMTIyIDEyMCAtMTQzIDE3IC0yMSAzMyAtMzggMzgKLTM5IDQgMCA4IDQ0MiA4IDk4MyAxIDU0MCAzIDEyNjcgMyAxNjE1IDEgMzQ3IDAgNjMyIC00IDYzMiAtMyAwIC03OCAtNzQKLTE2NyAtMTY1eiIvPgo8cGF0aCBkPSJNNjAxOCA1ODUxIGMtMyAtOSAtMjk0IC0zMTYgLTQwOCAtNDMxIC0zNiAtMzYgLTE4MCAtMTg0IC0zMjAgLTMzMAotMTQwIC0xNDUgLTMzNiAtMzQ4IC00MzYgLTQ1MCAtOTkgLTEwMiAtMjAyIC0yMDkgLTIyOSAtMjM3IGwtNDggLTUzIDI0IC0yOQpjOTAgLTEwOSAxNzUgLTIwMSAxODUgLTIwMSA3IDAgMTcgNyAyMSAxNCA1IDggNDQgNTMgODggOTkgNDQgNDYgMTUyIDE1OSAyNDAKMjUzIDE2NSAxNzQgNDAwIDQxOCA0MjMgNDM4IDcgNiA0MyA0NiA4MSA4OCA0NiA1MSA3MSA3MiA3NSA2MyAzIC04IDQgLTQwMSAzCi04NzUgLTEgLTQ3MyAxIC04NjAgNCAtODYwIDQgMCA3NyA3MiAxNjIgMTYxIGwxNTYgMTYwIDAgMTA5NCBjMCA5NTAgLTQgMTE0MgotMjEgMTA5NnoiLz4KPHBhdGggZD0iTTI3ODcgODk4MyBjLTQgLTMgLTcgLTI1IC03IC00OSAwIC0yMyAtNyAtNzkgLTE2IC0xMjQgLTE2IC04OCAtMTIKLTE1MSAxMyAtMTc1IDIxIC0yMiAzNiAtMTggNTEgMTMgMjUgNTEgMjYgMTEzIDMgMTg4IC0xMSAzOSAtMjEgODQgLTIxIDEwMCAwCjMyIC0xMyA1OCAtMjMgNDd6IG0yMyAtMjUzIGMwIC0yMiAtNCAtNDAgLTEwIC00MCAtMTEgMCAtMTMgMzkgLTQgNjQgMTAgMjYKMTQgMTkgMTQgLTI0eiIvPgo8cGF0aCBkPSJNNzYxNiA4OTc0IGMtMyAtOSAtNiAtMjggLTYgLTQ0IDAgLTE1IC05IC01NyAtMjAgLTkyIC0xMSAtMzQgLTIwCi03NiAtMjAgLTkxIDAgLTQ2IDIyIC0xMTggMzggLTEyNCAzNSAtMTQgNzAgODUgNTMgMTUyIC02IDI0IC0xNCA4MSAtMTcgMTI5Ci03IDgzIC0xNSAxMDQgLTI4IDcweiBtMTMgLTI0NCBjMCAtMTQgLTQgLTMyIC05IC00MCAtNyAtMTEgLTEwIDMgLTkgNDUgMCA0MwozIDU0IDkgNDAgNSAtMTEgOSAtMzEgOSAtNDV6Ii8+CjxwYXRoIGQ9Ik0yOTI1IDg4NDIgYy02IC00IC0xMCAtMzcgLTEwIC03NCAtMSAtNTkgLTQgLTcxIC0zMSAtMTA1IC00MCAtNTAKLTc0IC0xMjcgLTc0IC0xNjkgMCAtMjkgNCAtMzQgMjMgLTM0IDMwIDAgNjAgMzMgODcgOTIgMTUgMzUgMjIgNzcgMjYgMTY2IDYKMTEzIDEgMTQwIC0yMSAxMjR6IG0tNDAgLTI4MiBjLTIzIC00NCAtMzAgLTMxIC05IDE2IDkgMjIgMTggMzQgMjEgMjcgMiAtNgotMyAtMjYgLTEyIC00M3oiLz4KPHBhdGggZD0iTTc0NzMgODgzNCBjLTkgLTI0IDYgLTIyNCAyMCAtMjY0IDE5IC01NSA2NyAtMTExIDkxIC0xMDggMTEgMiAyMgoxMSAyNCAyMSA1IDI2IC0yNiAxMTggLTQ4IDE0MiAtMzggNDIgLTYwIDEwMyAtNjAgMTY1IDAgNTcgLTEzIDc5IC0yNyA0NHoKbTc2IC0yNzEgYzEyIC0yNCAxOSAtNDMgMTcgLTQzIC04IDAgLTQ2IDY3IC00NiA4MCAwIDE4IDQgMTMgMjkgLTM3eiIvPgo8cGF0aCBkPSJNMjY1NCA4ODI5IGMtMTMgLTIyIDcgLTIyMiAyNyAtMjY5IDI0IC01NSA4NyAtMTE0IDEwNCAtMTAwIDI2IDIyCi0xNiAxNTMgLTYxIDE5MSAtMjQgMjAgLTQ0IDc4IC00NCAxMzAgMCA0NyAtMTIgNzAgLTI2IDQ4eiBtODYgLTI4NiBjMCAtMjMKLTE3IC02IC0yOSAyOSBsLTExIDMzIDIwIC0yNCBjMTEgLTEzIDIwIC0zMCAyMCAtMzh6Ii8+CjxwYXRoIGQ9Ik03NzQ2IDg4MDkgYy0zIC0xNyAtNiAtNDYgLTYgLTY0IDAgLTMxIC04IC00NSAtNzcgLTEzNiAtMjkgLTM2IC0zMwotNTAgLTMzIC0xMDAgMCAtNTEgMiAtNTggMTggLTUyIDQ3IDE3IDEwMiAxMDggMTA5IDE3OCAxNCAxNjQgMTQgMTg4IDYgMTk2Ci03IDcgLTEyIC0xIC0xNyAtMjJ6IG0tNDcgLTI0NSBjLTkgLTIyIC0xMyAtMjUgLTE2IC0xMiAtNSAxOSAxOCA2OSAyNCA1MiAyCi02IC0yIC0yNCAtOCAtNDB6Ii8+CjxwYXRoIGQ9Ik0yOTYxIDg1ODAgYy0xOCAtNzEgLTI4IC04OCAtNjQgLTExMiAtNDcgLTMwIC03MyAtNzQgLTgxIC0xMzAgLTYKLTQ3IC01IC00OCAyMiAtNDggMzMgMCA3MyAzNSAxMDUgOTMgMjggNDkgNTMgMTk3IDM4IDIyNCAtNyAxNCAtMTEgOSAtMjAgLTI3egptLTU1IC0xODkgYy0xOSAtMzYgLTM2IC00OCAtMzYgLTI2IDAgMzIgNDAgODcgNDggNjUgMiAtNSAtNCAtMjIgLTEyIC0zOXoiLz4KPHBhdGggZD0iTTc3NzEgODU2NiBjLTkgLTQyIC0yMSAtNjIgLTU3IC05NiAtNTIgLTUwIC03MSAtODIgLTgwIC0xMzkgLTYgLTM4Ci01IC00MSAxNiAtNDEgMzYgMCAxMDYgODAgMTI1IDE0MiAyMCA2OCAzMSAxNzMgMTggMTgxIC02IDQgLTE1IC0xNyAtMjIgLTQ3egptLTYxIC0xNzUgYy0yMiAtNDUgLTMwIC01MSAtMzAgLTIyIDAgMTkgMzkgNzUgNDcgNjcgMiAtMiAtNSAtMjIgLTE3IC00NXoiLz4KPHBhdGggZD0iTTI2MjUgODU2MCBjNCAtMzAgNyAtNjggNiAtODQgMCAtMTYgMTMgLTU0IDI5IC04NSA0NCAtODMgMTMwIC0xMzQKMTMwIC03NyAwIDQ2IC0yNCA5MiAtNzYgMTQyIC0zNiAzNSAtNTYgNjUgLTY1IDk1IC0xOSA2OCAtMzMgNzMgLTI0IDl6IG0xMDkKLTE5NCBjNCAtMTcgMSAtMTYgLTIwIDkgLTQyIDUwIC01MSA3NCAtMTYgNDEgMTcgLTE1IDMzIC0zOCAzNiAtNTB6Ii8+CjxwYXRoIGQ9Ik03NDQ2IDg1MTMgYzQgLTQ5IDEzIC0xMDAgMjAgLTExNCAzNCAtNjcgMTA2IC0xMjYgMTMzIC0xMDkgMTEgNiAxMQoxNyAxIDYxIC0xMCA0NSAtMjIgNjMgLTY2IDEwNCAtNDAgMzggLTU2IDYxIC02NiA5OCAtMTkgNzQgLTMwIDU1IC0yMiAtNDB6Cm0xMDAgLTEzNSBjOCAtMTUgMTQgLTMwIDE0IC0zNCAwIC05IC00NiA1MiAtNjIgODEgLTExIDIwIC0xMSAyMCAxMiAwIDEyIC0xMQoyOCAtMzIgMzYgLTQ3eiIvPgo8cGF0aCBkPSJNMjYwMCA4NDA5IGMxIC01NCAyNCAtMTU3IDQ2IC0yMDMgMjYgLTU2IDU5IC05NCA3MSAtODMgMyA0IDE1IC0xCjI1IC0xMCAyOCAtMjUgNDEgLTUgMzMgNTEgLTkgNTcgLTM4IDEwMiAtODkgMTM3IC0yNSAxNiAtNDUgNDEgLTU1IDY3IC0xOCA0NQotMzEgNjMgLTMxIDQxeiBtMTA5IC0xODUgYzEyIC0xNSAyMSAtMzYgMjEgLTQ4IC0xIC0yMSAtMSAtMjEgLTE2IC0xIC0yNiAzMwotNDUgNzUgLTM1IDc1IDUgMCAxOSAtMTIgMzAgLTI2eiIvPgo8cGF0aCBkPSJNNzc5NyA4NDAzIGMtMiAtNSAtMTAgLTI0IC0xNiAtNDMgLTggLTIyIC0zMSAtNTAgLTY1IC03NiAtNDUgLTM2Ci01NCAtNDkgLTY0IC05NCAtNyAtMjggLTEyIC01OCAtMTIgLTY2IDAgLTIyIDI3IC0yOCA0NSAtMTAgOSA4IDI0IDIxIDM0IDI4CjMyIDIzIDcwIDk2IDgxIDE1NSA1IDMyIDEzIDcwIDE2IDg2IDYgMjUgLTggMzkgLTE5IDIweiBtLTM3IC0xNDYgYzAgLTcgLTE5Ci0zNSAtNDIgLTYyIC0yMyAtMjggLTM4IC00MiAtMzUgLTMyIDQgMTAgNyAyNSA3IDM0IDAgMTQgNTIgNzMgNjQgNzMgMyAwIDYKLTYgNiAtMTN6Ii8+CjxwYXRoIGQ9Ik0yOTc3IDgzOTMgYy00IC0zIC03IC0xNiAtNyAtMjggMCAtMjcgLTI4IC01NyAtODQgLTkwIC0yOCAtMTcgLTQ4Ci0zNyAtNTYgLTU4IC02IC0xOCAtMTkgLTQ1IC0yNyAtNjAgLTE0IC0yNiAtMTQgLTMxIDAgLTQ0IDEzIC0xNCAyMCAtMTQgNDYKLTMgNDUgMTggMTA4IDkxIDEyMSAxNDIgNyAyMyAxNiA1MyAyMSA2NiAxOCA0NiA4IDk4IC0xNCA3NXogbS03OCAtMTk0IGMtMTcKLTIyIC0zMyAtMzggLTM1IC0zNiAtOCA4IDE3IDYyIDMzIDc0IDMyIDI0IDMzIDEgMiAtMzh6Ii8+CjxwYXRoIGQ9Ik03NDI1IDgzNDMgYzggLTY1IDQxIC0xNDYgNzQgLTE4MCAyMiAtMjQgOTIgLTYzIDExMSAtNjMgMTYgMCAxMiA0NAotMTAgOTQgLTE5IDQyIC05NyAxMTYgLTEyMiAxMTYgLTUgMCAtMTcgMjAgLTI4IDQ1IC0xMSAyNSAtMjIgNDUgLTI1IDQ1IC00IDAKLTMgLTI2IDAgLTU3eiBtOTYgLTExMCBjMjQgLTIxIDUzIC03MyA0MCAtNzMgLTggMCAtNDYgNDUgLTY1IDc4IC0xMCAxNyAwIDE1CjI1IC01eiIvPgo8cGF0aCBkPSJNNzgxNyA4MjQ4IGMtNCAtMTYgLTkgLTM4IC0xMiAtNTEgLTIgLTEzIC0zMSAtNTAgLTY0IC04MyAtNjIgLTYyCi04OSAtMTIyIC03NyAtMTcwIDggLTI5IDEyIC0yOSA1MyAtNCA2OCA0MSAxMTcgMTY0IDExMSAyNzcgLTMgNDcgLTUgNTMgLTExCjMxeiBtLTQ3IC0xNzMgYzAgLTE1IC0zMCAtNjIgLTUxIC04MCAtMjAgLTE4IC0yMiAtMTggLTE2IC0yIDQgMTAgNyAyMiA3IDI2CjAgMTMgNDAgNjEgNTEgNjEgNSAwIDkgLTIgOSAtNXoiLz4KPHBhdGggZD0iTTI1ODYgODI1MCBjLTkgLTI0IDEwIC0xNTAgMzEgLTIwOCAyMSAtNTYgOTIgLTEyOCAxMTcgLTExOSAxOSA3IDMwCjYxIDE3IDg0IC01IDEwIC0xMyAyOSAtMTYgNDMgLTMgMTQgLTI4IDQzIC01NSA2NSAtMzcgMzAgLTUzIDUzIC02OCA5NSAtMTIKMzUgLTIyIDUwIC0yNiA0MHogbTkyIC0xOTcgYzEwIC0xNiAyNSAtMzkgMzIgLTUzIGwxMyAtMjUgLTI4IDI1IGMtMzAgMjggLTYwCjgwIC00NiA4MCA1IDAgMTggLTEyIDI5IC0yN3oiLz4KPHBhdGggZD0iTTIwOTcgODEwMCBjMiAtMTIxIDEzIC0xNzkgMzggLTIwMCAyMyAtMTkgMzcgMjMgMzIgOTMgLTYgNzggLTQ2CjIyNyAtNjEgMjI3IC04IDAgLTEwIC0zOSAtOSAtMTIweiBtNDIgLTExNyBjMCAtMjUgLTEgLTI2IC05IC04IC0xMiAyNyAtMTIKMzUgMCAzNSA2IDAgMTAgLTEyIDkgLTI3eiIvPgo8cGF0aCBkPSJNODMwMSA4MjAxIGMtNiAtMTEgLTExIC0zMCAtMTEgLTQzIDAgLTEzIC05IC00MiAtMjAgLTY2IC0yNSAtNTUKLTM1IC0xMjkgLTIxIC0xNjQgMTIgLTMzIDIxIC0zNCA1MCAtMTAgMjAgMTYgMjIgMjggMjUgMTU1IDMgMTM2IC0zIDE2NyAtMjMKMTI4eiIvPgo8cGF0aCBkPSJNMjk3NSA4MTgwIGMtNyAtMzMgLTczIC05MCAtMTA1IC05MCAtMjMgMCAtNTMgLTM1IC04NSAtOTkgLTMwIC02MQotMjMgLTc2IDMwIC02NiA1MyAxMCAxMDYgNTYgMTMzIDExNSAzMiA3MiA1MyAxNTMgNDIgMTYzIC00IDUgLTExIC01IC0xNSAtMjN6Cm0tNzAgLTEzOCBjLTUgLTE3IC04NSAtNzEgLTg1IC01OCAwIDggODQgODUgODggODEgMiAtMiAxIC0xMiAtMyAtMjN6Ii8+CjxwYXRoIGQ9Ik03NDMwIDgxNjAgYzAgLTQ4IDYwIC0xNzIgOTYgLTE5NyAzMSAtMjEgODcgLTQzIDExMSAtNDMgMTEgMCAxMyA4CjcgMzMgLTExIDUzIC02MCAxMTMgLTEyNCAxNTMgLTMzIDIwIC02MCA0MCAtNjAgNDQgMCAzIC03IDE1IC0xNSAyNiAtMTMgMTgKLTE0IDE3IC0xNSAtMTZ6IG0xMzEgLTEzNyBjMjUgLTI4IDMxIC00MyAxOSAtNDMgLTEyIDAgLTcwIDYwIC03MCA3MyAwIDExIDMyCi03IDUxIC0zMHoiLz4KPHBhdGggZD0iTTU5MzAgODEyMSBjMCAtNSAxMCAtMTMgMjMgLTE3IDEyIC00IDUxIC0zOCA4NyAtNzYgNjQgLTY4IDEzMyAtMTA4CjE1NCAtODggMTUgMTUgLTQgNjAgLTQyIDEwMSAtMzAgMzIgLTUyIDQ0IC0xMjIgNjQgLTk2IDI4IC0xMDAgMjggLTEwMCAxNnoKbTE4NSAtMTAxIGMxNiAtMTYgMjQgLTMwIDE5IC0zMCAtNiAwIC0yMyAxNCAtMzkgMzAgLTE2IDE3IC0yNCAzMCAtMTkgMzAgNiAwCjIzIC0xMyAzOSAtMzB6Ii8+CjxwYXRoIGQ9Ik02MTU5IDgwODIgYzIwIC0yMiA1MSAtNjQgNzAgLTk1IDM0IC01NSA3NyAtODcgMTE2IC04NyAxNSAwIDE3IDcKMTIgNDAgLTggNjMgLTQ5IDEwNyAtMTM0IDE0NiAtNDEgMTkgLTgwIDM0IC04NyAzNCAtOCAwIDMgLTE3IDIzIC0zOHogbTEzOAotOTIgYzI0IC0zMCAxMiAtMzMgLTE3IC01IC0xNiAxNiAtMzAgMzMgLTMwIDM4IDAgMTAgMjggLTkgNDcgLTMzeiIvPgo8cGF0aCBkPSJNNTcxNyA4MTAyIGMtNTUgLTQgLTU0IC0yMiAxIC0yMiA1NiAwIDk5IC0xNiAxMzkgLTUxIDQxIC0zNSA4MyAtNTUKMTI4IC02MSA0MCAtNCA0NSAyNyAxMCA2NCAtMzYgMzkgLTczIDU2IC0xMzYgNjMgLTMwIDMgLTYzIDcgLTc0IDkgLTExIDEgLTQxCjAgLTY4IC0yeiBtMjI1IC03MyBjNDMgLTMxIDI2IC0zNSAtMTkgLTUgLTIwIDE0IC0zMiAyNiAtMjQgMjYgNyAwIDI2IC05IDQzCi0yMXoiLz4KPHBhdGggZD0iTTIyMzAgODAzOSBjMCAtNTYgLTQgLTcyIC0zMCAtMTEwIC0xNiAtMjQgLTMwIC01MiAtMzAgLTYyIDAgLTEwIC02Ci0yNCAtMTMgLTMyIC0xMiAtMTEgLTE3IC04IC0zMiAxOCAtMTAgMTggLTMzIDQ4IC01MSA2OSAtMjUgMjggLTM0IDQ5IC0zOSA5MQotNSAzNiAtMTMgNTggLTIzIDYyIC0yMyA5IC0xMCAtMTM5IDE4IC0yMDggMzIgLTc4IDEyMCAtMTI5IDEyMCAtNzAgMCAxNCA0CjEyIDE3IC03IDkgLTE0IDE4IC0yNyAxOSAtMjkgNyAtOSA1NSA1OCA2NCA4OSAxNiA1NSAxMyAyMTMgLTUgMjM2IC0xMyAxNwotMTQgMTMgLTE1IC00N3ogbS03IC0xNTkgYy01IC0xOSAtMjMgLTM5IC0yMyAtMjUgMCA5IDIwIDQ1IDI0IDQ1IDIgMCAyIC05Ci0xIC0yMHogbS0xMzMgLTQxIGMwIC02IC00IC03IC0xMCAtNCAtNSAzIC0xMCAxMSAtMTAgMTYgMCA2IDUgNyAxMCA0IDYgLTMKMTAgLTExIDEwIC0xNnoiLz4KPHBhdGggZD0iTTgxNzMgODA3OSBjLTYgLTggLTE0IC00OCAtMTggLTkxIC04IC04OCAxMCAtMTYwIDUwIC0xOTggMjYgLTI1IDU1Ci0yMSA1NSA3IDAgMzMgLTIyIDk2IC00NSAxMzQgLTE3IDI2IC0yNSA1NSAtMjcgMTAwIC0yIDQ5IC02IDU5IC0xNSA0OHogbTM2Ci0yMzkgYzAgLTkgLTQgLTggLTkgNSAtNSAxMSAtOSAyNyAtOSAzNSAwIDkgNCA4IDkgLTUgNSAtMTEgOSAtMjcgOSAtMzV6Ii8+CjxwYXRoIGQ9Ik0yNTYyIDc5OTIgYzQgLTk5IDI4IC0xNTkgODQgLTIxOCA0NCAtNDggNTkgLTQxIDU4IDI3IC0xIDY0IC0yMwoxMTEgLTc0IDE1OSAtMjcgMjUgLTM5IDQ3IC00NSA3OCAtMTMgNzcgLTI4IDQ4IC0yMyAtNDZ6IG05NyAtMTQ0IGM2IC0xNiA2Ci0yOCAxIC0yOCAtMTEgMCAtNDYgNTcgLTU0IDkwIC03IDI0IC02IDI0IDE4IC01IDE0IC0xNiAzMCAtNDIgMzUgLTU3eiIvPgo8cGF0aCBkPSJNNjMzMiA4MDYzIGM5IC0xMCAzMCAtNDcgNDcgLTgyIDM0IC03MiA2MiAtMTA2IDEwMyAtMTI3IDQ2IC0yNCA1MQotMTkgNDUgMzYgLTggNjggLTM1IDEwMiAtMTE3IDE1MCAtNzQgNDMgLTEwNCA1MiAtNzggMjN6IG0xNDQgLTEzNSBjOCAtMTYgMTEKLTI4IDcgLTI4IC05IDAgLTYzIDc0IC02MyA4NiAwIDEzIDQyIC0zMCA1NiAtNTh6Ii8+CjxwYXRoIGQ9Ik03ODQwIDgwNTkgYzAgLTI5IC0zOSAtOTYgLTY3IC0xMTQgLTM0IC0yMiAtNjMgLTg3IC02MyAtMTQwIDAgLTg2CjU0IC02OCAxMDkgMzYgMjkgNTQgMzQgNzcgMzkgMTUyIDMgNjEgMSA4NyAtNyA4NyAtNiAwIC0xMSAtMTAgLTExIC0yMXogbS0zMAotMTU0IGMwIC0xMyAtMzAgLTYyIC00NCAtNzQgLTIzIC0yMCAtMjEgNiA0IDQ3IDE3IDI4IDQwIDQzIDQwIDI3eiIvPgo8cGF0aCBkPSJNODM4OCA4MDIxIGMtNCAtNTQgLTggLTY0IC00OSAtMTA4IC01MSAtNTUgLTgwIC0xMjYgLTYwIC0xNDYgMTAgLTkKMjIgLTEgNjAgMzkgNTIgNTcgNjYgOTQgNzcgMjAyIDUgNjEgNCA3MiAtOSA3MiAtMTEgMCAtMTYgLTE1IC0xOSAtNTl6IG0tNDgKLTE4NyBjLTE4IC0yMSAtMjQgLTEwIC04IDE1IDcgMTIgMTQgMTcgMTYgMTEgMiAtNiAtMiAtMTcgLTggLTI2eiIvPgo8cGF0aCBkPSJNNjUwMCA4MDMxIGMwIC01IDYgLTE0IDE0IC0yMCA4IC03IDI0IC00MiAzNiAtNzggMjUgLTc2IDQzIC0xMDggODUKLTE0NSBsMzAgLTI3IC0zMCA1IGMtNzYgMTQgLTEwNyA4IC0xNjMgLTMxIC0yOCAtMTkgLTYyIC0zNyAtNzYgLTQxIC0yOSAtNwotNDUgLTI0IC0yNCAtMjUgNyAwIDU0IC0xIDEwMyAtMiA4MSAtMSA5NyAyIDE2MCAzMCBsNzAgMzIgLTMgNjMgYy0zIDgxIC0zNQoxMzQgLTEyMCAyMDAgLTYyIDQ3IC04MiA1NyAtODIgMzl6IG0xMzcgLTE2MCBjOCAtMTggMTIgLTM1IDEwIC0zNyAtNiAtNiAtMzUKMzkgLTQ4IDczIC05IDI0IC04IDI1IDcgMTIgMTAgLTggMjMgLTI5IDMxIC00OHogbS02MiAtMTUwIGMtMTEgLTQgLTMzIC0xMQotNTAgLTE1IC0yOCAtNiAtMjkgLTUgLTExIDkgMTEgOCAzNCAxNSA1MCAxNCAyNiAwIDI4IC0yIDExIC04eiIvPgo8cGF0aCBkPSJNNTYxNSA3OTk0IGMtMjcgLTcgLTY0IC0xNCAtODIgLTE0IC01MSAwIC00OCAtMTggNCAtMjUgMjcgLTMgNzYKLTEyIDExMCAtMjAgMTE2IC0yOCAyMTggLTE0IDIxOCAyOSAwIDQyIC0xNDcgNTkgLTI1MCAzMHogbTE3NSAtMjQgYzE5IC02IDkKLTggLTM1IC04IC00MiAtMSAtNTQgMiAtNDAgOCAyNCAxMCA0MiAxMCA3NSAweiIvPgo8cGF0aCBkPSJNMjkzOSA3OTY2IGMtMTUgLTI2IC0zMiAtMzkgLTU4IC00NiAtODAgLTIxIC0xNTAgLTk3IC0xNTEgLTE2MiAwCi0zMyA5IC0zNCA3MyAtMTIgNjggMjMgMTE2IDg2IDE2NyAyMTggMTUgNDAgLTcgNDIgLTMxIDJ6IG0tNTkgLTEwNCBjMCAtMTcKLTczIC03MiAtOTUgLTcyIC0xNSAwIDE5IDQzIDQ4IDYwIDM1IDIyIDQ3IDI1IDQ3IDEyeiIvPgo8cGF0aCBkPSJNNzQ0MCA3OTgzIGMwIC0zNCA3MSAtMTYyIDEwOCAtMTk0IDQxIC0zNiAxMTcgLTczIDEzMiAtNjQgMTUgOSAxMgo0NiAtOSA5MCAtMjQgNTIgLTQ0IDY5IC0xMTMgOTUgLTM1IDEzIC02OSAzNCAtODcgNTYgLTIzIDI2IC0zMSAzMCAtMzEgMTd6Cm0xNTQgLTE1MCBjMjIgLTIwIDQzIC00MSA0NSAtNDYgNiAtMTcgLTU0IDIxIC04MyA1MiAtNDIgNDQgLTEyIDM5IDM4IC02eiIvPgo8cGF0aCBkPSJNNTkwMCA3OTMzIGMtOCAtMyAtNDEgLTIzIC03MiAtNDUgLTM1IC0yMyAtNjkgLTM4IC05MCAtMzkgLTE4IC0xCi00NCAtNCAtNTggLTkgLTIyIC02IC0yMyAtOCAtNyAtMTUgMjggLTEyIDIxMyAzIDI1NSAyMSA0NyAxOSA5MiA2MiA4NSA4MCAtNQoxNCAtODIgMTkgLTExMyA3eiBtNDUgLTQyIGMtNiAtNSAtMjYgLTEyIC00NSAtMTUgLTM1IC03IC0zNSAtNyAtMTAgOCAyNyAxNwo3MCAyMiA1NSA3eiIvPgo8cGF0aCBkPSJNMjI3NiA3ODk3IGMtMyAtMTIgLTYgLTMzIC02IC00NiAwIC0xMyAtMTggLTQ3IC0zOSAtNzUgLTM4IC00OSAtNjMKLTExNiAtNTQgLTE0MyA4IC0yMiAzOCAtMTQgNjYgMTUgMzcgMzkgNTcgMTAzIDU3IDE4OCAwIDcyIC0xMiAxMDQgLTI0IDYxegptLTI1IC0xNzkgYy01IC0xNCAtMTYgLTI4IC0yNSAtMzEgLTExIC01IC0xMCAyIDYgMjkgMjMgMzkgMzQgNDAgMTkgMnoiLz4KPHBhdGggZD0iTTM1NjEgNzg4MCBjLTEwNCAtNDMgLTEyNSAtNTggLTE1MiAtMTEyIC03MCAtMTM3IDY3IC0xMDIgMTYzIDQxIDE3CjI1IDQ1IDU4IDYyIDczIDE3IDE0IDI5IDI5IDI2IDMxIC0zIDMgLTQ3IC0xMiAtOTkgLTMzeiBtLTY5IC0xMDMgYy0yMyAtMjMKLTQyIC0zNiAtNDIgLTMwIDAgMTcgNjkgODcgNzcgNzkgNCAtNCAtMTIgLTI2IC0zNSAtNDl6Ii8+CjxwYXRoIGQ9Ik0zODA5IDc5MTYgYy0yIC0zIC0xNiAtNyAtMjkgLTkgLTExNCAtMjIgLTE3NyAtNjcgLTE5NSAtMTQwIC04IC0zMQo2IC00MSA1MCAtMzMgMjQgNSA1OCAyOSAxMTIgODAgNDYgNDMgOTQgNzggMTE2IDg1IDIwIDcgMzcgMTQgMzcgMTcgMCA1IC04NQo1IC05MSAweiBtLTEwNSAtODcgYy0zNyAtMzkgLTY2IC01NiAtNTggLTM0IDYgMTQgNzEgNjUgODMgNjUgMyAwIC04IC0xNCAtMjUKLTMxeiIvPgo8cGF0aCBkPSJNNjA4NSA3OTEzIGMtMTEgLTMgLTQ4IC0yNyAtODMgLTUzIC0zOSAtMzEgLTc3IC01MSAtMTAyIC01NSAtMjIgLTQKLTQwIC0xMSAtNDAgLTE2IDAgLTExIDEwIC0xMSAxMjcgMCA3OCA4IDk5IDE0IDEzNyA0MCA0MCAyOCA2NiA2NSA1MyA3NyAtOCA4Ci03MSAxMyAtOTIgN3ogbTM1IC0zOCBjMCAtNiAtNzYgLTQ1IC04NyAtNDUgLTEwIDEgNjkgNTAgODAgNTAgNCAwIDcgLTIgNyAtNXoiLz4KPHBhdGggZD0iTTgxMjggNzkwNCBjLTUgLTQgLTggLTQzIC04IC04NiAwIC04NSAxMyAtMTIyIDU4IC0xNzAgMzEgLTMzIDQ4Ci0zNSA1NyAtNyAxMCAzMCAwIDU4IC00NCAxMjYgLTIyIDM0IC00MyA4MCAtNDggMTAzIC00IDIzIC0xMSAzOCAtMTUgMzR6IG02NgotMjIzIGMtOCAtOCAtMzMgMzQgLTMzIDU0IDAgMTUgNSAxMSAxOSAtMTUgMTAgLTE5IDE2IC0zNyAxNCAtMzl6Ii8+CjxwYXRoIGQ9Ik0zODc3IDc4NzYgYy00NSAtMTYgLTc0IC00MCAtOTMgLTc3IC0xNiAtMzEgLTEwIC0zOSAyOCAtMzkgMzcgMCA5MQoyMyAxNTMgNjUgNDEgMjkgNjMgMzYgMTIyIDQxIDQwIDQgNzAgMTEgNjcgMTUgLTkgMTUgLTIzNSAxMCAtMjc3IC01eiBtNDMKLTMxIGMwIC02IC01NiAtMzUgLTY3IC0zNSAtMTQgMSAzOSA0MCA1MyA0MCA4IDAgMTQgLTIgMTQgLTV6Ii8+CjxwYXRoIGQ9Ik02MjI1IDc4NzYgYy0xNiAtNyAtNDYgLTMwIC02NiAtNTAgLTIwIC0yMCAtNTMgLTQ1IC03NSAtNTcgbC0zOQotMjAgODcgNSBjOTYgNSAxNDQgMjQgMTkyIDc1IDIxIDIyIDI3IDM0IDE5IDQyIC0xNyAxNyAtODYgMjAgLTExOCA1eiBtMzkKLTUwIGMtMTEgLTggLTM0IC0xOCAtNTAgLTIxIGwtMjkgLTcgMzAgMjEgYzE3IDExIDM5IDIxIDUwIDIxIDE5IDAgMTkgMCAtMQotMTR6Ii8+CjxwYXRoIGQ9Ik04NDA3IDc4NTMgYy0zIC0xNyAtMjggLTUwIC02MCAtODEgLTMxIC0yOCAtNjUgLTY1IC03NiAtODEgLTI2IC0zNwotMjggLTcxIC0zIC03MSAyNCAwIDg0IDQ2IDExMCA4NSAyNSAzNSA1NSAxNTYgNDMgMTY4IC01IDUgLTExIC01IC0xNCAtMjB6Cm0tNzIgLTE0NyBjLTEwIC0xNCAtMjIgLTI2IC0yNyAtMjYgLTUgMCAxIDEzIDE0IDI5IDI4IDM0IDM2IDMzIDEzIC0zeiIvPgo8cGF0aCBkPSJNMTk5MyA3ODI1IGM0IC0yNSAyMCAtNzIgMzcgLTEwNSAyNSAtNTAgMzggLTY0IDgwIC04NSBsNTAgLTI1IDAgMzgKYzAgNDcgLTE0IDY3IC04NCAxMjEgLTM3IDI4IC01NyA1MiAtNjEgNzIgLTExIDQ4IC0yOSAzNSAtMjIgLTE2eiBtMTEyIC0xNDMKYy05IC05IC0zNSA4IC0zNSAyNCAwIDE2IDIgMTYgMjAgLTEgMTEgLTEwIDE4IC0yMCAxNSAtMjN6Ii8+CjxwYXRoIGQ9Ik02MzgxIDc4MjkgYy0xNCAtNSAtNDQgLTI2IC02OCAtNDUgLTIzIC0xOSAtNTkgLTQxIC04MCAtNDkgLTIxIC03Ci0zMyAtMTQgLTI4IC0xNSAxMDcgLTExIDE2NyAtMTAgMTk3IDQgNDAgMTkgMTA4IDc0IDEwOCA4NiAwIDEwIC02NCAzMCAtOTAKMjkgLTggMCAtMjYgLTUgLTM5IC0xMHogbTU5IC0zNCBjMCAtOCAtODIgLTQ1IC0xMDAgLTQ1IC0yMCAwIDIzIDMwIDU4IDQwIDM0CjExIDQyIDExIDQyIDV6Ii8+CjxwYXRoIGQ9Ik0zOTk2IDc3OTcgYy01MCAtMTUgLTY5IC00MyAtNDIgLTYyIDM1IC0yNiAxMjAgLTM3IDE5NiAtMjYgMzggNgoxMDEgMTEgMTQwIDExIDc2IDAgODcgMTQgMjAgMjUgLTIyIDQgLTg2IDIwIC0xNDIgMzYgLTExMSAzMiAtMTE2IDMzIC0xNzIgMTZ6Cm0xMDEgLTQ2IGMtMTAgLTQgLTM3IC00IC02MCAtMiAtMzQgNCAtMzcgNSAtMTggMTAgMzIgOCAxMDMgMSA3OCAtOHoiLz4KPHBhdGggZD0iTTgwOTIgNzY2NyBjNiAtOTcgMjIgLTEzMyA3NyAtMTc2IDM3IC0yOSA0MCAtMzAgNTAgLTE0IDkgMTcgMTAgMTcKMjMgMCAxNCAtMTggMTUgLTE4IDQ4IDIgNjAgMzUgMTA1IDEwMiAxMTkgMTc2IDcgMzYgNiA0NSAtNSA0NSAtOCAwIC0xNCAtOAotMTQgLTE5IDAgLTExIC0yNCAtMzYgLTYwIC02MiAtMzYgLTI2IC02OCAtNTkgLTc5IC04MSBsLTE4IC0zOCAtMTggNDYgYy05CjI1IC0zNCA2NSAtNTUgODkgLTIxIDI0IC00MCA1OSAtNDQgNzkgLTQgMjAgLTEyIDM2IC0xOCAzNiAtNyAwIC05IC0yNiAtNgotODN6IG05NyAtMTQyIGMwIC01IC05IDEgLTE5IDE0IC0xMSAxMyAtMjAgMjggLTIwIDM1IDAgNiA5IDAgMjAgLTE0IDExIC0xNAoyMCAtMjkgMTkgLTM1eiBtMTIxIDEwIGMtMTMgLTE0IC0yNiAtMjMgLTI4IC0yMCAtMyAzIDUgMTYgMTggMzAgMTMgMTQgMjYgMjMKMjggMjAgMyAtMyAtNSAtMTYgLTE4IC0zMHoiLz4KPHBhdGggZD0iTTIzMDYgNzcyNCBjLTMgLTkgLTYgLTI0IC02IC0zMyAwIC0xMCAtMTggLTM0IC0zOSAtNTQgLTUxIC00NyAtNzkKLTExNyAtNjIgLTE1NCBsMTIgLTI2IDQ0IDQzIGMzNyAzNyA0NyA1NCA2MCAxMTEgOCAzNyAxNSA4MiAxNSA5OCAwIDMzIC0xNAo0MSAtMjQgMTV6IG0tNDYgLTE2NCBjLTE1IC0zNyAtMzMgLTQwIC0xOSAtNCAxMyAzNiAyMCA0NiAyNiA0MCAzIC0zIDAgLTE5Ci03IC0zNnoiLz4KPHBhdGggZD0iTTM3OTAgNzczMCBjLTIyIC0xMyAxNSAtNTkgNzEgLTg3IDM3IC0xOCA2NCAtMjIgMTczIC0yNSAxMDIgLTIgMTMwCjAgMTM0IDExIDMgOSAtMSAxMSAtMTcgNiAtMjggLTkgLTE0MSAyMSAtMTY2IDQ1IC00OSA0NiAtMTU3IDc0IC0xOTUgNTB6Cm0xMjcgLTUxIGMxNSAtNiAyMyAtMTMgMTYgLTE2IC02IC0yIC0zMSA1IC01NSAxNiAtMzEgMTUgLTM1IDIwIC0xNiAxNiAxNSAtMwo0MCAtMTAgNTUgLTE2eiIvPgo8cGF0aCBkPSJNMjAwMCA3Njg2IGMwIC0zMyA0MyAtMTI2IDc2IC0xNjUgMjMgLTI4IDc3IC02MSA5OSAtNjEgMyAwIDUgMTIgNQoyOCAwIDM3IC00MSA5NSAtOTQgMTMxIC0yNCAxNyAtNDkgNDQgLTU2IDYxIC0xNSAzNiAtMzAgMzkgLTMwIDZ6IG0xMzkgLTE2MwpjMiAtMiAyIC01IC0xIC04IC03IC03IC01OCAzNCAtNTggNDcgMCA3IDEyIDEgMjggLTEzIDE1IC0xMyAyOSAtMjUgMzEgLTI2eiIvPgo8cGF0aCBkPSJNMzU5NCA3Njk5IGMtOCAtMTMgMzggLTYzIDg2IC05MiAyOSAtMTggNTIgLTIyIDE2MCAtMjQgbDEyNSAtMyAtNTUKMTYgYy0zMCA5IC03NyAzMyAtMTA1IDU0IC0yNyAyMCAtNjAgNDMgLTcyIDQ5IC0yOCAxNCAtMTMwIDE0IC0xMzkgMHogbTE1MQotNTUgYzM4IC0yNCAzOSAtMjUgMTAgLTE5IC0xNiA0IC00MyAxNSAtNjAgMjYgLTI1IDE1IC0yNyAxOSAtMTAgMTkgMTEgMCAzOAotMTIgNjAgLTI2eiIvPgo8cGF0aCBkPSJNMzQxNSA3NjU0IGMtMTQgLTE1IC0xNSAtMTggMCAtMzQgOCAtOSAzOSAtMzAgNjcgLTQ1IDQ0IC0yNCA2NSAtMjkKMTUwIC0zMiA5MiAtMyAxMjkgNyA3NCAyMSAtMTQgMyAtMzcgMTcgLTUzIDMwIC03NCA2MiAtMTA0IDc2IC0xNjQgNzYgLTQwIDAKLTYzIC01IC03NCAtMTZ6IG0xNDUgLTQ0IGMzMyAtMjYgOCAtMjYgLTQ1IC0xIGwtNDAgMTkgMzAgMSBjMTcgMCA0MSAtOCA1NQotMTl6Ii8+CjxwYXRoIGQ9Ik01MzUxIDc1ODMgYy0yMCAtNCAtMTU2IC0xMzUgLTQxNSAtNDAxIGwtNjAgLTYxIC0xIC05MjMgYy0xIC01MDggMQotMTAwMSAzIC0xMDk2IDQgLTE1OCA2IC0xNzMgMjQgLTE4MyAxNCAtOCAyNSAtNyA0MSA1IDMwIDIwIDE0OCAxMzYgMjI3IDIyMQozNSAzOSAxMDQgMTExIDE1MiAxNjEgbDg4IDkxIDAgMTA2NSBjMCAxMDIzIC0zIDExMzIgLTI4IDExMjcgLTQgLTEgLTE4IC00Ci0zMSAtNnogbS0xMSAtMzU1IGMwIC0xNDUgMSAtNjEzIDIgLTEwNDEgbDIgLTc3NyAtOTQgLTk3IGMtMjI3IC0yMzIgLTMwMQotMzA1IC0zMDcgLTMwMCAtMyAzIC01IDQ3NSAtNCAxMDQ4IGwxIDEwNDMgMTkyIDE5MiBjMTA2IDEwNSAxOTYgMTkyIDIwMSAxOTMKNCAwIDcgLTExNyA3IC0yNjF6Ii8+CjxwYXRoIGQ9Ik01MjcwIDczODAgYy0xNCAtMTUgLTg1IC04OCAtMTU3IC0xNjMgbC0xMzMgLTEzNyAwIC05OTMgMCAtOTkyIDE2MAoxNjEgMTYwIDE2MSAtMiA5OTQgLTMgOTk1IC0yNSAtMjZ6Ii8+CjxwYXRoIGQ9Ik04Mzc4IDc1MzAgYy0xMCAtMjEgLTM1IC00NiAtNjIgLTYzIC0yOCAtMTcgLTU1IC00NiAtNzAgLTc0IC00NwotODQgLTI4IC0xMTIgNDcgLTY2IDQxIDI0IDQ5IDM2IDc3IDEwNiAxNyA0MyAyOSA5MSAyNyAxMDUgLTMgMjcgLTMgMjcgLTE5Ci04eiBtLTU5IC0xMjggYy02IC0xMCAtMjEgLTI1IC0zMyAtMzIgLTIwIC0xMiAtMjAgLTEyIC02IDYgMzAgNDAgNDMgNTQgNDcKNTAgMyAtMiAtMSAtMTMgLTggLTI0eiIvPgo8cGF0aCBkPSJNMzIzNSA3MzQxIGMtMTEwIC0yNSAtMTk2IC02OCAtMjA4IC0xMDQgLTUgLTE2IC03IC0zMSAtNCAtMzMgMyAtMwo0MyA3IDg5IDIyIDczIDI0IDk5IDI3IDIxOCAyOCAxNTUgMSAyMzIgLTE3IDMzMyAtNzkgODQgLTUxIDEwMiAtNDcgNzMgMTgKLTI5IDYyIC03NyA5NiAtMjA2IDE0MiAtNzAgMjUgLTIwMSAyOCAtMjk1IDZ6IG0yNTEgLTQyIGMzMiAtNiA3MCAtMTggODQgLTI2CjE0IC04IDE3IC0xMiA4IC05IC03MCAyMSAtMTE1IDI5IC0xOTMgMzYgLTg4IDcgLTg4IDcgLTI0IDkgMzYgMCA5MiAtNCAxMjUKLTEweiBtLTE5OSAtNSBjLTMgLTMgLTEyIC00IC0xOSAtMSAtOCAzIC01IDYgNiA2IDExIDEgMTcgLTIgMTMgLTV6Ii8+CjxwYXRoIGQ9Ik04MjYgNjUyMyBjNCAtMTYgMTMgLTQzIDIxIC02MSA3IC0xOCAxNSAtNTIgMTcgLTc1IDYgLTcwIDI1IC0xMjYKNTcgLTE2MCAyOCAtMzEgMzAgLTMxIDQ0IC0xMyAyNyAzNSAxMyAxMjIgLTI4IDE2OSAtMTIgMTUgLTM4IDU4IC01NyA5NiAtMzYKNzEgLTY3IDk3IC01NCA0NHogbTEwOSAtMjMzIGw1IC0zNSAtMTQgMzAgYy0xOCAzNSAtMjEgNjQgLTYgNDkgNSAtNSAxMiAtMjUKMTUgLTQ0eiIvPgo8cGF0aCBkPSJNOTQzMyA2NTIzIGMtMyAtMTAgLTMwIC01NCAtNTkgLTk5IC0zNSAtNTIgLTU3IC05NyAtNjMgLTEyOSAtMTMKLTY4IDcgLTEwMiA0NiAtNzcgMTggMTEgNjMgMTEzIDYzIDE0MiAwIDIyIDExIDY5IDM2IDE1OCA4IDI2IC0xMyAzMSAtMjMgNXoKbS02NCAtMjEyIGMtNiAtMTggLTE0IC0zMCAtMTcgLTI3IC0yIDMgMSAxOSA4IDM2IDE2IDQwIDIzIDMzIDkgLTl6Ii8+CjxwYXRoIGQ9Ik05OTUgNjQ0MCBjLTMgLTUgMSAtMjAgMTAgLTMzIDI0IC0zOCAyOSAtMTE1IDExIC0xNjcgLTM0IC05OCAtNQotMjIzIDM5IC0xNjQgNyAxMSAyMCA0MCAyOSA2NiAxMyA0MSAxMyA1NCAwIDExMCAtMTcgNzUgLTY0IDE5OCAtNzUgMTk4IC00IDAKLTExIC00IC0xNCAtMTB6IG02NCAtMjQyIGMwIC03IC00IC0yMiAtOSAtMzMgLTcgLTE3IC05IC0xNSAtOSAxMyAtMSAxNyA0IDMyCjkgMzIgNiAwIDEwIC02IDkgLTEyeiIvPgo8cGF0aCBkPSJNOTIzMiA2MzQ4IGMtNDIgLTExMyAtNDcgLTE1MSAtMjQgLTIyMyAxNCAtNDcgMjIgLTYwIDM3IC02MCAxNCAwCjI0IDEyIDM1IDQyIDEzIDM4IDEyIDQ5IC00IDExMyAtMTggNjggLTE4IDEyNSAwIDE4OCAzIDEyIDIgMjIgLTMgMjIgLTUgMAotMjMgLTM3IC00MSAtODJ6IG0xNyAtMTc4IGMwIC0yMyAtMSAtMjMgLTkgLTUgLTUgMTEgLTkgMzEgLTkgNDUgMCAyMyAxIDIzIDkKNSA1IC0xMSA5IC0zMSA5IC00NXoiLz4KPHBhdGggZD0iTTk1MDIgNjM2MyBjLTUgLTEwIC0xOSAtNDMgLTMxIC03MyAtMTkgLTQ3IC0zMCAtNjEgLTgzIC05NSAtNTkgLTM4Ci04OCAtNzIgLTEwMyAtMTIyIC01IC0xOSAtMyAtMjMgMTcgLTIzIDQwIDEgMTAyIDM1IDEzMSA3MyAzNiA0NyA1MiA4NyA3MwoxNzYgMTYgNzEgMTQgMTAwIC00IDY0eiBtLTk3IC0yMjEgYy02IC00IC0yMyAtMTggLTQwIC0zMiBsLTMwIC0yNSAyOSAzMyBjMTcKMTcgMzQgMzIgNDAgMzIgNiAwIDYgLTMgMSAtOHoiLz4KPHBhdGggZD0iTTc3MCA2MzQzIGMwIC0yOSA1MiAtMTc1IDc2IC0yMTQgMjggLTQ0IDY2IC03MCAxMTUgLTc2IDQ1IC02IDQ4IDEKMTkgNTcgLTEyIDI0IC00NCA1NiAtODQgODQgLTUwIDM2IC02OCA1NyAtODUgOTUgLTExIDI3IC0yMSA1NCAtMjEgNjAgMCA2IC00CjExIC0xMCAxMSAtNSAwIC0xMCAtOCAtMTAgLTE3eiBtMTU5IC0yMzAgYzIgLTIgLTIgLTMgLTEwIC0zIC04IDAgLTI3IDEyIC00NAoyNiBsLTMwIDI2IDQwIC0yMyBjMjIgLTEyIDQyIC0yNCA0NCAtMjZ6Ii8+CjxwYXRoIGQ9Ik0xMTIwIDYxODYgYzAgLTMwIC0xMCAtNjMgLTMwIC0xMDEgLTQyIC04MCAtMzkgLTE4NSA1IC0xODUgMTggMCA1MAo2MSA2NiAxMjMgOSAzNyA4IDYwIC02IDEyNiAtMjAgODkgLTM1IDEwNSAtMzUgMzd6IG0tNCAtMTcyIGMtOCAtMjEgLTE1IC0zNAotMTUgLTI4IC0xIDE1IDIwIDc2IDI1IDcxIDIgLTIgLTIgLTIxIC0xMCAtNDN6Ii8+CjxwYXRoIGQ9Ik05MTQ1IDYxOTggYy00IC0xOCAtOSAtNzEgLTExIC0xMTggLTQgLTc0IC0xIC05MSAxOSAtMTMwIDMxIC01OSA1OQotNjUgNzQgLTE1IDEzIDQzIDMgOTAgLTM1IDE1NCAtMTcgMzAgLTI2IDU5IC0yNiA5MiAtMSA1NiAtMTAgNjQgLTIxIDE3eiBtNDMKLTIxOCBjMSAtMjMgMCAtMjMgLTggLTUgLTUgMTEgLTggMzQgLTggNTAgMCAyOSAwIDI5IDggNSA0IC0xNCA4IC0zNiA4IC01MHoiLz4KPHBhdGggZD0iTTgwNSA2MTE4IGM0MSAtMTM3IDEyNyAtMjI4IDIxNSAtMjI4IDI3IDAgNDAgNCA0MCAxMyAwIDIyIC01NCA5MQotODEgMTA0IC0xMyA2IC00NiAyMSAtNzIgMzMgLTMxIDE1IC01NyAzNiAtNzQgNjEgLTI5IDQ0IC0zNyA0OSAtMjggMTd6IG0xNzEKLTE2OSBsMjkgLTMyIC00MiAyOCBjLTQ2IDMwIC01MSAzNSAtMzAgMzUgNyAwIDI2IC0xNCA0MyAtMzF6Ii8+CjxwYXRoIGQ9Ik05NDUyIDYxMDggYy0xMyAtMjEgLTI4IC0zOCAtMzMgLTM4IC02IDAgLTcgLTQgLTQgLTEwIDMgLTUgLTEgLTEwCi0xMCAtMTAgLTI0IDAgLTEwNyAtNDUgLTEzMiAtNzIgLTMyIC0zNCAtNDUgLTc0IC0yOSAtODggMTQgLTExIDc4IDggMTE4IDM1CjQzIDI5IDEyMSAxNjIgMTE2IDE5OCAtMyAxOSAtNiAxOCAtMjYgLTE1eiBtLTgyIC0xMjIgYzAgLTggLTcxIC00OCAtNzYgLTQzCi0zIDIgMTAgMTQgMjggMjYgMzIgMjAgNDggMjYgNDggMTd6Ii8+CjxwYXRoIGQ9Ik0zNDk5IDYxMTMgYy0xMiAtMTMgLTE0IC0yNzUgLTE3IC0xNTk4IGwtMiAtMTU4MyAyNSAtMTYgYzM1IC0yMyA1NQotMTQgMTEyIDQ2IDI2IDI3IDEyMCAxMjMgMjA5IDIxMiA4OCA4OCAxNjkgMTczIDE3OSAxODkgMTYgMjUgMTcgNTkgMTUgNDQ1Ci0yIDIyOSAtMiA1NTQgLTEgNzIyIGwyIDMwNSAzNSAtNDAgYzIwIC0yMiA1NyAtNjQgODIgLTk0IDI2IC0zMCA3MCAtNzkgOTgKLTExMCAyOSAtMzEgNjcgLTc0IDg1IC05NiA2NiAtNzcgODcgLTk1IDExMyAtOTUgMTQgMCAzMSA5IDQwIDIxIDggMTIgNzIgODIKMTQzIDE1NiA3MCA3NCAxMzMgMTQzIDE0MCAxNTMgMTEgMTYgNyAyNiAtMzQgNzcgLTI2IDMyIC01NiA2NyAtNjUgNzggLTEwIDExCi05NSAxMDkgLTE4OSAyMTggLTk0IDEwOCAtMTc1IDE5NyAtMTc5IDE5NyAtMyAwIC0yMiAyMSAtNDAgNDggLTE5IDI2IC02NCA3OQotMTAwIDExNyAtMzYgMzkgLTExMCAxMjIgLTE2NSAxODUgLTU1IDYzIC0xMzUgMTUyIC0xNzkgMjAwIC00MyA0NyAtMTE1IDEyOQotMTU5IDE4MyAtNjYgNzggLTg2IDk3IC0xMDggOTcgLTE1IDAgLTMzIC03IC00MCAtMTd6IG0xNDUgLTE3MyBjMjIgLTI1IDY5Ci03OSAxMDQgLTEyMCAzNSAtNDEgNzEgLTgyIDgxIC05MCAxNiAtMTQgMTU5IC0xNzYgMjUwIC0yODMgMjQgLTI5IDc2IC04OAoxMTYgLTEzMiAxMDkgLTEyMSA0NzggLTUzOCA0OTMgLTU1NyAxMiAtMTUgLTMgLTMzIC0xMjMgLTE1NSBsLTEzNyAtMTM4IC0zNgo0MSBjLTIxIDIyIC03NSA4MiAtMTIyIDEzNCAtNDcgNTEgLTg5IDk5IC05NCAxMDcgLTQgOSAtMTYgMjMgLTI1IDMyIC05IDkKLTQxIDQ1IC03MSA4MCAtNTQgNjQgLTExOCAxMzEgLTEyMyAxMzEgLTMgMCAtOCAtNzkzIC03IC0xMjg2IGwwIC0zMTEgLTc3Ci04MiBjLTQzIC00NCAtODMgLTg3IC04OSAtOTMgLTIxIC0yNCAtMjA5IC0yMDQgLTIyNCAtMjE1IC0xMyAtMTAgLTE1IDE1OAotMTQgMTUwMCAwIDgzMiAxIDE1MTkgMiAxNTI3IDIgMTAgMTAgNiAyOCAtMTUgMTUgLTE2IDQ1IC01MCA2OCAtNzV6Ii8+CjxwYXRoIGQ9Ik0zNTkwIDU5MjAgYy0zIC02OCAxIC0yODM0IDMgLTI4MzYgMiAtMiAyNiAyMCA1NCA0OSAxODAgMTgzIDI0MwoyNTEgMjQzIDI1OCAwIDUgNSA5IDEwIDkgNyAwIDEwIDI5MCAxMCA4NTAgMCA0NjggMyA4NTAgNiA4NTAgMyAwIDExIC02IDE3Ci0xMiAyMiAtMjMgMjkxIC0zMzAgMzQwIC0zODcgMjYgLTMxIDczIC04NCAxMDMgLTExOCBsNTUgLTYyIDU3IDYxIGMzMSAzNCA3OAo4MyAxMDUgMTA5IDI2IDI2IDQ3IDUxIDQ3IDU2IDAgNCAtMTkgMjggLTQxIDUzIC0yMyAyNSAtNzIgODEgLTExMCAxMjUgLTM4CjQ0IC0xMDggMTIzIC0xNTUgMTc1IC00NyA1MiAtMTUxIDE3MCAtMjMyIDI2MyAtODEgOTIgLTE3OCAyMDMgLTIxNyAyNDYgLTk0CjEwNiAtMjQ1IDI3OCAtMjcyIDMxMCBsLTIyIDI2IC0xIC0yNXoiLz4KPHBhdGggZD0iTTExODQgNjAzMiBjNSAtNDIgMyAtNTQgLTIzIC05MyAtNTYgLTg1IC02NiAtMTk5IC0xOCAtMTk5IDE1IDAgMzEKMTQgNTIgNDggMjYgNDEgMzAgNTYgMjkgMTE3IDAgNzggLTIxIDE3NSAtMzYgMTc1IC03IDAgLTggLTE4IC00IC00OHogbS0xMwotMTk5IGMtMTcgLTMyIC0yMCAtMzUgLTIxIC0xNSAwIDEzIDggNDAgMTggNjAgMTUgMzIgMTcgMzQgMjAgMTUgMiAtMTIgLTYKLTM5IC0xNyAtNjB6Ii8+CjxwYXRoIGQ9Ik05MDc5IDYwMjMgYy0yMSAtOTUgLTE3IC0xNzEgOSAtMjI2IDI2IC01MiA1NyAtNzYgNzUgLTU4IDcgNyAxNCA2CjIyIC02IDEwIC0xNCAxOCAtMTQgNjQgLTMgNjQgMTUgMTA5IDUyIDE0MCAxMTcgMTQgMjYgMjggNTEgMzMgNTQgNiAzIDggMTkgNgozNSBsLTMgMjggLTI1IC0zNyBjLTE5IC0yOCAtNDEgLTQzIC05MCAtNjIgLTM5IC0xNSAtNzYgLTM4IC05MiAtNTcgbC0yNyAtMzEKLTExIDI3IGMtNSAxNSAtMTAgMzMgLTEwIDM5IDAgNyAtMTMgMzkgLTMwIDcyIC0yMSA0MyAtMjkgNzUgLTMwIDExMyAwIDI4IC00CjUyIC05IDUyIC01IDAgLTE1IC0yNiAtMjIgLTU3eiBtNTYgLTE5OCBsNiAtNDAgLTE2IDM0IGMtMTYgMzYgLTIyIDg4IC02IDYxCjUgLTggMTIgLTMzIDE2IC01NXogbTE4MyAtMTQgYy0xMCAtMTYgLTQ4IC00MSAtNjMgLTQxIC0xMyAwIDExIDMzIDM0IDQ1IDM2CjE5IDQzIDE4IDI5IC00eiIvPgo8cGF0aCBkPSJNODQ4IDU5MjIgYzIzIC01NyAxMjcgLTE2NyAxNzggLTE4OCAxOCAtOCA0NyAtMTQgNjQgLTE0IGwzMCAwIC0yNAo0OCBjLTMzIDY0IC01OSA4NiAtMTM3IDExMSAtMzcgMTIgLTc1IDMxIC04NCA0MSAtMjMgMjUgLTM3IDI2IC0yNyAyeiBtMTcwCi0xMjggbDM3IC0zNiAtMzMgMTkgYy0zOSAyMSAtNzEgNTMgLTUzIDUzIDYgMCAyOCAtMTYgNDkgLTM2eiIvPgo8cGF0aCBkPSJNMjE5OCA1NzMyIGMtOSAtOSAtMzkgLTU5IC02NyAtMTA5IC0yOSAtNTEgLTU2IC05MyAtNjAgLTkzIC0xNSAwCi01MyAtMTIwIC00OCAtMTU1IDcgLTUwIDE0IC01NyA0MSAtNDAgMzEgMjEgNjkgOTIgNzEgMTM0IDMgNTIgNDIgMTc5IDcxIDIyOAoyNSA0MyAxOSA2NyAtOCAzNXogbS0xMTIgLTI5NyBjLTEyIC0zNCAtMTUgLTM2IC0xNSAtMTQgLTEgMzYgMjMgMTAxIDI3IDc0IDEKLTExIC00IC0zOCAtMTIgLTYweiIvPgo8cGF0aCBkPSJNODEwMCA1NzM2IGMwIC0yIDE0IC0zNCAzMSAtNzAgMTggLTM5IDM0IC05NCA0MCAtMTM2IDEzIC0xMDYgNjAKLTIwMCAxMDAgLTIwMCA0NCAwIDEzIDE1OCAtNDcgMjM3IC0xNCAxOSAtNDAgNjEgLTU2IDkyIC0xNyAzMSAtMzUgNjIgLTQwIDY5Ci0xMCAxMSAtMjggMTcgLTI4IDh6IG0xMjYgLTI0OCBjMTkgLTM3IDM1IC05OCAyNSAtOTggLTMgMCAtMTMgMjIgLTIyIDQ4IC05CjI2IC0yMCA1NSAtMjQgNjUgLTEzIDMwIDQgMTggMjEgLTE1eiIvPgo8cGF0aCBkPSJNMTk1NyA1NTMyIGMtMzQgLTg4IC01NyAtMTgxIC01NyAtMjI4IDEgLTY3IDUzIC0xNTUgNzcgLTEzMCA0IDMgMTAKMzEgMTQgNjIgNiA0MyAzIDY4IC0xMiAxMTYgLTIxIDY0IC0yMCA5OCA2IDE5MCAyMSA3MyAxIDY2IC0yOCAtMTB6IG0tMiAtMjU5CmM2IC01NSAtOCAtMjQgLTE4IDQyIC00IDI4IC0zIDM1IDQgMjMgNSAtOSAxMSAtMzggMTQgLTY1eiIvPgo8cGF0aCBkPSJNODMyNCA1NTY4IGMzIC0xMyAxMSAtNTMgMTcgLTkwIDEwIC01OCA5IC03NCAtNCAtMTEwIC05IC0yNCAtMjAKLTcyIC0yMyAtMTA2IGwtNyAtNjQgLTI3IDQ0IGMtMTUgMjQgLTU1IDY3IC04OSA5NiAtMzMgMjkgLTYxIDYwIC02MSA2OCAwIDgKLTQgMTQgLTEwIDE0IC01IDAgLTE1IDE5IC0yMiA0MyAtMTEgMzggLTEyIDQwIC0xNiAxNCAtMiAtMTUgOSAtNjggMjUgLTExOAoyNSAtODMgMzMgLTk2IDgxIC0xNDAgNjIgLTU2IDk5IC03MSAxMTcgLTQ1IDExIDE1IDEzIDE1IDE5IDEgOCAtMjMgMTkgLTE4CjQ0IDIwIDM0IDUzIDQ3IDEyOSAzMiAxOTAgLTE5IDgwIC02NCAyMDUgLTc0IDIwNSAtNCAwIC02IC0xMCAtMiAtMjJ6IG00MQotMjk1IGMtMTAgLTQyIC0xOCAtMTggLTkgMjkgNiAzMiA5IDM3IDEyIDE5IDIgLTEyIDEgLTM0IC0zIC00OHogbS0xNDUgLTE4CmMxOCAtMTkgMzIgLTM3IDI5IC0zOSAtMiAtMiAtMjEgMTMgLTQxIDM1IC0yMSAyMSAtMzQgMzkgLTMwIDM5IDUgMCAyMyAtMTYKNDIgLTM1eiIvPgo8cGF0aCBkPSJNMjIxMSA1NDQxIGMtMTcgLTMyIC00NCAtNjkgLTYxIC04MiAtNzYgLTU5IC0xMDAgLTgzIC0xMjQgLTEyNCAtMzIKLTUzIC0zMyAtNzUgLTYgLTc1IDU2IDAgMTI1IDY1IDE2OSAxNjAgMTcgMzYgMzEgNzAgMzEgNzcgMCA2IDkgMzIgMjAgNTcgMjgKNjcgNiA1NiAtMjkgLTEzeiBtLTEwMSAtMTgxIGMtMTIgLTE2IC0yNiAtMzAgLTMzIC0zMCAtNiAwIDIgMTQgMTggMzAgMTYgMTcKMzAgMzAgMzMgMzAgMiAwIC02IC0xMyAtMTggLTMweiIvPgo8cGF0aCBkPSJNODQ0MyA1MzI3IGM0IC01OSAxIC03NSAtMjAgLTExNSAtNTEgLTk1IC02NCAtMTM5IC01NCAtMTgzIDUgLTIyCjEyIC00MyAxNSAtNDcgOCAtOCA2NSA0NyA4MCA3OCAyMyA0NCAyNiAxMDIgMTEgMjAzIC0xOSAxMjQgLTM4IDE2MyAtMzIgNjR6Cm0tOCAtMjM3IGMtMjUgLTQ4IC0zMCAtMjkgLTkgMzIgMTYgNDUgMTkgNDkgMjIgMjYgMiAtMTUgLTQgLTQxIC0xMyAtNTh6Ii8+CjxwYXRoIGQ9Ik0xODM3IDUyODggYy0yMiAtMTA3IC0yMiAtMTY2IDIgLTIyMCAxOSAtNDQgNTUgLTg4IDcxIC04OCA1IDAgMTQKMTggMjAgNDAgMTIgNDUgLTEgMTA1IC00MSAxODEgLTE3IDM0IC0yMyA1OSAtMjIgMTA3IDEgMzQgLTIgNjIgLTYgNjIgLTQgMAotMTUgLTM3IC0yNCAtODJ6IG00OSAtMTk0IGM1IC0zOSA1IC0zOSAtMTAgLTE0IC0xOCAyOSAtMjIgODAgLTYgNjQgNiAtNiAxMwotMjggMTYgLTUweiIvPgo8cGF0aCBkPSJNMjE3OCA1MjMwIGMtMjAgLTM1IC00MyAtNTUgLTk2IC04NSAtNjcgLTM4IC0xMzcgLTExMyAtMTM3IC0xNDcgMAotMzkgMTIwIDQgMTY4IDYxIDE0IDE3IDQxIDY1IDYyIDEwNyA0MiA4OSA0NCAxMzQgMyA2NHogbS04OCAtMTQ0IGMwIC0xMiAtNTUKLTQ2IC03NSAtNDYgLTEzIDAgOCAyMiAzOSA0MSAzNyAyMyAzNiAyMyAzNiA1eiIvPgo8cGF0aCBkPSJNODA5MCA1MjY3IGMwIC0xOCA5NCAtMTk0IDExOSAtMjIwIDI4IC0zMSA3OSAtNjAgMTI0IC03MSAzMiAtNyAzMwowIDEyIDUyIC0yMSA0OSAtNDkgNzcgLTExNSAxMTQgLTMwIDE4IC02MiA0MSAtNzAgNTIgLTI0IDM0IC02OSA4MSAtNzAgNzN6Cm0xNzAgLTE5NyBjMTkgLTE2IDMwIC0yOSAyNSAtMzAgLTYgMCAtMjYgMTMgLTQ1IDMwIC0xOSAxNiAtMzAgMjkgLTI1IDMwIDYgMAoyNiAtMTMgNDUgLTMweiIvPgo8cGF0aCBkPSJNMTc2NyA1MTI1IGMtNCAtMzMgLTEwIC04MSAtMTMgLTEwNyAtOCAtNjUgMTggLTE0OCA2MCAtMTkyIDQyIC00NQo2MyAtNDYgNzEgLTMgMTAgNTAgLTExIDEyMCAtNTUgMTg4IC0yMyAzNiAtNDAgNzUgLTQxIDkzIC0xIDE3IC00IDQyIC04IDU2Ci02IDIwIC05IDEzIC0xNCAtMzV6IG03MSAtMjQzIGMtMyAtMTIgLTExIC01IC0yNiAyNSAtMzEgNjAgLTI4IDg4IDQgMzUgMTQKLTIzIDI0IC01MCAyMiAtNjB6Ii8+CjxwYXRoIGQ9Ik04NTA4IDUxMTAgYy0zIC00NyAtMTEgLTY5IC0zOCAtMTA2IC01MCAtNzEgLTY4IC0xNzYgLTMzIC0yMDIgMTYKLTEyIDIxIC0xMCA0NSAxOSAxNSAxOCAzNyA1MyA0OSA3OCAxOSA0MSAyMSA1NyAxNSAxMzYgLTYgOTcgLTE0IDEzNSAtMjYgMTM1Ci00IDAgLTEwIC0yNyAtMTIgLTYweiBtMTIgLTEzMiBjMCAtNyAtMTIgLTM4IC0yNyAtNjggLTE5IC0zOSAtMjcgLTUwIC0zMQotMzcgLTIgMTEgNyA0MSAxOSA2OCAyMyA0NyAzOSA2MyAzOSAzN3oiLz4KPHBhdGggZD0iTTIxMTYgNTAyNCBjLTE1IC0xOSAtNTcgLTUwIC05MiAtNzAgLTczIC00MSAtMTE5IC04OSAtMTI5IC0xMzQgLTExCi00OSA1IC01NSA2OCAtMjQgNzAgMzIgMTE2IDgyIDE2MiAxNzQgNDkgOTcgNDYgMTIwIC05IDU0eiBtLTY4IC0xMTYgYy02IC0xOQotODQgLTcxIC05OCAtNjYgLTcgMiA5IDIwIDM2IDQxIDQ5IDM4IDY5IDQ2IDYyIDI1eiIvPgo8cGF0aCBkPSJNODE0MCA1MDU2IGMwIC0xMSA5MyAtMTgzIDEwOCAtMjAwIDI2IC0yOCAxMTQgLTc2IDE0MSAtNzYgMjEgMCAyMwozIDE4IDMwIC0xMiA1NyAtNTUgMTEwIC0xMTAgMTM2IC0yOSAxMyAtNTcgMjQgLTY0IDI0IC03IDAgLTI2IDIwIC00MyA0NSAtMjYKMzggLTUwIDU3IC01MCA0MXogbTE3MiAtMTc1IGM0NyAtNDIgMzEgLTQ3IC0xNyAtNiAtMjIgMTkgLTM0IDM0IC0yOCAzNSA3IDAKMjcgLTEzIDQ1IC0yOXoiLz4KPHBhdGggZD0iTTE3MTggNDk3NCBjLTQgLTYgLTEwIC02MCAtMTMgLTEyMCBsLTYgLTEwOSAzMyAtNTQgYzYxIC0xMDAgMTEzCi0xMTYgMTExIC0zMyAtMiA2MiAtMTMgOTcgLTQ0IDEzMyAtNDMgNDkgLTU4IDgxIC02NyAxNDEgLTQgMjkgLTExIDQ4IC0xNCA0MnoKbTYyIC0yMzYgYzExIC0xOCAyMCAtNDIgMjAgLTUzIC0xIC0xNSAtNyAtMTAgLTI1IDIwIC0yMyAzNyAtMzIgNjUgLTIwIDY1IDMKMCAxNCAtMTUgMjUgLTMyeiIvPgo8cGF0aCBkPSJNODU3MCA0OTMxIGMwIC0zNiAtMzUgLTEyMSAtNTAgLTEyMSAtNiAwIC0xNiAtMTIgLTIzIC0yNyAtNiAtMTYKLTE3IC0zNCAtMjQgLTQxIC0xNCAtMTUgLTIxIC0xNDYgLTkgLTE1OSA1IC01IDk0IDgzIDEwOSAxMDcgMTkgMzAgMzIgMTYyIDIzCjIyNSAtOCA1MCAtMjYgNjEgLTI2IDE2eiBtLTEzIC0xNzMgYy00IC0xMyAtMTggLTM4IC0zMiAtNTcgLTIyIC0zMSAtMjUgLTMzCi0yNSAtMTIgMCAyNSAxNCA1NyAzOCA4NCAxOSAyMSAyNiAxNSAxOSAtMTV6Ii8+CjxwYXRoIGQ9Ik0yMDkwIDQ4NjAgYy0xMyAtMzEgLTQ3IC02MCAtMTIzIC0xMDUgLTYwIC0zNCAtMTE5IC0xMDkgLTExNSAtMTQ0CjQgLTM3IDI2IC0zNiA5NCAyIDQ3IDI2IDY2IDQ1IDk2IDk0IDQyIDY5IDgxIDE3MCA2OCAxNzggLTQgMyAtMTMgLTkgLTIwIC0yNXoKbS05MiAtMTUyIGMtNiAtMTggLTc3IC03MiAtODQgLTY1IC04IDggNjAgNzcgNzYgNzcgNiAwIDEwIC01IDggLTEyeiIvPgo8cGF0aCBkPSJNODE4MCA0ODgxIGMwIC0yMyA4MyAtMTg0IDExMyAtMjE4IDQ4IC01NSAxNTcgLTk1IDE1NyAtNTggMCAyMiAtNDUKMTA4IC02NSAxMjYgLTkgOCAtNDUgMjggLTc4IDQ0IC00MSAyMCAtNzMgNDQgLTk0IDczIC0xOCAyNCAtMzMgMzkgLTMzIDMzegptMTYxIC0xNzMgYzI3IC0yMyA1MiAtNTggNDIgLTU4IC0xNyAwIC04OSA2OSAtNzIgNzAgOCAwIDIyIC02IDMwIC0xMnoiLz4KPHBhdGggZD0iTTE2NTggNDcxOCBjLTQgLTE3MiA3IC0yMTYgNjggLTI3NSA2MyAtNjEgNzQgLTU4IDc0IDIzIDAgNzEgLTcgOTEKLTUxIDE0MiAtNDEgNDcgLTY5IDEwNiAtNjkgMTQ2IDAgMTkgLTQgMzggLTEwIDQxIC02IDQgLTExIC0yNSAtMTIgLTc3eiBtNzUKLTE2MiBjMTQgLTE4IDI5IC00NiAzMyAtNjIgNyAtMjcgNiAtMjggLTEwIC0xNSAtMTggMTUgLTM5IDUxIC01MCA4OSAtMTAgMzEKLTMgMjggMjcgLTEyeiIvPgo8cGF0aCBkPSJNODYyMCA0NzU1IGMwIC00NiAtMjAgLTkzIC01NyAtMTM2IC00OSAtNTYgLTYzIC05MiAtNjMgLTE2NCAwIC03NAoxMSAtODIgNTQgLTM5IDc2IDc2IDEwNiAxNzYgOTEgMzA4IC03IDY5IC0yNSA5MSAtMjUgMzF6IG0tMzkgLTIyMCBjLTE3IC0zNgotMzUgLTY0IC00MCAtNjAgLTcgNCAtNyAxNSAwIDMyIDEwIDI4IDYyIDEwMyA2NyA5OCAyIC0xIC0xMCAtMzMgLTI3IC03MHoiLz4KPHBhdGggZD0iTTUxMTQgNDI3NSBjLTEyNiAtMTMwIC0yMzIgLTI0NCAtMjM2IC0yNTQgLTEwIC0yNyAtNyAtMTUyMiAzIC0xNTQ4CjYgLTE4IDE2IC0yMyA0MiAtMjMgMzAgMCA1MyAyMCAyNDcgMjE4IDExNyAxMTkgMjE5IDIzMiAyMjcgMjUwIDExIDI2IDEzIDE3MQoxMyA3OTEgLTEgODExIC0xIDgwMSAtNDkgODAxIC0xMSAwIC0xMTQgLTk5IC0yNDcgLTIzNXogbTIzMSAtNjAyIGwzIC03MzgKLTE5OCAtMjAwIGMtMTA5IC0xMTAgLTIwMSAtMTk3IC0yMDQgLTE5NCAtOSA5IC05IDE0NTYgMCAxNDcyIDE0IDIzIDM4NyA0MDcKMzkyIDQwMyAyIC0zIDUgLTMzNyA3IC03NDN6Ii8+CjxwYXRoIGQ9Ik01MTQ1IDQxNjUgYy04MiAtODcgLTE1NCAtMTY0IC0xNTkgLTE3MiAtOSAtMTYgLTkgLTEzNDMgMCAtMTM1MiAzCi0zIDc0IDY1IDE1OSAxNTAgbDE1NSAxNTUgLTIgNjg4IC0zIDY4OCAtMTUwIC0xNTd6Ii8+CjxwYXRoIGQ9Ik0zMDE0IDM2MzIgYy02MCAtNTQgLTk0IC0xMTEgLTEwMSAtMTcwIC01IC00NSAtMyAtNTIgMTEgLTUyIDMzIDAKODQgNzEgMTExIDE1NCAxNSA0NSAzMSA4NyAzNyA5NCAyNCAyOCAtMTkgMTAgLTU4IC0yNnogbS0zOCAtMTE0IGMtOSAtMTIgLTE2Ci0xOSAtMTYgLTE1IDAgMTEgMjQgNDcgMjggNDIgMiAtMiAtMyAtMTQgLTEyIC0yN3oiLz4KPHBhdGggZD0iTTcyNzcgMzY0OCBjMTIgLTEzIDM4IC01OCA1OSAtMTAxIDI2IC01NiA0OCAtODYgNzMgLTEwMyAxOSAtMTMgMzcKLTIyIDM5IC0yMCAyIDIgLTIgMzIgLTggNjYgLTEwIDU3IC0xNyA2OSAtNjkgMTIxIC00MyA0NSAtNjUgNTkgLTg2IDU5IGwtMjgKMCAyMCAtMjJ6IG0xMTAgLTEwOCBjMTIgLTIyIDE4IC00MCAxNCAtNDAgLTQgMCAtMTcgMTggLTMwIDQwIC0xMiAyMiAtMTkgNDAKLTE0IDQwIDQgMCAxOCAtMTggMzAgLTQweiIvPgo8cGF0aCBkPSJNNzQ4NSAzNDcwIGMwIC03NyAtMSAtMTQwIC0yIC0xNDAgLTEgMCAtMjMgMjAgLTQ3IDQ1IC0yNSAyNCAtNTcgNDcKLTczIDUxIC0xNSA0IC00NSAyMyAtNjUgNDIgLTQ0IDQyIC00OCAzMCAtMTIgLTM2IDM0IC02MiA4MCAtMTA5IDExOCAtMTIxIDM0Ci0xMSA4NiAtMTAgODYgMSAwIDQgNiA1IDEzIDIgMjAgLTcgNDcgNTAgNDcgMTAxIDAgNDAgLTM5IDE2NSAtNTkgMTg3IC0zIDQKLTYgLTU2IC02IC0xMzJ6IG0zNSAtNjAgYzAgLTExIC00IC0yMCAtOSAtMjAgLTUgMCAtNyA5IC00IDIwIDMgMTEgNyAyMCA5IDIwCjIgMCA0IC05IDQgLTIweiBtLTExNCAtNTggYy00IC0zIC0xNCAyIC0yNCAxMiAtMTYgMTggLTE2IDE4IDYgNiAxMyAtNiAyMQotMTQgMTggLTE4eiIvPgo8cGF0aCBkPSJNMjgzMSAzNTExIGMtMTggLTM5IC0zNSAtODUgLTM4IC0xMDQgLTYgLTQxIDEwIC05OCAzNiAtMTIxIDE3IC0xNgoxOSAtMTUgMzIgMTYgOCAxOCAxMyA1MyAxMiA3OCAtMSAyNSAtMyA4MCAtNCAxMjMgLTEgNDIgLTMgNzcgLTQgNzcgLTEgMCAtMTYKLTMxIC0zNCAtNjl6IG05IC0xMjggYy0xIC0yNCAtMiAtMjYgLTExIC0xMCAtNSA5IC03IDIyIC00IDI3IDEwIDE3IDE1IDExIDE1Ci0xN3oiLz4KPHBhdGggZD0iTTMwNTggMzQ1NiBjLTE0IC0xOCAtNTIgLTQ1IC04MyAtNjEgLTc2IC0zNyAtMTQ4IC0xMzUgLTk5IC0xMzUgMzEKMCAxMjQgNTIgMTUyIDg1IDI2IDMzIDY5IDEzMSA2MCAxNDAgLTIgMiAtMTYgLTExIC0zMCAtMjl6IG0tODMgLTExNCBjLTE0Ci0xMiAtNjUgLTMyIC02NSAtMjYgMCAzIDE1IDExIDMzIDE5IDM3IDE3IDQ1IDE4IDMyIDd6Ii8+CjxwYXRoIGQ9Ik03NTkxIDM0MzUgYzggLTMwIDYgLTQzIC0xNiAtODYgLTM0IC03MCAtNDEgLTExOCAtMjEgLTE1NyAxNSAtMjgKMTkgLTMwIDM2IC0yMCAxMSA3IDI5IDM1IDQxIDYyIDIwIDQ3IDIwIDUxIDUgMTE1IC0yMCA4MCAtMzYgMTIxIC00NiAxMjEgLTUKMCAtNCAtMTYgMSAtMzV6IG0tMSAtMTk1IGMtMTAgLTIzIC0xMCAtMjIgLTUgOSAzIDE4IDYgNDMgNyA1NSAxIDEyIDMgOSA1IC05CjIgLTE3IC0xIC00MiAtNyAtNTV6Ii8+CjxwYXRoIGQ9Ik0yNzM2IDM0MTAgYy0xNSAtNDggLTI2IC0xMTUgLTI2IC0xNTUgMCAtMzUgNyAtNTcgMzAgLTkxIDMzIC00NyAzOQotNTEgNTggLTMyIDkgOSAxMiA4IDEyIC01IDAgLTIwIDIxIC0yMSA3MSAtMyA1NyAyMCAxMDIgNjEgMTMzIDEyMCAzMCA1NSAzMAo5MCAxIDQ5IC0xNCAtMjAgLTExNCAtNzMgLTEzOCAtNzMgLTYgMCAtMjEgLTEwIC0zNCAtMjIgbC0yMyAtMjEgMCAyMiBjMCAxMgotMTMgNDggLTMwIDgxIC0xNiAzMyAtMzAgNzIgLTMwIDg3IDAgMzYgLTE3IDY1IC0yNCA0M3ogbTM0IC0yMDUgYzAgLTE3IC0yCi0xNyAtMTAgLTUgLTUgOCAtMTAgMjQgLTEwIDM1IDAgMTcgMiAxNyAxMCA1IDUgLTggMTAgLTI0IDEwIC0zNXogbTE0MCAtMjUKYy0yNCAtMTkgLTQwIC0yNSAtNDAgLTE1IDAgNSA1MSAzNCA2MCAzNCAzIDAgLTYgLTggLTIwIC0xOXoiLz4KPHBhdGggZD0iTTczMDYgMzMyOCBjNjAgLTk3IDExNCAtMTU2IDE1OSAtMTc0IDQ2IC0xNyA4NSAtMTIgODUgMTEgMCAzMCAtNjIKODUgLTExMiAxMDAgLTI3IDggLTY1IDI4IC04NCA0NSAtMzUgMzAgLTYyIDQwIC00OCAxOHogbTE1OCAtMTEzIGMzMCAtMjMgMTUKLTI1IC0yNCAtNSAtMjYgMTQgLTMwIDE5IC0xNSAxOSAxMSAwIDI5IC02IDM5IC0xNHoiLz4KPHBhdGggZD0iTTc2NzcgMzMxMCBjLTQgLTE0IC03IC0zNSAtNyAtNDcgMCAtMTIgLTE2IC01MSAtMzUgLTg3IC0zMyAtNTggLTM1Ci02OSAtMjkgLTExNSA0IC0zNSAxMSAtNTEgMjEgLTUxIDc3IDAgMTE2IDE0MCA3NCAyNzAgLTE1IDQ5IC0xOCA1MiAtMjQgMzB6Cm0tOCAtMjEyIGMtMTAgLTM0IC0xNCAtMzggLTE3IC0yMCAtNCAyNyAyMCAxMDUgMjYgODAgMiAtOSAtMiAtMzYgLTkgLTYweiIvPgo8cGF0aCBkPSJNMjQ5NCAyMTA4IGM0MSAtMzEgMzEgLTM5IC0yMSAtMTYgLTI2IDExIC03MCAyMyAtOTcgMjUgbC01MSA1IDQyCi0yOCBjMjMgLTE1IDQ2IC0zOCA1MiAtNTAgMTMgLTI5IDc1IC03MCAxMTkgLTc5IDI3IC02IDMyIC00IDMyIDEzIDAgMTEgLTkKMzEgLTIwIDQ1IC0zNyA0NyAtMjAgNTEgMzUgNyA0MiAtMzMgOTQgLTUxIDEyNSAtNDMgMjggNyAyNiAxNCAtMjIgNjEgLTUyIDUyCi04OCA2OSAtMTYyIDc0IGwtNTkgNSAyNyAtMTl6IG0xMzIgLTU1IGMtNiAtNiAtNDYgMjAgLTQ2IDMwIDAgNCAxMSAwIDI1IC05CjE0IC05IDI0IC0xOSAyMSAtMjF6IG0tMTE2IC0yOCBjMCAtMTEgLTE5IC00IC00MSAxNSBsLTI0IDIxIDMzIC0xNiBjMTcgLTgKMzIgLTE4IDMyIC0yMHoiLz4KPHBhdGggZD0iTTc3NTUgMjEyMSBjLTY4IC04IC0xMjcgLTM1IC0xNjkgLTc5IC0zMyAtMzYgLTI5IC02MiA5IC02MiAzNCAwIDgxCjI0IDEyOCA2NiA1MSA0NiA3MCA0MyAyNCAtNCAtNDQgLTQ1IC00OCAtNzIgLTExIC03MiAzOSAwIDg3IDI2IDEwOSA2MCAxMSAxNwozNSA0MCA1MyA1MSAxNyAxMSAzMiAyNCAzMiAyOSAwIDcgLTU2IDUgLTEwMyAtNSAtMTMgLTIgLTE3IDEgLTEzIDExIDMgOCA0CjEzIDMgMTIgLTEgMCAtMjkgLTQgLTYyIC03eiBtLTU1IC01NiBjMCAtNyAtNjEgLTM3IC02NiAtMzIgLTMgMiAxMCAxMiAyOCAyMAozNyAxOSAzOCAxOSAzOCAxMnogbTEyOSAtOCBjLTIgLTEgLTE0IC0xMSAtMjYgLTIxIC0xMyAtMTEgLTIzIC0xNiAtMjMgLTEzIDAKMTAgMzEgMzcgNDIgMzcgNiAwIDkgLTEgNyAtM3oiLz4KPHBhdGggZD0iTTIxNTAgMjA5MSBjMCAtMTAgOSAtMTMgNjUgLTI2IDE2IC0zIDQ4IC0yNCA3MSAtNDUgNzAgLTY1IDE2NyAtNzcKMTM1IC0xOCAtMTggMzUgLTczIDY4IC0xMzggODMgLTY3IDE3IC0xMzMgMTkgLTEzMyA2eiBtMTk1IC02NiBjMTcgLTEzIDI1Ci0yNCAxOSAtMjUgLTYgMCAtMjQgMTEgLTQwIDI1IC0zOCAzMiAtMTggMzMgMjEgMHoiLz4KPHBhdGggZD0iTTUxMTQgMjA3MSBjLTI5IC0zNiAtNzQgLTEyNiAtNzQgLTE0OSAwIC0xNiAtMTAgLTIwIC01OCAtMjUgLTYwIC01Ci0xMjIgLTI5IC0xMjIgLTQ3IDAgLTIwIDQ0IC03NyA4MiAtMTA1IDMwIC0yMiAzOCAtMzUgMzMgLTUwIC0xNSAtNTUgLTE4Ci0xMDcgLTUgLTExNSAzMSAtMTkgMTI3IDEzIDE1NCA1MSBsMTUgMjIgMzEgLTMxIGMyOCAtMjkgNTUgLTM5IDEyMCAtNDUgMjIKLTIgMjUgMiAyOCAzNiAyIDIyIC0xIDUyIC03IDY4IC0xMCAyOCAtNyAzMyA1MCA5MCAzNSAzNSA1OSA2NyA1NyA3NyAtNCAyMQotODEgNTEgLTEzNSA1MSAtMjkgMSAtNDMgNSAtNDMgMTUgMCAyMSAtNjcgMTUxIC04NyAxNjggLTE3IDE0IC0yMCAxMyAtMzkKLTExeiBtNTkgLTEwMyBjMTQgLTI5IDI4IC02NyAzMSAtODQgNyAtMzAgNyAtMzAgNzEgLTMwIDgzIDEgOTkgLTEzIDYxIC01MwotMTUgLTE2IC00MiAtMzcgLTYxIC00NiBsLTMzIC0xOCAxOSAtNDEgYzIxIC00NiAyNCAtNzYgOCAtNzYgLTIyIDAgLTc1IDMxCi05MiA1NiAtMjYgMzUgLTE3IDQ5IDE2IDI0IDQwIC0zMiA0NSAtMTcgOCAyMSAtMTggMTcgLTMwIDMzIC0yOCAzNSAxIDIgMjkKMTUgNjAgMjkgMzEgMTMgNTcgMjcgNTcgMjkgMCA1IC0xMDMgLTE4IC0xMTcgLTI3IC0xNCAtOSAtMjMgMjUgLTIzIDg1IDAgMjYKLTQgNTAgLTEwIDUzIC02IDQgLTEwIC0xNiAtMTAgLTU0IDAgLTYxIC03IC05NCAtMTkgLTg3IC0xOSAxMiAtMTExIDM0IC0xMTEKMjcgMCAtNSAxOSAtMTYgNDMgLTI2IDY2IC0yNiA3MSAtMzQgNDIgLTYxIC0zMyAtMzAgLTMyIC00OSAwIC0yOCAzMyAyMiA0MgoxMiAyMSAtMjIgLTE2IC0yNCAtNzAgLTU0IC05NiAtNTQgLTE0IDAgLTQgNTIgMTYgOTEgMTMgMjUgMTIgMjcgLTE1IDM5IC0zMAoxMiAtOTEgNjYgLTkxIDgxIDAgMTUgMTggMTkgODQgMjEgbDY1IDIgMTEgNDUgYzEzIDUyIDQ3IDEyMSA1OSAxMjEgNSAwIDIxCi0yNCAzNCAtNTJ6Ii8+CjxwYXRoIGQ9Ik04MDE1IDIwOTAgYy02NCAtOSAtMTA1IC0zMCAtMTM5IC03MSAtMzQgLTM5IC0yOSAtNTUgMTUgLTUxIDM4IDQKNTcgMTUgMTA5IDYwIDE5IDE3IDQ3IDM0IDYzIDM3IDE1IDMgNDEgOCA1OCAxMSAyMyA1IDI4IDkgMTggMTUgLTE2IDEwIC01MgoxMCAtMTI0IC0xeiBtLTYwIC02MCBjLTMgLTUgLTE2IC0xNSAtMjggLTIxIC0yMSAtMTAgLTIxIC05IDIgMTAgMjUgMjMgMzYgMjcKMjYgMTF6Ii8+CjxwYXRoIGQ9Ik04MDY2IDIwMTUgYy0yMiAtNyAtNDggLTIzIC01OSAtMzMgLTE5IC0yMCAtMTkgLTIwIDUgLTM2IDQ5IC0zMgoxMTkgLTIzIDIzNCAzMCA3NSAzNSAxMDAgNjAgNDQgNDQgLTE3IC01IC01NyAtNSAtOTIgMSAtODAgMTEgLTg1IDExIC0xMzIgLTZ6Cm02NCAtNDUgYy0xNCAtNCAtMzggLTggLTU1IC04IGwtMzAgMCAzMCA4IGMxNyA0IDQxIDggNTUgOCBsMjUgMCAtMjUgLTh6Ii8+CjxwYXRoIGQ9Ik0xOTgyIDIwMDQgYzggLTggNDUgLTI2IDg0IC00MCAxMzAgLTQ5IDEyOSAtNDkgMTc5IC0zMCA1MSAyMCA1MiAzMAoxMSA2MCAtMjQgMTkgLTQzIDIxIC0xNTggMjIgLTExMSAxIC0xMjggMCAtMTE2IC0xMnogbTI2MyAtMzQgYzcgLTEyIC0yOSAtMTIKLTY1IDAgLTIxIDcgLTE5IDggMTcgOSAyMyAxIDQ1IC0zIDQ4IC05eiIvPgo8cGF0aCBkPSJNNzU2NCAxOTU1IGMtNyAtMTcgMzQgLTkxIDY1IC0xMTkgMjYgLTI0IDE0OCAtNzYgMTc2IC03NiAxNyAwIDE2IDQKLTExIDI1IC0xNyAxMyAtNDggNDkgLTcwIDgxIC0yNyAzOSAtNTMgNjMgLTg2IDgwIC01NSAyOCAtNjcgMjkgLTc0IDl6IG04OAotNjIgYzMyIC0zMSAzNyAtNDkgOSAtMzQgLTE5IDExIC01NiA2MSAtNDQgNjEgNCAwIDIwIC0xMiAzNSAtMjd6Ii8+CjxwYXRoIGQ9Ik0yNjMyIDE5MzkgYy0xOCAtMTIgLTQ0IC00MSAtNTggLTY1IC0xNCAtMjQgLTQyIC01OCAtNjIgLTc0IC00MQotMzMgLTQwIC00NiAyIC0yNSAxNSA4IDMyIDEzIDM3IDEwIDQgLTMgMzQgOCA2NyAyNCA1MCAyNSA2MiAzNyA4NSA4NCAxNSAzMQoyNyA1OCAyNyA2MSAwIDE0IC02OCA0IC05OCAtMTV6IG0yOCAtMzggYzAgLTUgLTEzIC0xOSAtMzAgLTMxIC0zNSAtMjUgLTM5Ci0xNiAtOCAxNyAyMiAyNCAzOCAzMCAzOCAxNHoiLz4KPHBhdGggZD0iTTIyNTUgMTg5OSBjLTUxIC0yOCAtNzggLTM4IC0xMDAgLTM2IC0xNiAzIC0zOSAxIC01MCAtMyAtMTcgLTYgLTE1Ci04IDE1IC0xOCA1OCAtMTkgMTcwIC0xOCAyMDggMiAzOCAyMCA2NiA0NSA4MiA3NSAxMCAyMCA4IDIxIC0zNyAyMSAtMzcgMAotNjMgLTkgLTExOCAtNDF6IG01NSAtMTQgYy0zMyAtMTkgLTUwIC0xOCAtMjYgMCAxMSA4IDI3IDE1IDM1IDE1IDEwIC0xIDcgLTYKLTkgLTE1eiIvPgo8cGF0aCBkPSJNMjQyMSAxODgxIGMtMzIgLTMyIC02OCAtNjIgLTc5IC02NiAtMTIgLTMgLTIyIC0xMCAtMjIgLTE1IDAgLTE3CjIwIC0yMSA1MyAtMTEgMTcgNSA1MiAxNSA3NiAyMSA0NiAxMiA4MSA0MyAxMDYgOTMgOCAxNyAxNSAzMiAxNSAzNCAwIDEgLTIwCjMgLTQ1IDMgLTQyIDAgLTUwIC00IC0xMDQgLTU5eiBtODQgMTEgYy02IC01IC0yMyAtMTQgLTQwIC0yMCBsLTMwIC0xMyAyNSAyMQpjMjMgMTggNjYgMzAgNDUgMTJ6Ii8+CjxwYXRoIGQ9Ik03NzIwIDE5MjQgYzAgLTggMTkgLTM1IDQzIC02MCAzNCAtMzcgNTQgLTQ4IDEwOCAtNjMgNTIgLTE0IDY3IC0xNQo3NyAtNSA5IDEwIDQgMTcgLTIzIDM0IC0xOSAxMiAtNDQgMzQgLTU1IDQ5IC0zNSA1MSAtMTUwIDg1IC0xNTAgNDV6IG0xMDUKLTU1IGMyMCAtMjIgMjAgLTIyIDAgLTExIC0xMSA1IC0yOSAyMCAtNDAgMzMgLTIwIDIyIC0yMCAyMiAwIDExIDExIC01IDI5Ci0yMCA0MCAtMzN6Ii8+CjxwYXRoIGQ9Ik03ODc4IDE5MzQgYy0xNCAtMTMgMzAgLTY1IDY5IC04NCA2MSAtMjkgMjMwIC0yNCAyNDAgNyAzIDggLTggMTAKLTM0IDYgLTMxIC00IC01MiAzIC0xMTUgMzYgLTcyIDM4IC0xNDIgNTMgLTE2MCAzNXogbTEwOCAtNDQgYzE1IC02IDI1IC0xMwoyMiAtMTUgLTMgLTMgLTIwIDEgLTM5IDkgLTM4IDE3IC0yNSAyMSAxNyA2eiIvPgo8cGF0aCBkPSJNNTA1IDE2MTAgYy05OSAtNCAtMTg3IC0xMCAtMTk2IC0xNCAtMzkgLTE3IC00MiAtNDcgLTQ2IC00NzYgLTUKLTUwOCA1IC03OTMgMzEgLTgzMSA5IC0xNSAyNyAtMzAgMzkgLTM0IDY0IC0yMSAxMTY3IC0xMSAxMjQ0IDExIDQ1IDEzIDUxIDU3CjU4IDQwNSAzIDE3OCAyIDQ1MyAtMiA2MTEgLTggMjgwIC05IDI4OCAtMzEgMzEwIGwtMjMgMjMgLTQ0NyAxIGMtMjQ2IDAgLTUyOAotMiAtNjI3IC02eiBtMTA2MCAtNTQgYzE5IC0xNCAyMCAtMzIgMjMgLTYyNCAyIC01MDUgMSAtNjExIC0xMSAtNjIwIC0xOSAtMTYKLTEyMDQgLTMwIC0xMjMzIC0xNCAtMTQgOCAtMjQgMjYgLTI4IDU0IC0xMSA2NiAtNyAxMTY4IDQgMTE4OSA2IDEwIDI0IDE5IDQzCjIyIDE3IDIgMjkxIDQgNjA3IDUgNDg2IDIgNTc5IDAgNTk1IC0xMnoiLz4KPHBhdGggZD0iTTEwNzUgMTUyMyBjLTMzIC04IC04NCAtNjQgLTk1IC0xMDMgLTEyIC00MSAtMTIgLTIzMCAtMSAtMzQ4IDEwCi05OCAyNSAtMTIyIDgyIC0xMjIgMzAgMCA0MiA2IDU1IDI1IDE1IDIyIDE2IDQ2IDkgMTkwIC03IDE3NiAtNCAyMDUgMjUgMjA1CjI0IDAgMzAgLTI3IDMwIC0xNTUgMCAtMjE1IDQ1IC0yNzMgMjAzIC0yNjMgODAgNSAxMjcgMzYgMTQ1IDk2IDE1IDQ5IDE2IDMzMwoxIDQwMSAtMTIgNTkgLTI5IDc1IC03NiA3NCAtNjUgLTIgLTY4IC0xMSAtNjggLTIyNiAwIC0xODkgMCAtMTkyIC0yMiAtMTk1Ci0yNSAtNCAtMjkgMTQgLTM5IDE5MSAtMTAgMTg0IC00MiAyMjggLTE2OSAyMzMgLTMzIDIgLTY5IDAgLTgwIC0zeiBtMTQ0IC01OQpjNDcgLTE5IDQ5IC0yNCA1NiAtMTc1IDggLTE2MyAxNCAtMTk4IDM2IC0yMjAgMjQgLTI0IDcwIC0yNCAxMDAgMCAyNCAxOSAyNAoyMiAyNCAyMDggMCAxODcgMCAxODggMjMgMTkxIDEyIDIgMjIgMiAyMiAwIDEgLTIgNSAtNzcgMTAgLTE2OCAxMyAtMjUyIC0xCi0yOTAgLTExMCAtMjk4IC0xMjggLTkgLTEzOSA4IC0xNTEgMjE0IC0xMCAxODEgLTE5IDIwNCAtNzkgMjA0IC0yNSAwIC00MyAtNwotNTYgLTIxIC0xNyAtMTkgLTE5IC0zOCAtMTkgLTIwNyAwIC0xNjQgLTIgLTE4NyAtMTYgLTE5MCAtOSAtMiAtMTkgNSAtMjMgMTQKLTExIDI5IC0xOSAyODUgLTEyIDM1NyA3IDY1IDkgNjggNDQgODcgNDUgMjMgOTkgMjUgMTUxIDR6Ii8+CjxwYXRoIGQ9Ik00MjMgMTUxMCBjLTEzIC01IC0zMiAtMjQgLTQzIC00MiAtMTkgLTMxIC0yMCAtNDkgLTE4IC0yNzUgMiAtMjI1CjMgLTI0MyAyMCAtMjQzIDExIDAgMjAgMTEgMjUgMjggOCAzMiAxMCAyMjggMyAzNjEgLTQgODggLTQgOTQgMTkgMTEyIDQ5IDQwCjEyMyAxMCAxMzUgLTU2IDYgLTI5IDExIC0zNSAzMyAtMzUgMTkgMCAyNCA0IDE5IDE2IC0zIDkgLTYgMjcgLTYgNDEgMCAxNgotMTQgMzkgLTM5IDY0IC0zMyAzNCAtNDUgMzkgLTgyIDM4IC0yNCAwIC01NCAtNCAtNjYgLTl6Ii8+CjxwYXRoIGQ9Ik03MjkgMTUwMyBjLTM2IC0yMiAtNTkgLTY0IC01OSAtMTA3IDAgLTI5IDQgLTM2IDE5IC0zNiAxNCAwIDIxIDEwCjI1IDM2IDEwIDQ5IDM4IDc0IDg0IDc0IDcxIDAgNzUgLTEyIDczIC0yMjggLTEgLTEwNCAxIC0yMTIgNSAtMjQwIDYgLTQ0IDEwCi01MiAyOCAtNTIgMjEgMCAyMSAyIDE5IDIxOCAtMSAxMTkgLTIgMjMyIC0yIDI1MSAtMSAyNCAtMTEgNDMgLTM1IDY3IC0yOSAyOQotNDAgMzQgLTgyIDM0IC0yNyAwIC02MSAtOCAtNzUgLTE3eiIvPgo8cGF0aCBkPSJNNDYzIDE0MDUgYy0xMSAtMjkgMTEgLTg3IDQwIC0xMDkgMjMgLTE3IDQ2IC0yMiAxMTYgLTI0IDExNyAtNSAxNjQKOCAxODUgNTIgMTggMzcgMjEgODIgNyA5MCAtMTkgMTIgLTQwIC03IC00MyAtMzcgLTQgLTQzIC0zNSAtNTcgLTEzNCAtNTcgLTkxCjAgLTEwOSA5IC0xMjIgNjAgLTkgMzggLTM4IDUyIC00OSAyNXoiLz4KPHBhdGggZD0iTTQ4NiAxMjIxIGMtMjcgLTI5IC0yMCAtMTc4IDEwIC0yMTggNTggLTc4IDIwOSAtODUgMjc4IC0xMyAzMiAzNAo0NSA4MSA0NiAxNTUgMCA2OSAtMTkgOTUgLTcxIDk1IC01MCAwIC03MiAtMjUgLTc5IC04OCAtNCAtMzkgLTkgLTQ3IC0yNSAtNDcKLTE2IDAgLTIxIDggLTI1IDQ3IC0zIDI2IC0xNCA1NiAtMjQgNjcgLTI1IDI4IC04NiAyOCAtMTEwIDJ6IG04NCAtOTQgYzYgLTY1CjI0IC04NyA3MCAtODcgNDQgMCA2NCAyMyA3NSA4NyA4IDQ4IDEzIDU4IDMwIDU4IDE4IDAgMjAgLTYgMTggLTY5IC0xIC02MCAtNQotNzIgLTI5IC05NyAtMjUgLTI2IC0zNCAtMjkgLTkwIC0yOSAtODYgMCAtMTExIDIyIC0xMjUgMTA5IC0xMiA3NiAtNyA5NCAyMwo4OSAyMCAtMyAyNCAtMTAgMjggLTYxeiIvPgo8cGF0aCBkPSJNMTAxNCA4NzYgbC0zMyAtMzMgMSAtMjUyIGMyIC0yNTcgNyAtMjg1IDM5IC0yMjQgMTEgMjEgMTMgNzEgMTEKMjQxIC0yIDE4OSAwIDIxNyAxNCAyMzQgMTcgMTggNTEgMjMgODkgMTIgMTEgLTMgMzEgLTI4IDQ1IC01NyAyNiAtNTMgNDMgLTYyCjQ4IC0yNiA2IDM2IC02IDY1IC00NCAxMDMgLTMyIDMyIC00MiAzNiAtODYgMzYgLTQzIDAgLTU0IC00IC04NCAtMzR6Ii8+CjxwYXRoIGQ9Ik0xMzQzIDg5MCBjLTM5IC0yMyAtNTEgLTQ0IC01NSAtOTYgLTIgLTMyIDAgLTM5IDE1IC0zOSAxMyAwIDIzIDEzCjMzIDQwIDE3IDQ5IDM3IDY1IDg1IDY1IDYyIDAgNjQgLTcgNjQgLTI1NCAwIC0yMjUgNiAtMjY2IDQwIC0yNjYgMTIgMCAxNCA0MAoxNSAyNDggMCAyNjIgLTEgMjcxIC01MCAzMDkgLTI0IDIwIC0xMTAgMTYgLTE0NyAtN3oiLz4KPHBhdGggZD0iTTQ2NSA4OTQgYy01MCAtMTIgLTczIC0yOCAtOTggLTY2IC0zNCAtNTMgLTM3IC0xMjcgLTYgLTE5OCAzMSAtNzMKNTkgLTgyIDI1NCAtODkgMTUxIC02IDE2MCAtNyAxNjAgLTI2IDAgLTE5IC04IC0yMCAtMTkwIC0yNSAtMTA0IC0zIC0xOTYgLTkKLTIwMyAtMTMgLTE5IC0xMiAtMzQgLTU3IC0yOCAtODIgMyAtMTEgMjAgLTI5IDM4IC00MCAzMCAtMTggNTEgLTIwIDIzMyAtMjAKMjIxIDAgMjQyIDUgMjg2IDY2IDI5IDQyIDMyIDE1NSA2IDIxNSAtMzEgNjggLTg0IDg0IC0yNzAgODIgLTE0NyAtMSAtMTgyIDgKLTE0MyAzOCAxNiAxMSA2MCAxNCAyMDIgMTQgbDE4MiAwIDI2IDMxIGMyOSAzNCAyOCA2MCAtNSA5NCAtMTggMTkgLTM0IDIwCi0yMjIgMjIgLTExMSAxIC0yMTEgLTEgLTIyMiAtM3ogbTQwNiAtNTUgYzUgLTggNyAtMTggNiAtMjQgLTIgLTYgLTg0IC0xMgotMjAzIC0xNiAtMTA5IC0zIC0yMDAgLTYgLTIwMiAtNyAtMiAtMSAtMTAgLTE4IC0xNyAtMzcgLTE5IC00NCAtNSAtNzkgMzkKLTk2IDE3IC02IDEwMiAtMTQgMTg5IC0xOCAxNTAgLTYgMTYwIC03IDE3OCAtMjkgMzcgLTQ3IDM3IC0xNjMgLTEgLTE5NyAtMjYKLTI0IC0xNDYgLTM0IC0zMTAgLTI4IC04NyA0IC0xMjkgOSAtMTQwIDE5IC05IDkgLTExIDE3IC01IDIzIDYgNSA5NCAxMSAxOTYKMTMgMTY3IDMgMTg5IDUgMjA4IDIyIDI1IDIyIDI4IDcyIDcgMTAyIC0xNCAxOSAtMjggMjEgLTE5MyAyNyBsLTE3OCA2IC0yNwozMSBjLTI0IDI2IC0yOCAzOSAtMjggOTAgMCA1MSA0IDY0IDI4IDkwIDI0IDI3IDM2IDMyIDEwNyA0MCAxMjEgMTMgMzM1IDcKMzQ2IC0xMXoiLz4KPHBhdGggZD0iTTEwODcgODA0IGMtMTMgLTE0IC03IC01OSAxMyAtOTEgMjUgLTQyIDc5IC01NyAxODYgLTUxIDgyIDQgMTQyIDI3CjEyOSA0OSAtNCA1IC0xIDggNyA3IDkgLTIgMTQgMTEgMTYgNDUgMyA0NCAyIDQ3IC0yMiA0NyAtMjAgMCAtMjcgLTYgLTMyIC0yNwotMTAgLTQ5IC0xMyAtNTMgLTM5IC02MyAtMzMgLTEzIC0xNDYgLTEzIC0xNzggLTEgLTE3IDcgLTI3IDIxIC0zNCA0OCAtOCAzNQotMzAgNTMgLTQ2IDM3eiIvPgo8cGF0aCBkPSJNMTEyNSA2MjggYy00MSAtMjMgLTQ2IC0zOSAtNDAgLTExNyAzIC00MSAxMiAtODkgMTkgLTEwNiAyOCAtNjcKMTYzIC05NiAyNDYgLTUzIDU2IDI5IDgxIDc2IDg4IDE2NyA0IDY2IDQgNjggLTI4IDk0IC0zOSAzMyAtNjEgMzQgLTk0IDUgLTE5Ci0xNyAtMjggLTM4IC0zNCAtNzggLTUgLTM4IC0xMiAtNTUgLTIyIC01NSAtOCAwIC0xNiA3IC0xNyAxNSAtOSA2OSAtMTggOTUKLTM4IDExNiAtMjYgMjYgLTQ5IDMwIC04MCAxMnogbTQ0IC00NyBjNyAtNSAxNiAtMzUgMjAgLTY3IDUgLTUyIDkgLTYwIDM0Ci03MiA2MCAtMjkgMTA3IDYgMTA3IDc3IDAgNTcgMTcgNzggNDUgNTcgMTcgLTEyIDE4IC0xOSA2IC04NCAtMTQgLTc5IC0zMAotOTcgLTk5IC0xMDggLTg2IC0xNCAtMTM1IDI3IC0xNDggMTI0IC05IDcyIDEgOTQgMzUgNzN6Ii8+CjwvZz4KPC9zdmc+Cg==" 
          alt="作者水印"
          className="pointer-events-none select-none opacity-50 absolute bottom-3 right-4 h-10"
        />
      </div>
    </div>
  );
}

function NamingScreen({ players, setPlayers, onFinalize }) {
  const humans = players.filter(p => !p.isAI);
  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-950 p-6 font-sans">
      <div className="bg-slate-900 p-12 rounded-3xl border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] w-[540px] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
        <h2 className="text-3xl font-black text-center mb-8 text-slate-100 tracking-widest uppercase">玩家名稱</h2>
        <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2">
          {humans.map(p => (
            <div key={p.id} className="flex items-center gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800 focus-within:border-blue-500 transition-colors">
               <div className="w-12 h-12 rounded-lg shrink-0 border border-slate-700 flex items-center justify-center"><ShapeSVG color={p.color} shape={p.shape} size={30} /></div>
               <div className="flex-1"><input value={p.name} placeholder="輸入名稱..." onChange={e => setPlayers(prev => prev.map(x=>x.id===p.id?{...x, name:e.target.value}:x))} className="w-full bg-transparent text-xl font-black text-slate-200 outline-none placeholder:text-slate-700" /></div>
            </div>
          ))}
          {humans.length === 0 && <p className="text-center text-slate-600 font-black py-10 uppercase tracking-widest animate-pulse">全 AI 模式：正在建構算法...</p>}
        </div>
        <button onClick={onFinalize} className="w-full bg-blue-600 text-white py-5 rounded-xl font-black text-lg hover:bg-blue-500 active:scale-95 transition-all tracking-widest uppercase">確認名稱</button>
      </div>
    </div>
  );
}

function GameOverScreen({ players }) {
  const winner = players.find(p => p.victoryTitle);

  // 依不同成就選擇圖片（放在 public/picture 底下）
const victoryImage =
  winner?.victoryTitle === "King of Leisure"
    ? process.env.PUBLIC_URL + "/picture/kingofleisure.png"
    : winner?.victoryTitle === "打工皇帝"
    ? process.env.PUBLIC_URL + "/picture/kingofwork.png"
    : winner?.victoryTitle === "山大王"
    ? process.env.PUBLIC_URL + "/picture/kingofcompany.png"
    : winner?.victoryTitle === "瘋王"
    ? process.env.PUBLIC_URL + "/picture/madking.png"
    : winner?.victoryTitle === "邪教上帝"
    ? process.env.PUBLIC_URL + "/picture/cultgod.png"
    : null;

  // 不同成就專屬祝賀訊息
  const congratsMessage =
    winner?.victoryTitle === "打工皇帝"
      ? "你在 36 圈內從未停留在假日格，成為社畜中的傳奇打工皇帝。"
      : winner?.victoryTitle === "King of Leisure"
      ? "你在 36 圈內從未停留在工作日格，用一生證明躺平才是王道。"
      : winner?.victoryTitle === "山大王"
      ? "你囤積公司股份成為資本山大王，在無間輪迴中掌控整個公司職場版圖。"
      : winner?.victoryTitle === "瘋王"
      ? "你在壓力與大麻之間反覆橫跳，最終登基為扭曲三觀的瘋王。"
      : winner?.victoryTitle === "邪教上帝"
      ? "你在信念歸零後重建信仰，靠奉獻堆到滿，成為無間輪迴中的邪教上帝。"
      : "你已在無間輪迴中，寫下了屬於自己的傳奇。";

  // 按鈕文字也可依不同成就微調
  const buttonText =
    winner?.victoryTitle === "打工皇帝"
      ? "繼續輪迴 • 挑戰下一個極限"
      : winner?.victoryTitle === "King of Leisure"
      ? "繼續輪迴 • 享受下一個假期"
      : winner?.victoryTitle === "山大王"
      ? "繼續輪迴 • 擴大你的帝國"
      : winner?.victoryTitle === "瘋王"
      ? "繼續輪迴 • 再瘋一次看看"
      : winner?.victoryTitle === "邪教上帝"
      ? "繼續輪迴 • 帶領信徒重開一局"
      : "繼續輪迴 • 開始新的一輪";

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-950 p-6 font-sans">
      <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500 rounded-3xl shadow-[0_0_70px_rgba(245,158,11,0.5)] overflow-hidden">
        
        {/* 頂部標題 */}
        <div className="py-6 bg-gradient-to-r from-amber-600 to-yellow-600 text-center font-black text-2xl tracking-widest text-white">
          🏆 極端成就達成
        </div>

        {winner && (
          <div className="p-10 text-center">
            {/* 勝利大圖 - 與道具卡 showItemEffect 風格一致 */}
            {victoryImage && (
              <div className="mb-8 flex justify-center">
                <img 
                  src={victoryImage} 
                  alt={winner.victoryTitle}
                  className="w-80 h-80 object-contain drop-shadow-2xl rounded-2xl"
                />
              </div>
            )}

            {/* 玩家名稱 */}
            <h2 className="text-4xl font-black text-amber-300 mb-3 tracking-tight">
              {winner.name}
            </h2>
            
            {/* 勝利稱號 */}
            <p className="text-3xl font-black text-amber-400 mb-12 tracking-tight">
              {winner.victoryTitle}
            </p>

            <div className="text-slate-400 text-lg">
  {congratsMessage}
</div>
          </div>
        )}

        {/* 底部確認按鈕 */}
        <div className="p-6 border-t border-slate-700 bg-slate-950">
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-5 rounded-2xl font-black text-xl tracking-widest transition-all active:scale-[0.98] shadow-lg"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}