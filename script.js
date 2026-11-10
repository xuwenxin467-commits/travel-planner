// ============================================================
// 旅游路线推荐系统 script.js
// 依赖：请先加载 data.js，再加载本文件。
// 功能：中/韩/英切换、45个地区别名、时间线、交通路线、预算、攻略保存。
// ============================================================

// -------------------------
// 用户选择的数据
// -------------------------
let selectedDays = 0;
let selectedPeople = 0;
let selectedPreferences = [];
let currentPlan = null;
let hasGeneratedPlan = false;
let routeMode = "automatic";
let customSelectedAttractionKeys = [];
let customPickerCity = "";

// 智能行程提醒：仅在页面打开期间运行
let smartReminderTimer = null;
(function initializeTripStartDate() {
    const input = document.getElementById("tripStartDate");
    if (!input) return;
    const now = new Date();
    input.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
})();

function getCurrentTripDayNumber() {
    const input = document.getElementById("tripStartDate");
    if (!input || !input.value) return 1;
    const start = new Date(`${input.value}T00:00:00`);
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    return Math.floor((todayDate - startDate) / 86400000) + 1;
}
const smartReminderSent = new Set();
const smartScheduleRegistry = {};

// 当前网站语言：zh 中文，ko 韩语，en 英语
let currentLanguage = "zh";
let isKorean = false; // 兼容页面中可能仍在使用 isKorean 的旧代码

const preferenceTypeMap = {
    "美食": [],
    "购物": ["购物"],
    "历史": ["历史古建"],
    "自然": ["自然风光"],
    "拍照": ["拍照"],
    "文艺": ["文艺展览"]
};

const preferenceNames = {
    "美食": { zh: "吃吃喝喝", ko: "맛집 / 음식", en: "Food" },
    "购物": { zh: "逛街购物", ko: "쇼핑", en: "Shopping" },
    "历史": { zh: "历史古建", ko: "역사 / 문화", en: "History & Architecture" },
    "自然": { zh: "自然风光", ko: "자연 경관", en: "Nature" },
    "拍照": { zh: "拍照出片", ko: "사진 명소", en: "Photography" },
    "文艺": { zh: "文艺展览", ko: "전시 / 예술", en: "Art & Exhibitions" }
};

// 中文、韩语、英语及常用拼写统一映射到 data.js 中的中文城市键。
// data.js 中的城市键必须与这里映射后的中文名称一致。
const cityAlias = {
    "南京": "南京", "南京市": "南京", "난징": "南京", "난징시": "南京", "nanjing": "南京",
    "首尔": "首尔", "首尔市": "首尔", "서울": "首尔", "서울시": "首尔", "seoul": "首尔",
    "上海": "上海", "上海市": "上海", "상하이": "上海", "상해": "上海", "shanghai": "上海",
    "北京": "北京", "北京市": "北京", "베이징": "北京", "북경": "北京", "beijing": "北京",
    "武汉": "武汉", "武汉市": "武汉", "우한": "武汉", "wuhan": "武汉",
    "釜山": "釜山", "釜山市": "釜山", "부산": "釜山", "부산시": "釜山", "busan": "釜山",
    "成都": "成都", "成都市": "成都", "청두": "成都", "청두시": "成都", "chengdu": "成都",
    "重庆": "重庆", "重庆市": "重庆", "충칭": "重庆", "충칭시": "重庆", "chongqing": "重庆",
    "杭州": "杭州", "杭州市": "杭州", "항저우": "杭州", "hangzhou": "杭州",
    "西安": "西安", "西安市": "西安", "시안": "西安", "xi'an": "西安", "xian": "西安",
    "广州": "广州", "广州市": "广州", "광저우": "广州", "guangzhou": "广州",
    "苏州": "苏州", "苏州市": "苏州", "쑤저우": "苏州", "suzhou": "苏州",
    "厦门": "厦门", "厦门市": "厦门", "샤먼": "厦门", "xiamen": "厦门",
    "深圳": "深圳", "深圳市": "深圳", "선전": "深圳", "shenzhen": "深圳",
    "东京": "东京", "도쿄": "东京", "도쿄도": "东京", "tokyo": "东京", "東京": "东京",
    "大阪": "大阪", "오사카": "大阪", "오사카시": "大阪", "osaka": "大阪",
    "京都": "京都", "교토": "京都", "교토시": "京都", "kyoto": "京都",
    "济州岛": "济州岛", "济州": "济州岛", "제주도": "济州岛", "제주": "济州岛", "jeju": "济州岛", "jeju island": "济州岛",
    "青岛": "青岛", "青岛市": "青岛", "칭다오": "青岛", "qingdao": "青岛",
    "三亚": "三亚", "三亚市": "三亚", "싼야": "三亚", "sanya": "三亚",
    "丽江": "丽江", "丽江市": "丽江", "리장": "丽江", "lijiang": "丽江",
    "哈尔滨": "哈尔滨", "哈尔滨市": "哈尔滨", "하얼빈": "哈尔滨", "harbin": "哈尔滨",
    "桂林": "桂林", "桂林市": "桂林", "구이린": "桂林", "guilin": "桂林",
    "大邱": "大邱", "대구": "大邱", "daegu": "大邱",
    "仁川": "仁川", "인천": "仁川", "incheon": "仁川",
    "庆州": "庆州", "경주": "庆州", "gyeongju": "庆州",
    "福冈": "福冈", "후쿠오카": "福冈", "fukuoka": "福冈", "福岡": "福冈",
    "札幌": "札幌", "삿포로": "札幌", "sapporo": "札幌",
    "名古屋": "名古屋", "나고야": "名古屋", "nagoya": "名古屋",
    "冲绳": "冲绳", "沖繩": "冲绳", "오키나와": "冲绳", "okinawa": "冲绳",
    "天津": "天津", "天津市": "天津", "톈진": "天津", "tianjin": "天津",
    "香港": "香港", "홍콩": "香港", "hong kong": "香港", "hongkong": "香港",
    "澳门": "澳门", "澳門": "澳门", "마카오": "澳门", "macau": "澳门", "macao": "澳门",
    "长沙": "长沙", "长沙市": "长沙", "창사": "长沙", "changsha": "长沙",
    "张家界": "张家界", "장자제": "张家界", "zhangjiajie": "张家界",
    "昆明": "昆明", "昆明市": "昆明", "쿤밍": "昆明", "kunming": "昆明",
    "大理": "大理", "大理市": "大理", "다리": "大理", "dali": "大理",
    "全州": "全州", "전주": "全州", "jeonju": "全州",
    "水原": "水原", "수원": "水原", "suwon": "水原",
    "江陵": "江陵", "강릉": "江陵", "gangneung": "江陵",
    "横滨": "横滨", "橫濱": "横滨", "요코하마": "横滨", "yokohama": "横滨", "横浜": "横滨",
    "奈良": "奈良", "나라": "奈良", "nara": "奈良",
    "神户": "神户", "神戶": "神户", "고베": "神户", "kobe": "神户", "神戸": "神户",
    "广岛": "广岛", "廣島": "广岛", "히로시마": "广岛", "hiroshima": "广岛", "広島": "广岛",
    "金泽": "金泽", "金澤": "金泽", "가나자와": "金泽", "kanazawa": "金泽", "金沢": "金泽",
    "大田": "大田", "대전": "大田", "daejeon": "大田",
    "丽水": "丽水", "여수": "丽水", "yeosu": "丽水",
    "浦项": "浦项", "포항": "浦项", "pohang": "浦项",
    "安东": "安东", "안동": "安东", "andong": "安东",
    "春川": "春川", "춘천": "春川", "chuncheon": "春川",
    "统营": "统营", "통영": "统营", "tongyeong": "统营",
    "长崎": "长崎", "나가사키": "长崎", "nagasaki": "长崎", "長崎": "长崎",
    "仙台": "仙台", "센다이": "仙台", "sendai": "仙台",
    "函馆": "函馆", "하코다테": "函馆", "hakodate": "函馆", "函館": "函馆",
    "熊本": "熊本", "구마모토": "熊本", "kumamoto": "熊本",
    "松山": "松山", "마쓰야마": "松山", "matsuyama": "松山",
    "高松": "高松", "다카마쓰": "高松", "takamatsu": "高松",
    "镰仓": "镰仓", "가마쿠라": "镰仓", "kamakura": "镰仓", "鎌倉": "镰仓",
    "日光": "日光", "닛코": "日光", "nikko": "日光",

    // 新增地区：中国
    "沈阳": "沈阳", "선양": "沈阳", "shenyang": "沈阳",
    "郑州": "郑州", "정저우": "郑州", "zhengzhou": "郑州",
    "贵阳": "贵阳", "구이양": "贵阳", "guiyang": "贵阳",
    "福州": "福州", "푸저우": "福州", "fuzhou": "福州",
    "银川": "银川", "인촨": "银川", "yinchuan": "银川",
    "兰州": "兰州", "란저우": "兰州", "lanzhou": "兰州",

    // 新增地区：韩国
    "光州": "光州", "광주": "光州", "gwangju": "光州",
    "蔚山": "蔚山", "울산": "蔚山", "ulsan": "蔚山",
    "束草": "束草", "속초": "束草", "sokcho": "束草",
    "昌原": "昌原", "창원": "昌原", "changwon": "昌原",

    // 新增地区：日本
    "鹿儿岛": "鹿儿岛", "가고시마": "鹿儿岛", "kagoshima": "鹿儿岛",
    "冈山": "冈山", "오카야마": "冈山", "okayama": "冈山",
    "别府": "别府", "벳푸": "别府", "beppu": "别府",
    "高山": "高山", "다카야마": "高山", "takayama": "高山",

    // 新增地区：东南亚及台湾
    "新加坡": "新加坡", "싱가포르": "新加坡", "singapore": "新加坡",
    "曼谷": "曼谷", "방콕": "曼谷", "bangkok": "曼谷",
    "清迈": "清迈", "치앙마이": "清迈", "chiang mai": "清迈",
    "普吉岛": "普吉岛", "푸껫": "普吉岛", "phuket": "普吉岛",
    "河内": "河内", "하노이": "河内", "hanoi": "河内",
    "胡志明市": "胡志明市", "호찌민시": "胡志明市",
    "ho chi minh city": "胡志明市", "hochiminhcity": "胡志明市",
    "岘港": "岘港", "다낭": "岘港", "da nang": "岘港",
    "吉隆坡": "吉隆坡", "쿠알라룸푸르": "吉隆坡", "kuala lumpur": "吉隆坡",
    "槟城": "槟城", "페낭": "槟城", "penang": "槟城",
    "巴厘岛": "巴厘岛", "발리": "巴厘岛", "bali": "巴厘岛",
    "台北": "台北", "타이베이": "台北", "taipei": "台北",
    "高雄": "高雄", "가오슝": "高雄", "kaohsiung": "高雄",
    
    // 新增韩国旅游地区：中文、韩文、英文搜索
    "水原": "水原", "수원": "水原", "suwon": "水原",
    "庆州": "庆州", "경주": "庆州", "gyeongju": "庆州",
    "全州": "全州", "전주": "全州", "jeonju": "全州",
    "江陵": "江陵", "강릉": "江陵", "gangneung": "江陵",
    "束草": "束草", "속초": "束草", "sokcho": "束草",
    "安东": "安东", "안동": "安东", "andong": "安东",
    "丽水": "丽水", "여수": "丽水", "yeosu": "丽水",
    "统营": "统营", "통영": "统营", "tongyeong": "统营",
    "浦项": "浦项", "포항": "浦项", "pohang": "浦项",
    "春川": "春川", "춘천": "春川", "chuncheon": "春川",
    "坡州": "坡州", "파주": "坡州", "paju": "坡州",
    "孔州": "孔州", "공주": "孔州", "gongju": "孔州",
    "清州": "清州", "청주": "清州", "cheongju": "清州",
    "木浦": "木浦", "목포": "木浦", "mokpo": "木浦",
        // ===== 补齐已有地区的中文、韩文、英文搜索别名 =====

    // 中国
    "无锡": "无锡",
    "wuxi": "无锡",
    "우시": "无锡",

    "宁波": "宁波",
    "ningbo": "宁波",
    "닝보": "宁波",

    "温州": "温州",
    "wenzhou": "温州",
    "원저우": "温州",

    "珠海": "珠海",
    "zhuhai": "珠海",
    "주하이": "珠海",

    "佛山": "佛山",
    "foshan": "佛山",
    "포산": "佛山",

    "洛阳": "洛阳",
    "luoyang": "洛阳",
    "뤄양": "洛阳",

    "敦煌": "敦煌",
    "dunhuang": "敦煌",
    "둔황": "敦황",

    "乌鲁木齐": "乌鲁木齐",
    "urumqi": "乌鲁木齐",
    "우루무치": "乌鲁무치",

    "泉州": "泉州",
    "quanzhou": "泉州",
    "취안저우": "泉州",

    "景德镇": "景德镇",
    "jingdezhen": "景德镇",
    "징더전": "景德镇",

    "大同": "大同",
    "datong": "大同",
    "다퉁": "大同",

    "开封": "开封",
    "kaifeng": "开封",
    "카이펑": "开封",

    "扬州": "扬州",
    "yangzhou": "扬州",
    "양저우": "扬州",

    "绍兴": "绍兴",
    "shaoxing": "绍兴",
    "사오싱": "绍兴",

    "台州": "台州",
    "taizhou": "台州",
    "타이저우": "台州",

    "黄山": "黄山",
    "huangshan": "黄山",
    "황산": "黄山",

    "安顺": "安顺",
    "anshun": "安顺",
    "안순": "安顺",

    "铜仁": "铜仁",
    "tongren": "铜仁",
    "퉁런": "铜仁",

    "林芝": "林芝",
    "linzhi": "林芝",
    "린즈": "林芝",

    "喀什": "喀什",
    "kashgar": "喀什",
    "카슈가르": "喀什",

    "吐鲁番": "吐鲁番",
    "turpan": "吐鲁番",
    "투루판": "吐鲁番",

    "张掖": "张掖",
    "zhangye": "张掖",
    "장예": "张掖",

    "宜昌": "宜昌",
    "yichang": "宜昌",
    "이창": "宜昌",

    "襄阳": "襄阳",
    "xiangyang": "襄阳",
    "샹양": "襄阳",

    "南平": "南平",
    "nanping": "南平",
    "난핑": "南平",

    "宁德": "宁德",
    "ningde": "宁德",
    "닝더": "宁德",

    "延安": "延安",
    "yan'an": "延安",
    "옌안": "延安",

    "秦皇岛": "秦皇岛",
    "qinhuangdao": "秦皇岛",
    "친황다오": "秦皇岛",

    // 韩国
    "群山": "群山",
    "gunsan": "群山",
    "군산": "群山",

    "南海": "南海",
    "namhae": "南海",
    "남해": "南海",

    "原州": "原州",
    "wonju": "原州",
    "원주": "原州",

    "忠州": "忠州",
    "chungju": "忠州",
    "충주": "忠州",

    // 日本
    "静冈": "静冈",
    "shizuoka": "静冈",
    "시즈오카": "静冈",

    "松本": "松本",
    "matsumoto": "松本",
    "마쓰모토": "松本",

    "姬路": "姬路",
    "himeji": "姬路",
    "히메지": "姬路",

    "宇都宫": "宇都宫",
    "utsunomiya": "宇都宫",
    "우쓰노미야": "宇都宫",

    "横须贺": "横须贺",
    "yokosuka": "横须贺",
    "요코스카": "横须贺",

    "高崎": "高崎",
    "takasaki": "高崎",
    "다카사키": "高崎",

    "富士吉田": "富士吉田",
    "fujiyoshida": "富士吉田",
    "후지요시다": "富士吉田",

    // 东南亚
    "清莱": "清莱",
    "chiang rai": "清莱",
    "치앙라이": "清莱",

    "会安": "会安",
    "hoi an": "会安",
    "호이안": "会安",

    "马六甲": "马六甲",
    "malacca": "马六甲",
    "멜라카": "马六甲",
};

function normalizeDestination(value) {
    const input = String(value || "").trim();
    if (!input) return "";
    const alias = cityAlias[input.toLowerCase()];
    if (alias) return alias;
    // 兼容 data.js 中已存在的中文城市键
    if (typeof travelData !== "undefined" && travelData[input]) return input;
    return input;
}

// -------------------------
// 三语文本辅助函数
// -------------------------
function getText(value) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return value[currentLanguage] || value.zh || value.ko || value.en || "";
}

function translateType(type) {
    const translations = {
        "历史古建": { zh: "历史古建", ko: "역사 유적", en: "Historical Sites" },
        "自然风光": { zh: "自然风光", ko: "자연 경관", en: "Natural Scenery" },
        "拍照": { zh: "拍照", ko: "사진 촬영", en: "Photography" },
        "购物": { zh: "购物", ko: "쇼핑", en: "Shopping" },
        "文艺展览": { zh: "文艺展览", ko: "문화·예술 전시", en: "Arts & Exhibitions" },
        "美食": { zh: "美食", ko: "음식", en: "Food" }
    };
    return translations[type]?.[currentLanguage] || type || "";
}

function translateTime(time) {
    const translations = {
        "1小时": { zh: "1小时", ko: "1시간", en: "1 hour" },
        "2小时": { zh: "2小时", ko: "2시간", en: "2 hours" },
        "3小时": { zh: "3小时", ko: "3시간", en: "3 hours" },
        "4小时": { zh: "4小时", ko: "4시간", en: "4 hours" },
        "半天": { zh: "半天", ko: "반나절", en: "Half a day" },
        "4小时以上": { zh: "4小时以上", ko: "4시간 이상", en: "4+ hours" }
    };
    return translations[time]?.[currentLanguage] || time || "";
}

function durationToMinutes(time) {
    if (!time) return 120;

    const value = String(time).trim();

    if (value.includes("半天以上")) return 300;
    if (value.includes("半天")) return 240;
    if (value.includes("4小时以上")) return 240;

    // 正确识别1.5小时、2.5小时等小数时长
    const hourMatch = value.match(/(\d+(?:\.\d+)?)\s*小时/);
    if (hourMatch) {
        return Math.round(Number(hourMatch[1]) * 60);
    }

    const minuteMatch = value.match(/(\d+)\s*分钟/);
    if (minuteMatch) {
        return Number(minuteMatch[1]);
    }

    return 120;
}

function formatClock(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getCityKeyForMap(city, name) {
    const attractionName = typeof name === "string" ? name : getText(name);
    return `${city} ${attractionName}`.trim();
}


// ==========================================
// 自动查询景点照片（Wikimedia Commons）
// ==========================================
// Openverse 免费图片查询

// ==========================================
// Openverse 多照片查询
// ==========================================
async function searchOpenversePhotos(
    searchQuery,
    rejectedWords = [],
    sceneryWords = [],
    identityTerms = []
) {
    try {
        const params = new URLSearchParams({
            q: searchQuery,
            page_size: "20"
        });

        const response = await fetch(
            "https://api.openverse.org/v1/images/?" + params.toString()
        );

        if (!response.ok) {
            throw new Error("Openverse 请求失败：" + response.status);
        }

        const data = await response.json();

        const results = (data.results || []).map(item => {
            const title = item.title || "";
            const tags = (item.tags || [])
                .map(tag => tag.name || "")
                .join(" ");

            const text = (title + " " + tags).toLowerCase();

            const width = Number(item.width || 0);
            const height = Number(item.height || 0);

            if (!item.thumbnail && !item.url) return null;
            if (width < 800 || height < 450) return null;
            if (width / height < 0.8) return null;

            if (rejectedWords.some(word =>
                text.includes(String(word).toLowerCase())
            )) return null;

            const matched = identityTerms.filter(word =>
    text.includes(String(word).toLowerCase())
).length;

// 标题或标签没有出现景点名称时，不允许进入图库
if (identityTerms.length > 0 && matched === 0) {
    return null;
}

// 标题、描述或分类完全没有出现景点名称时，拒绝该图片
if (identityTerms.length > 0 && matched === 0) {
    return null;
}

// Wikimedia 图片必须匹配景点名称，否则不允许进入图库

const sceneryScore = sceneryWords.filter(word =>
    text.includes(String(word).toLowerCase())
).length;

            return {
                url: item.thumbnail || item.url,
                source: item.foreign_landing_url || "",
                license: item.license
                    ? item.license.toUpperCase()
                    : "许可信息未提供",
                creator: item.creator || "",
                title: title,
                score: matched * 10 + sceneryScore * 3,
                provider: "Openverse"
            };
        }).filter(Boolean);

        results.sort((a, b) => b.score - a.score);

        return results;

    } catch (error) {
        console.warn("Openverse 图片查询失败：", error);
        return [];
    }
}


// ==========================================
// Wikimedia Commons 多照片查询
// ==========================================
async function searchWikimediaPhotos(
    searchQuery,
    rejectedWords = [],
    sceneryWords = [],
    identityTerms = []
) {
    try {
        const params = new URLSearchParams({
            action: "query",
            generator: "search",
            gsrsearch: searchQuery
    .replace(/\s+(landscape|scenery|view|photo|photos|image|images)\b/gi, "")
    .trim(),
            gsrnamespace: "6",
            gsrlimit: "50",
            prop: "imageinfo|categories",
            iiprop: "url|size|mime|sha1|extmetadata",
            iiurlwidth: "1200",
            iiextmetadatamultilang: "1",
            cllimit: "max",
            clshow: "!hidden",
            format: "json",
            origin: "*"
        });

        const response = await fetch(
            "https://commons.wikimedia.org/w/api.php?" +
            params.toString()
        );

        if (!response.ok) {
            throw new Error("Wikimedia 请求失败：" + response.status);
        }

        const data = await response.json();
        const pages = Object.values(data.query?.pages || {});

        const results = pages.map(page => {
            const info = page.imageinfo?.[0];

            if (!info || !info.thumburl) return null;

            const title = page.title || "";
            const metadata = info.extmetadata || {};

            const description = String(
                metadata.ImageDescription?.value || ""
            ).replace(/<[^>]*>/g, " ");

            const categories = (page.categories || [])
                .map(item => item.title || "")
                .join(" ");

            const text = (
                title + " " + description + " " + categories
            ).toLowerCase();

            const width = Number(info.width || 0);
            const height = Number(info.height || 0);

            if (width < 800 || height < 450) return null;
            if (width / height < 0.8) return null;

            const mime = (info.mime || "").toLowerCase();

            if (![
                "image/jpeg",
                "image/png",
                "image/webp"
            ].includes(mime)) return null;

            if (rejectedWords.some(word =>
                text.includes(String(word).toLowerCase())
            )) return null;

            const matched = identityTerms.filter(word =>
    text.includes(String(word).toLowerCase())
).length;

// 必须匹配景点名称，否则拒绝图片

const sceneryScore = sceneryWords.filter(word =>
    text.includes(String(word).toLowerCase())
).length;

            return {
    url: info.thumburl,

    // Wikimedia 图片文件的唯一信息
    pageId: page.pageid || "",
    sha1: info.sha1 || "",

    source: info.descriptionurl || "",
                license: metadata.LicenseShortName?.value ||
                    "许可信息未提供",
                creator: metadata.Artist?.value
                    ? String(metadata.Artist.value).replace(/<[^>]*>/g, " ")
                    : "",
                title: title,
                score: matched * 10 + sceneryScore * 3,
                provider: "Wikimedia Commons"
            };
        }).filter(Boolean);

        results.sort((a, b) => b.score - a.score);

        return results;

    } catch (error) {
        console.warn("Wikimedia 图片查询失败：", error);
        return [];
    }
}


// ==========================================
// 自动查询景点照片：最多显示5张
// ==========================================
// ==========================================
// 景点照片统一去重：优先使用图片 SHA-1
// ==========================================
function getPhotoUniqueKey(photo) {
    if (photo.sha1) {
        return "sha1:" + photo.sha1.toLowerCase();
    }

    if (photo.pageId) {
        return "page:" + photo.pageId;
    }

    const normalizedTitle = String(photo.title || "")
        .toLowerCase()
        .replace(/^file:/, "")
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");

    if (normalizedTitle) {
        return "title:" + normalizedTitle;
    }

    const normalizedUrl = String(photo.url || "")
        .split("?")[0]
        .replace(/\/\d+px-/g, "/");

    return "url:" + normalizedUrl;
}
// ==========================================
// 图片视觉指纹：识别不同网址下的相同或相似照片
// ==========================================
// 同时计算 dHash 和 aHash
async function getImageDifferenceHash(url) {
    try {
        const image = new Image();
        image.crossOrigin = "anonymous";

        const loaded = await new Promise(resolve => {
            image.onload = () => resolve(true);
            image.onerror = () => resolve(false);
            image.src = url;
        });

        if (!loaded) return null;

        // 获取灰度像素
        function getGrayPixels(width, height) {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const context = canvas.getContext("2d", {
                willReadFrequently: true
            });

            if (!context) return null;

            context.drawImage(image, 0, 0, width, height);

            const pixels = context.getImageData(
                0, 0, width, height
            ).data;

            const gray = [];

            for (let i = 0; i < width * height; i++) {
                const index = i * 4;

                gray.push(
                    0.299 * pixels[index] +
                    0.587 * pixels[index + 1] +
                    0.114 * pixels[index + 2]
                );
            }

            return gray;
        }

        // dHash：比较相邻像素明暗
        const dPixels = getGrayPixels(9, 8);
        if (!dPixels) return null;

        let dHash = "";

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const left = dPixels[y * 9 + x];
                const right = dPixels[y * 9 + x + 1];

                dHash += left > right ? "1" : "0";
            }
        }

        // aHash：比较像素与平均亮度
        const aPixels = getGrayPixels(8, 8);
        if (!aPixels) return null;

        const average =
            aPixels.reduce((sum, value) => sum + value, 0) /
            aPixels.length;

        let aHash = "";

        for (const value of aPixels) {
            aHash += value >= average ? "1" : "0";
        }

        return {
            dHash,
            aHash
        };

    } catch (error) {
        console.warn("图片视觉指纹计算失败，可能受到跨域限制：", url, error);
        return null;
    }
}

// 比较两个视觉指纹的差异位数
function getVisualHashDistance(hashA, hashB) {
    if (!hashA || !hashB || hashA.length !== hashB.length) {
        return Infinity;
    }

    let distance = 0;

    for (let i = 0; i < hashA.length; i++) {
        if (hashA[i] !== hashB[i]) {
            distance++;
        }
    }

    return distance;
}

// 判断两张图片是否高度相似
function isVisualDuplicate(hashA, hashB) {
    if (!hashA || !hashB) return false;

    const dDistance = getVisualHashDistance(
        hashA.dHash,
        hashB.dHash
    );

    const aDistance = getVisualHashDistance(
        hashA.aHash,
        hashB.aHash
    );

    // 两种算法共同判断，尽量减少相似建筑被误判
    return (
        (dDistance <= 4 && aDistance <= 8) ||
        (dDistance <= 7 && aDistance <= 4)
    );
}

// 比较两个视觉指纹的差异位数
function getVisualHashDistance(hashA, hashB) {
    if (!hashA || !hashB || hashA.length !== hashB.length) {
        return Infinity;
    }

    let distance = 0;

    for (let i = 0; i < hashA.length; i++) {
        if (hashA[i] !== hashB[i]) {
            distance++;
        }
    }

    return distance;
}
// ==========================================
// AI 景点照片识别：排除明显无关照片
// ==========================================

let attractionClassifierPromise = null;

async function getAttractionClassifier() {
    if (!attractionClassifierPromise) {
        attractionClassifierPromise = (async () => {
            const { pipeline } = await import(
                "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2"
            );

            return await pipeline(
                "zero-shot-image-classification",
                "Xenova/clip-vit-base-patch32"
            );
        })();
    }

    return attractionClassifierPromise;
}


// 判断照片是否与当前景点相关
async function isAttractionPhotoRelevant(
    imageUrl,
    identityTerms,
    searchQuery
) {
    try {
        const classifier = await getAttractionClassifier();

        const targetName =
            identityTerms.find(word => /[a-z]/i.test(word)) ||
            identityTerms[0] ||
            searchQuery;

        const targetLabels = [
            `A real travel photograph of ${targetName}.`,
            `A real photograph showing the landmark ${targetName}.`
        ];

        const rejectedLabels = [
            "A subway station or metro station.",
            "A subway platform or railway platform.",
            "A train station or railway station.",
            "The inside of a train, subway, or bus.",
            "A bus stop or bus terminal.",
            "An ambulance or emergency vehicle.",
            "A police car or fire truck.",
            "A parked car, van, truck, or bus.",
            "A parking lot or parking garage.",
            "An ordinary shopping mall interior.",
            "An office building corridor or hallway.",
            "An ordinary hospital interior.",
            "A close-up photograph of a sign, plaque, or inscription.",
            "A map, poster, painting, or illustration.",
            "An ordinary indoor room unrelated to a tourist attraction."
        ];

        const labels = [
            ...targetLabels,
            ...rejectedLabels
        ];

        const results = await classifier(imageUrl, labels);

        if (!Array.isArray(results) || results.length === 0) {
            return true;
        }

        const targetScore = Math.max(
            0,
            ...results
                .filter(item => targetLabels.includes(item.label))
                .map(item => item.score)
        );

        const rejectedResults = results.filter(item =>
            rejectedLabels.includes(item.label)
        );

        const strongestRejected = rejectedResults.reduce(
            (best, item) =>
                item.score > best.score ? item : best,
            { label: "无", score: 0 }
        );

        console.log("AI 图片识别结果：", {
            景点: targetName,
            景点匹配分数: targetScore,
            可疑类别: strongestRejected.label,
            可疑类别分数: strongestRejected.score
        });

        // 只有明显属于无关类别时才拦截
        if (
            strongestRejected.score >= 0.22 &&
            strongestRejected.score >= targetScore * 1.25
        ) {
            console.warn(
                "AI 已拦截无关照片：",
                strongestRejected.label
            );

            return false;
        }

        return true;

    } catch (error) {
        console.warn(
            "AI 图片识别失败，交给后续检查：",
            error
        );

        return true;
    }
}

// ==========================================
// 美食照片搜索：Wikimedia + Openverse
// ==========================================

async function searchFoodPhotos(searchQuery, identityTerms = []) {
    const rejectedWords = [
        "menu", "restaurant menu", "price list",
        "advertisement", "poster", "logo",
        "packaging", "wrapper", "cartoon",
        "illustration", "painting", "drawing",
        "screenshot", "collage", "watermark"
    ];

    const searchTerms = identityTerms
        .filter(word => word && String(word).trim())
        .map(word => String(word).trim().toLowerCase());

    const tasks = [
        // Wikimedia Commons
        (async () => {
            try {
                const params = new URLSearchParams({
                    action: "query",
                    generator: "search",
                    gsrsearch: searchQuery,
                    gsrnamespace: "6",
                    gsrlimit: "50",
                    prop: "imageinfo",
                    iiprop: "url|size|mime|sha1|extmetadata",
                    iiurlwidth: "1000",
                    format: "json",
                    origin: "*"
                });

                const response = await fetch(
                    "https://commons.wikimedia.org/w/api.php?" +
                    params.toString()
                );

                if (!response.ok) throw new Error("Wikimedia 请求失败");

                const data = await response.json();
                const pages = Object.values(data.query?.pages || {});

                return pages.map(page => {
                    const info = page.imageinfo?.[0];
                    if (!info || !info.thumburl) return null;

                    const metadata = info.extmetadata || {};
                    const title = page.title || "";
                    const description = String(
                        metadata.ImageDescription?.value || ""
                    ).replace(/<[^>]*>/g, " ");

                    const text = (title + " " + description).toLowerCase();
                    const width = Number(info.width || 0);
                    const height = Number(info.height || 0);

                    if (width < 400 || height < 300) return null;

                    if (rejectedWords.some(word => text.includes(word))) {
                        return null;
                    }

                    const matched = searchTerms.filter(word =>
                        text.includes(word)
                    ).length;

                    return {
                        url: info.thumburl,
                        source: info.descriptionurl || "",
                        creator: String(
                            metadata.Artist?.value || ""
                        ).replace(/<[^>]*>/g, " "),
                        license: metadata.LicenseShortName?.value || "未提供",
                        title,
                        score: matched,
                        provider: "Wikimedia Commons"
                    };
                }).filter(Boolean);

            } catch (error) {
                console.warn("Wikimedia 美食照片搜索失败：", error);
                return [];
            }
        })(),

        // Openverse
        (async () => {
            try {
                const params = new URLSearchParams({
                    q: searchQuery,
                    page_size: "20"
                });

                const response = await fetch(
                    "https://api.openverse.org/v1/images/?" +
                    params.toString()
                );

                if (!response.ok) throw new Error("Openverse 请求失败");

                const data = await response.json();

                return (data.results || []).map(item => {
                    const title = item.title || "";
                    const tags = (item.tags || [])
                        .map(tag => tag.name || "")
                        .join(" ");

                    const text = (title + " " + tags).toLowerCase();
                    const width = Number(item.width || 0);
                    const height = Number(item.height || 0);

                    if (!item.thumbnail && !item.url) return null;
                    if (width < 400 || height < 300) return null;

                    if (rejectedWords.some(word => text.includes(word))) {
                        return null;
                    }

                    const matched = searchTerms.filter(word =>
                        text.includes(word)
                    ).length;

                    return {
                        url: item.thumbnail || item.url,
                        source: item.foreign_landing_url || "",
                        creator: item.creator || "",
                        license: item.license
                            ? item.license.toUpperCase()
                            : "未提供",
                        title,
                        score: matched,
                        provider: "Openverse"
                    };
                }).filter(Boolean);

            } catch (error) {
                console.warn("Openverse 美食照片搜索失败：", error);
                return [];
            }
        })()
    ];

    const [wikimediaResults, openverseResults] =
        await Promise.all(tasks);

    const seen = new Set();

    return [...wikimediaResults, ...openverseResults]
        .filter(photo => {
            if (!photo.url || !/^https:\/\//i.test(photo.url)) {
                return false;
            }

            if (seen.has(photo.url)) return false;

            seen.add(photo.url);
            return true;
        })
        .sort((a, b) => b.score - a.score);
}


// ==========================================
// AI 美食照片识别
// ==========================================

async function isFoodPhotoRelevant(imageUrl, foodName) {
    try {
        // 复用已经存在的景点 AI 模型
        const classifier = await getAttractionClassifier();

        const foodLabels = [
            `A real food photograph of ${foodName}.`,
            `A close-up photograph of the prepared dish ${foodName}.`,
            "A real photograph of cooked food served on a plate."
        ];

        const rejectedLabels = [
            "A restaurant menu with text and prices.",
            "A food advertisement or promotional poster.",
            "A food package or product wrapper.",
            "A cartoon or illustration of food.",
            "A painting or drawing of food.",
            "A restaurant logo or signboard.",
            "A screenshot containing text.",
            "A tourist attraction or landscape without food.",
            "An empty restaurant interior."
        ];

        const results = await classifier(
            imageUrl,
            [...foodLabels, ...rejectedLabels]
        );

        if (!Array.isArray(results) || results.length === 0) {
            return true;
        }

        const foodScore = Math.max(
            0,
            ...results
                .filter(item => foodLabels.includes(item.label))
                .map(item => item.score)
        );

        const rejectedScore = Math.max(
            0,
            ...results
                .filter(item => rejectedLabels.includes(item.label))
                .map(item => item.score)
        );

        console.log("AI 美食照片识别：", {
            美食: foodName,
            食物匹配分数: foodScore,
            无关类别分数: rejectedScore
        });

        // 只有明显属于非食物图片时才拦截
        if (
            rejectedScore >= 0.30 &&
            rejectedScore >= foodScore * 1.15
        ) {
            console.warn("AI 已拦截非美食照片：", foodName);
            return false;
        }

        return true;

    } catch (error) {
        console.warn(
            "AI 美食照片识别失败，交给后续检查：",
            error
        );

        // AI 暂时无法识别时，不直接误删照片
        return true;
    }
}


// ==========================================
// 自动加载美食照片
// 每道美食展示一张照片
// ==========================================


// ==========================================
// 美食照片加载：多关键词搜索、加载检测、AI相关性筛选
// 每道推荐菜显示一张照片
// ==========================================
async function loadFoodPhotos(root) {
    if (!root) return;

    const galleries = Array.from(
        root.querySelectorAll("[data-food-gallery]")
    );

    for (const gallery of galleries) {
        const searchQuery = (
            gallery.dataset.foodQuery || ""
        ).trim();

        const identityTerms = (
            gallery.dataset.foodIdentity || ""
        ).split("|").map(word => word.trim()).filter(Boolean);

        if (!searchQuery || identityTerms.length === 0) continue;

        const placeholder = gallery.querySelector(
            "[data-food-placeholder]"
        );

        const foodName =
            identityTerms.find(word => /^[a-z0-9\s'-]+$/i.test(word)) ||
            identityTerms[0];

        // 升级缓存版本，避免继续使用旧的无照片结果
        const cacheKey =
            "travelFoodPhotos:v5:" +
            searchQuery + ":" + identityTerms.join("|");

        const uniqueTerms = [...new Set(identityTerms)];

        
        // 中文、韩文、英文菜名全部参与搜索
        const localFoodNames = uniqueTerms.filter(word =>
            /[\u4e00-\u9fff\uac00-\ud7af]/.test(word)
        );

        const englishNames = uniqueTerms.filter(word =>
            /^[a-z0-9\s'-]+$/i.test(word)
        );

        // 每种语言分别搜索，增加冷门菜品的命中机会
        const queryCandidates = [...new Set([
            searchQuery,

            ...localFoodNames,
            ...localFoodNames.map(name => name + " 美食"),
            ...localFoodNames.map(name => name + " food"),

            ...englishNames,
            ...englishNames.map(name => name + " food"),
            ...englishNames.map(name => name + " traditional dish")
        ].filter(Boolean))];


        let photos = [];

        // 读取新版本缓存
        try {
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) photos = parsed;
            }
        } catch (error) {
            console.warn("美食照片缓存读取失败：", error);
        }

        // 没有缓存时执行多关键词搜索
        if (photos.length === 0) {
            const results = await Promise.all(
                queryCandidates.map(query =>
                    searchFoodPhotos(query, uniqueTerms)
                )
            );

            const seen = new Set();

            photos = results.flat().filter(photo => {
                if (!photo || !photo.url || seen.has(photo.url)) {
                    return false;
                }

                seen.add(photo.url);
                return true;
            });

            // 优先检查匹配度高的照片
            photos.sort((a, b) => (b.score || 0) - (a.score || 0));
        }

        let selectedPhoto = null;

        // 每道菜最多审核40张候选照片
for (const photo of photos.slice(0, 40)) {
            if (!photo.url) continue;

            // 先确认图片链接能否正常加载
            const loaded = await new Promise(resolve => {
                const image = new Image();
                const timeout = setTimeout(() => resolve(false), 12000);

                image.onload = () => {
                    clearTimeout(timeout);
                    resolve(true);
                };

                image.onerror = () => {
                    clearTimeout(timeout);
                    resolve(false);
                };

                image.src = photo.url;
            });

            if (!loaded) continue;

            // 再检查是否确实是食物照片
            const relevant = await isFoodPhotoRelevant(
                photo.url,
                foodName
            );

            if (!relevant) continue;

            selectedPhoto = photo;
            break;
        }

        if (!selectedPhoto) {
            if (placeholder) {
                placeholder.textContent =
                    "暂未找到可正常加载且符合要求的菜品照片";
            }
            continue;
        }

        // 只缓存成功加载并通过筛选的照片
        try {
            sessionStorage.setItem(
                cacheKey,
                JSON.stringify([selectedPhoto])
            );
        } catch (error) {
            console.warn("美食照片缓存保存失败：", error);
        }

        const sourceHTML = selectedPhoto.source
            ? `<a
                href="${escapeHTML(selectedPhoto.source)}"
                target="_blank"
                rel="noopener noreferrer"
                style="color:#2878c8;text-decoration:none;"
            >查看原始图片来源</a>`
            : "来源链接未提供";

        gallery.innerHTML = `
            <img
                src="${escapeHTML(selectedPhoto.url)}"
                alt="${escapeHTML(foodName)}"
                loading="lazy"
                style="
                    width:100%;
                    max-width:420px;
                    height:230px;
                    object-fit:cover;
                    border-radius:12px;
                    display:block;
                "
                onerror="this.style.display='none';this.nextElementSibling.textContent='照片加载失败，请重新生成攻略';"
            >

            <div style="
                font-size:12px;
                color:#777;
                line-height:1.7;
                margin-top:6px;
            ">
                <div>图片来源：${escapeHTML(selectedPhoto.provider || "未提供")}</div>
                <div>作者：${escapeHTML(selectedPhoto.creator || "未提供")}</div>
                <div>授权：${escapeHTML(selectedPhoto.license || "未提供")}</div>
                <div>${sourceHTML}</div>
            </div>
        `;
    }
}

async function loadAttractionPhotos(root) {
    if (!root) return;

    const galleries = Array.from(
        root.querySelectorAll("[data-attraction-gallery]")
    );

    const rejectedWords = [
    // 历史照片、黑白照片
    "historical photo", "historic photograph",
    "old photo", "vintage photo", "archival",
    "black and white", "black-and-white",
    "antique photograph", "old postcard",

    // 碑文、说明牌、文字资料
    "inscription", "inscribed stone",
    "information board", "signboard",
    "notice board", "plaque", "text panel",
    "engraving", "rubbing", "calligraphy",

    // 绘画、地图、扫描件
    "painting", "illustration", "drawing",
    "poster", "map", "diagram", "logo",
    "book cover", "document scan", "manuscript",

    // 地铁、火车、公交设施
    "subway station", "metro station",
    "underground station", "railway station",
    "train station", "railway platform",
    "subway platform", "metro platform",
    "train interior", "subway interior",
    "bus interior", "bus stop",
    "railway carriage", "train carriage",

    // 救援车辆及普通车辆
    "ambulance", "police car", "fire truck",
    "fire engine", "emergency vehicle",
    "rescue vehicle", "delivery truck",
    "commercial van", "minivan",
    "parking lot", "parking garage",
    "vehicle interior",

    // 普通室内设施
    "shopping mall interior",
    "shopping center interior",
    "office interior", "hospital interior",
    "corridor interior", "indoor hallway",
    "underground passage", "parking building",

    // 中文
    "碑文", "石碑", "说明牌", "介绍牌",
    "标识牌", "拓片", "拓印", "碑刻",
    "古画", "绘画", "插画", "海报",
    "地图", "文献", "扫描件",
    "地铁站", "地铁站台", "地铁车厢",
    "火车站", "铁路站台", "火车车厢",
    "公交车站", "公交车内部",
    "救护车", "警车", "消防车",
    "货车", "商务车", "停车场",
    "商场内部", "办公楼内部", "医院内部",
    "地下通道", "室内走廊",

    // 日文
    "案内板", "説明板", "絵画",
    "イラスト", "ポスター", "地図",
    "地下鉄駅", "駅ホーム", "電車車内",
    "救急車", "パトカー", "消防車",
    "駐車場", "ショッピングモール内部",

    // 韩文
    "안내판", "설명판", "비문",
    "탁본", "삽화", "포스터", "지도",
    "지하철역", "승강장", "열차 내부",
    "구급차", "경찰차", "소방차",
    "주차장", "쇼핑몰 내부", "병원 내부"
];
// 景点实景照片关键词，用于判断图片是否具有景观特征
const sceneryWords = [
    // 英文
    "landscape", "scenery", "scenic",
    "tourist attraction", "tourism",
    "temple", "palace", "shrine",
    "park", "garden", "museum",
    "beach", "coast", "island",
    "mountain", "lake", "river",
    "waterfall", "forest", "valley",
    "bridge", "tower", "castle",
    "village", "historic site",
    "architecture", "cityscape",
    "nature", "viewpoint", "panorama",

    // 中文
    "风景", "景观", "景区", "景点",
    "寺庙", "宫殿", "公园", "庭园",
    "博物馆", "海滩", "海岸", "岛屿",
    "山脉", "湖泊", "河流", "瀑布",
    "森林", "峡谷", "桥梁", "古城",
    "建筑", "观景台", "自然风光",

    // 韩文
    "풍경", "경관", "관광지",
    "사찰", "궁전", "공원", "정원",
    "박물관", "해변", "해안", "섬",
    "산", "호수", "강", "폭포",
    "숲", "계곡", "다리", "전망대",

    // 日文
    "風景", "景観", "観光地",
    "寺院", "宮殿", "公園", "庭園",
    "博物館", "海岸", "島",
    "山", "湖", "川", "滝",
    "森林", "渓谷", "橋", "展望台"
];
    // 记录本次攻略已经使用过的照片，避免不同景点重复
const usedPhotoKeys = new Set();
// 记录整份攻略已经使用过的图片视觉指纹
const usedPhotoHashes = [];
    for (const gallery of galleries) {
        const placeholder = gallery.parentElement.querySelector(
            "[data-photo-placeholder]"
        );

        const searchQuery = (
            gallery.dataset.photoQuery || ""
        ).trim();

        const identityTerms = (
            gallery.dataset.photoIdentity || ""
        ).split("|")
            .map(word => word.trim())
            .filter(word => word.length >= 2);

        if (!searchQuery) continue;

        const cacheKey = "travelRealPhotos:v16:" +
            searchQuery + ":" + identityTerms.join("|");

        if (placeholder) {
            placeholder.hidden = false;
            placeholder.textContent = "正在查询景点实景照片……";
        }

        gallery.innerHTML = "";

        let photos = [];

        try {
            const cached = sessionStorage.getItem(cacheKey);

            if (cached) {
                photos = JSON.parse(cached);
            }
        } catch (error) {
            console.warn("照片缓存读取失败：", error);
        }

        if (!Array.isArray(photos) || photos.length === 0) {
            // ==========================================
// 多关键词搜索 Wikimedia Commons
// ==========================================

// 清理通用搜索词
const cleanSearchQuery = searchQuery
    .replace(/\s+(landscape|scenery|view|photo|photos|image|images)\b/gi, "")
    .trim();

// 准备不同语言的搜索词
const searchQueries = [
    cleanSearchQuery,
    ...identityTerms
]
    .map(word => String(word || "").trim())
    .filter(Boolean);

// 去重，最多尝试3组关键词
const uniqueQueries = [...new Set(searchQueries)].slice(0, 4);
let allPhotos = [];

for (const query of uniqueQueries) {

    const [wikimediaResults, openverseResults] =
        await Promise.all([
            searchWikimediaPhotos(
                query,
                rejectedWords,
                sceneryWords,
                identityTerms
            ).catch(error => {
                console.warn("Wikimedia 搜索失败：", error);
                return [];
            }),

            searchOpenversePhotos(
                query,
                rejectedWords,
                sceneryWords,
                identityTerms
            ).catch(error => {
                console.warn("Openverse 搜索失败：", error);
                return [];
            })
        ]);

    allPhotos.push(
        ...wikimediaResults,
        ...openverseResults
    );

    console.log("图片来源搜索结果：", {
        景点: searchQuery,
        搜索关键词: query,
        Wikimedia: wikimediaResults.length,
        Openverse: openverseResults.length
    });

    if (allPhotos.length >= 30) {
        break;
    }
}

console.log(
    "Wikimedia 多关键词查询结果：",
    searchQuery,
    uniqueQueries,
    allPhotos.length
);

            const seen = new Set();

            photos = allPhotos
                .filter(photo => {
                    if (!photo.url) return false;
                    if (!/^https:\/\//i.test(photo.url)) return false;

                    if (seen.has(photo.url)) return false;

                    seen.add(photo.url);
                    return true;
                })
                .sort((a, b) => b.score - a.score);
        }

        // 实际测试图片是否能够加载
        const validPhotos = [];

        for (const photo of photos) {
            if (validPhotos.length >= 5) break;
            // 图片网址和标题共同作为去重依据
const photoKey = getPhotoUniqueKey(photo);

if (usedPhotoKeys.has(photoKey)) {
    continue;
}

            const loaded = await new Promise(resolve => {
                const testImage = new Image();

                testImage.onload = () => resolve(true);
                testImage.onerror = () => resolve(false);

                testImage.src = photo.url;
            });

            if (loaded) {

// ==========================================
// AI 景点相关性识别
// ==========================================

const imageRelevant = await isAttractionPhotoRelevant(
    photo.url,
    identityTerms,
    searchQuery
);

if (!imageRelevant) {
    console.log(
        "跳过与景点无关的照片：",
        photo.title
    );

    continue;
}
    // 计算当前图片的双重视觉指纹
const visualHash = await getImageDifferenceHash(photo.url);

// 检查是否与之前景点的照片高度相似
const visualDuplicate = visualHash &&
    usedPhotoHashes.some(oldHash => {
        return isVisualDuplicate(visualHash, oldHash);
    });

// 视觉相似度过高，跳过当前图片
if (visualDuplicate) {
    console.log(
        "跳过视觉重复照片：",
        photo.title
    );

    continue;
}

validPhotos.push(photo);

// 保留原来的文件去重记录
usedPhotoKeys.add(photoKey);

// 保存双重视觉指纹
if (visualHash) {
    usedPhotoHashes.push(visualHash);
}
}
        }

        if (validPhotos.length === 0) {
            if (placeholder) {
                placeholder.hidden = false;
                placeholder.textContent =
                    "暂未找到符合要求的景区实景照片";
            }

            continue;
        }

        try {
            sessionStorage.setItem(
                cacheKey,
                JSON.stringify(validPhotos)
            );
        } catch (error) {
            console.warn("照片缓存保存失败：", error);
        }

        gallery.innerHTML = validPhotos.map((photo, index) => {
            const imageHTML = `
                <img
                    src="${escapeHTML(photo.url)}"
                    alt="${escapeHTML(identityTerms[0] || searchQuery)}"
                    loading="lazy"
                    style="
                        width:100%;
                        height:190px;
                        object-fit:cover;
                        display:block;
                        border-radius:10px;
                    "
                >
            `;

            const sourceHTML = photo.source
                ? `
                    <a
                        href="${escapeHTML(photo.source)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        style="color:#2878c8;text-decoration:none;"
                    >
                        查看原始图片来源
                    </a>
                `
                : "来源链接未提供";

            return `
                <div
                    style="
                        flex:0 0 260px;
                        min-width:260px;
                        scroll-snap-align:start;
                        border-radius:10px;
                        overflow:hidden;
                        background:#f5f5f5;
                    "
                >
                    ${imageHTML}

                    <div style="
                        padding:8px;
                        font-size:12px;
                        color:#666;
                        line-height:1.6;
                    ">
                        <div>
                            图片 ${index + 1} · ${escapeHTML(photo.provider)}
                        </div>

                        <div>
                            作者：${escapeHTML(photo.creator || "未提供")}
                        </div>

                        <div>
                            授权：${escapeHTML(photo.license || "未提供")}
                        </div>

                        <div>${sourceHTML}</div>
                    </div>
                </div>
            `;
        }).join("");

        if (placeholder) {
            placeholder.hidden = true;
        }
    }
}

// -------------------------
// 景点到达路线（目前已录入上海专属说明）
// 其他地区自动提供地图查询链接，不伪造具体地铁线路。
// -------------------------
const attractionRoutes = {
    "上海": {
        "外滩": {
            zh: "推荐路线：可乘地铁2号线或10号线至南京东路站，再步行前往外滩；具体步行时间取决于入口。",
            ko: "추천 경로: 지하철 2호선 또는 10호선을 타고 난징둥루역에서 내린 뒤 외탄까지 걸어가세요. 도보 시간은 입구에 따라 달라집니다.",
            en: "Suggested route: Take Metro Line 2 or 10 to East Nanjing Road Station, then walk to the Bund. Walking time depends on the entrance."
        },
        "豫园": {
            zh: "推荐路线：乘地铁10号线或14号线至豫园站，再按站内指示步行前往景区。",
            ko: "추천 경로: 지하철 10호선 또는 14호선을 타고 위위안역에서 내린 뒤 안내 표지에 따라 걸어가세요.",
            en: "Suggested route: Take Metro Line 10 or 14 to Yuyuan Garden Station, then follow the signs to the attraction."
        },
        "上海博物馆": {
            zh: "人民广场馆可乘地铁1、2、8号线至人民广场站；也可乘14号线至大世界站。请根据具体馆址和出口确认步行路线。",
            ko: "인민광장관은 지하철 1·2·8호선 인민광장역 또는 14호선 다스제역을 이용할 수 있습니다. 방문할 관과 출구에 따라 도보 경로를 확인하세요.",
            en: "For the People's Square museum, use People's Square Station on Lines 1, 2, or 8, or Dashijie Station on Line 14. Confirm the exact museum location and exit."
        },
        "武康路": {
            zh: "推荐路线：可乘地铁10号线或11号线至交通大学站，再根据武康路上的具体目的地步行前往。",
            ko: "추천 경로: 지하철 10호선 또는 11호선 자오퉁대학교역에서 내려 우캉루의 목적지까지 걸어가세요.",
            en: "Suggested route: Take Metro Line 10 or 11 to Jiaotong University Station, then walk to your specific destination on Wukang Road."
        },
        "陆家嘴滨江": {
            zh: "推荐路线：乘地铁2号线至陆家嘴站，再步行前往滨江步道；请根据具体观景位置确认出口。",
            ko: "추천 경로: 지하철 2호선을 타고 루자쭈이역에서 내린 뒤 강변 산책로까지 걸어가세요. 목적지에 따라 출구를 확인하세요.",
            en: "Suggested route: Take Metro Line 2 to Lujiazui Station, then walk to the riverside promenade. Check the best exit for your destination."
        },
        "南京路步行街": {
            zh: "推荐路线：可乘地铁2号线或10号线至南京东路站；西侧路段可根据目的地选择人民广场站。",
            ko: "추천 경로: 지하철 2호선 또는 10호선 난징둥루역을 이용하세요. 서쪽 구간은 목적지에 따라 인민광장역을 이용할 수 있습니다.",
            en: "Suggested route: Take Metro Line 2 or 10 to East Nanjing Road Station. For the western section, consider People's Square Station."
        }
    }
};

function getAttractionRoute(city, attractionName) {
    const nameZh = typeof attractionName === "string" ? attractionName : attractionName?.zh || getText(attractionName);
    const knownRoute = attractionRoutes[city]?.[nameZh];
    let routeText;

    if (knownRoute) {
        routeText = knownRoute[currentLanguage] || knownRoute.zh;
    } else {
        const fallback = {
            zh: "专属到达路线尚未录入，建议打开地图确认地铁、公交、出口及步行路线。",
            ko: "상세 도착 경로는 아직 등록되지 않았습니다. 지도를 열어 지하철, 버스, 출구 및 도보 경로를 확인하세요.",
            en: "A custom access route has not been added yet. Open a map to check metro, bus, station exits, and walking directions."
        };
        routeText = fallback[currentLanguage] || fallback.zh;
    }

    const query = getCityKeyForMap(city, attractionName);
    const mapUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
    const linkLabels = {
        zh: "🗺️ 打开地图查看景点位置",
        ko: "🗺️ 지도를 열어 관광지 위치 보기",
        en: "🗺️ Open map to view attraction location"
    };

    return `${escapeHTML(routeText)}<br><a href="${mapUrl}" target="_blank" rel="noopener noreferrer">${linkLabels[currentLanguage] || linkLabels.zh}</a>`;
}

// -------------------------
// 景点之间的路线（上海有手动路线；其余地区提供通用地图路线查询）
// -------------------------
const transferRoutes = {
    "上海": {
        "外滩->豫园": {
            zh: "外滩 → 豫园：可步行前往，预计15–25分钟；也可前往南京东路站乘地铁10号线至豫园站，再步行前往。具体时间取决于出发位置。",
            ko: "외탄 → 위위안: 도보로 약 15–25분 이동할 수 있습니다. 또는 난징둥루역에서 지하철 10호선을 타고 위위안역에서 내린 뒤 걸어가세요. 실제 시간은 출발 위치에 따라 달라집니다.",
            en: "The Bund → Yu Garden: Walk for approximately 15–25 minutes, or take Metro Line 10 from East Nanjing Road Station to Yuyuan Garden Station and walk from there. Actual time depends on your starting point."
        },
        "豫园->上海博物馆": {
            zh: "豫园 → 上海博物馆人民广场馆：可乘地铁14号线至大世界站，再步行前往；请确认具体馆址和出口。",
            ko: "위위안 → 상하이박물관 인민광장관: 지하철 14호선을 타고 다스제역에서 내린 뒤 걸어가세요. 박물관 주소와 출구를 확인하세요.",
            en: "Yu Garden → Shanghai Museum at People's Square: Take Metro Line 14 to Dashijie Station, then walk to the museum. Confirm the exact address and exit."
        },
        "上海博物馆->武康路": {
            zh: "上海博物馆人民广场馆 → 武康路：可从人民广场站乘地铁1号线至衡山路站，再步行前往武康路附近；具体时间取决于目的地。",
            ko: "상하이박물관 인민광장관 → 우캉루: 인민광장역에서 지하철 1호선을 타고 헝산루역에서 내린 뒤 우캉루 인근까지 걸어가세요. 목적지에 따라 시간이 달라집니다.",
            en: "Shanghai Museum at People's Square → Wukang Road: Take Metro Line 1 from People's Square to Hengshan Road Station, then walk toward Wukang Road. Actual time depends on your destination."
        },
        "武康路->陆家嘴滨江": {
            zh: "武康路 → 陆家嘴滨江：先步行至交通大学站，乘地铁10号线至南京东路站，换乘地铁2号线至陆家嘴站，再步行前往滨江步道。时间取决于出发位置和换乘情况。",
            ko: "우캉루 → 루자쭈이 빈장: 자오퉁대학교역까지 걸어간 뒤 지하철 10호선을 타고 난징둥루역에서 내리세요. 2호선으로 환승해 루자쭈이역까지 이동한 다음 강변 산책로까지 걸어가세요.",
            en: "Wukang Road → Lujiazui Riverside: Walk to Jiaotong University Station, take Metro Line 10 to East Nanjing Road, transfer to Line 2 to Lujiazui Station, then walk to the riverside promenade."
        },
        "陆家嘴滨江->南京路步行街": {
            zh: "陆家嘴滨江 → 南京路步行街：步行至陆家嘴站，乘地铁2号线至南京东路站，再步行进入步行街。时间取决于滨江的具体出发位置。",
            ko: "루자쭈이 빈장 → 난징루 보행자 거리: 루자쭈이역까지 걸어간 뒤 지하철 2호선을 타고 난징둥루역에서 내려 보행자 거리로 이동하세요.",
            en: "Lujiazui Riverside → Nanjing Road Pedestrian Street: Walk to Lujiazui Station, take Metro Line 2 to East Nanjing Road Station, then walk to the pedestrian street."
        },
        "南京路步行街->外滩": {
            zh: "南京路步行街 → 外滩：沿步行街向东走至黄浦江边即可，通常预留约10–20分钟；一般无需乘地铁。",
            ko: "난징루 보행자 거리 → 외탄: 보행자 거리를 따라 동쪽으로 걸어 황푸강변까지 이동하세요. 위치에 따라 약 10–20분 정도 걸리며 일반적으로 지하철은 필요하지 않습니다.",
            en: "Nanjing Road Pedestrian Street → The Bund: Walk east along the pedestrian street toward the Huangpu River. Allow about 10–20 minutes depending on your location. The metro is usually unnecessary."
        }
    }
};

function getTransferRoute(city, fromName, toName) {
    const fromZh = typeof fromName === "string" ? fromName : fromName?.zh || getText(fromName);
    const toZh = typeof toName === "string" ? toName : toName?.zh || getText(toName);
    const routeKey = `${fromZh}->${toZh}`;
    const knownRoute = transferRoutes[city]?.[routeKey];

    const fallback = {
        zh: "这组景点之间尚未录入专属路线。可打开地图查询当前可用的地铁、公交、步行及换乘方案。",
        ko: "이 관광지 조합의 상세 경로는 아직 등록되지 않았습니다. 지도를 열어 이용 가능한 지하철, 버스, 도보 및 환승 경로를 확인하세요.",
        en: "A custom route for this attraction pair has not been added yet. Open a map to check available metro, bus, walking, and transfer options."
    };

    const routeText = knownRoute
        ? (knownRoute[currentLanguage] || knownRoute.zh)
        : (fallback[currentLanguage] || fallback.zh);

    const fromLabel = typeof fromName === "string" ? fromName : fromName?.[currentLanguage] || fromZh;
    const toLabel = typeof toName === "string" ? toName : toName?.[currentLanguage] || toZh;
    const origin = `${city} ${fromLabel}`;
    const destination = `${city} ${toLabel}`;
    const mapUrl = "https://www.google.com/maps/dir/?api=1"
        + `&origin=${encodeURIComponent(origin)}`
        + `&destination=${encodeURIComponent(destination)}`
        + "&travelmode=transit";

    const labels = {
        zh: "🗺️ 打开地图查询地铁、公交和换乘路线",
        ko: "🗺️ 지도를 열어 지하철·버스·환승 경로 확인",
        en: "🗺️ Open map for public transit directions"
    };

    // 韩国地区额外提供 Naver 地图搜索入口；它是地图搜索链接，并非保证自动生成路线。
    const koreanCities = new Set(["首尔", "釜山", "大邱", "仁川", "庆州", "全州", "水原", "江陵", "济州岛"]);
    let naverLink = "";
    if (koreanCities.has(city)) {
        const naverUrl = "https://map.naver.com/p/search/" + encodeURIComponent(`${city} ${fromLabel} ${toLabel}`);
        const naverLabel = currentLanguage === "ko" ? "네이버 지도에서 검색" : currentLanguage === "en" ? "Search on Naver Map" : "在 Naver 地图中搜索";
        naverLink = `　<a href="${naverUrl}" target="_blank" rel="noopener noreferrer">${naverLabel}</a>`;
    }

    return `${escapeHTML(routeText)}<br><a href="${mapUrl}" target="_blank" rel="noopener noreferrer">${labels[currentLanguage] || labels.zh}</a>${naverLink}`;
}

// -------------------------
// 时间线与预算文本
// -------------------------
const nightActivity = {
    zh: { title: "夜间活动", description: "可以根据个人兴趣自由安排。", extraFood: "还可以尝试：" },
    ko: { title: "야간 활동", description: "취향에 따라 자유롭게 계획하세요.", extraFood: "이것도 추천: " },
    en: { title: "Evening Activities", description: "Plan your evening according to your interests.", extraFood: "You could also try: " }
};

const timelineText = {
    zh: {
        transport: "景点间交通路线", meal: "午餐 / 当地美食", free: "休息 / 自由活动",
        dinner: "晚餐 / 休息", duration: "预计游玩时间", noFood: "暂无美食数据",
        titleDay: day => `第${day}天`, transportBudget: "交通与预算", transportTips: "交通建议", budget: "预算参考",
        total: "总预算", perDay: "人均每天约", accommodation: "住宿", foodBudget: "餐饮",
        localTransport: "市内交通", tickets: "景点门票", reserve: "机动预留",
        note: "以上为预算规划参考，实际花费会受住宿、旺季和汇率影响，请按需调整。",
        enterBudget: "输入总预算后可查看分类预算参考。", currency: "元",
        noPreference: "不限", people: "人", days: "天", selected: "已选择："
    },
    ko: {
        transport: "관광지 간 이동 경로", meal: "점심 / 현지 음식", free: "휴식 / 자유 시간",
        dinner: "저녁 식사 / 휴식", duration: "예상 관람 시간", noFood: "등록된 음식 정보가 없습니다",
        titleDay: day => `DAY ${day}`, transportBudget: "교통 및 예산", transportTips: "교통 안내", budget: "예산 참고",
        total: "총예산", perDay: "1인 하루 약", accommodation: "숙박", foodBudget: "식사",
        localTransport: "시내 교통", tickets: "입장권", reserve: "예비비",
        note: "예산은 참고용이며 숙박비, 성수기 및 환율에 따라 달라질 수 있습니다.",
        enterBudget: "총예산을 입력하면 항목별 예산을 확인할 수 있습니다.", currency: "위안",
        noPreference: "제한 없음", people: "명", days: "일", selected: "선택 완료: "
    },
    en: {
        transport: "Travel Between Attractions", meal: "Lunch / Local Food", free: "Rest / Free Time",
        dinner: "Dinner / Rest", duration: "Estimated Visit Duration", noFood: "No food data available",
        titleDay: day => `DAY ${day}`, transportBudget: "Transportation & Budget", transportTips: "Transportation Tips", budget: "Budget Breakdown",
        total: "Total Budget", perDay: "Approx. per person per day", accommodation: "Accommodation", foodBudget: "Food",
        localTransport: "Local Transport", tickets: "Attraction Tickets", reserve: "Contingency",
        note: "This is an estimate. Actual costs vary by accommodation, season, and exchange rates.",
        enterBudget: "Enter a total budget to view the estimated breakdown.", currency: "CNY",
        noPreference: "No preference", people: "people", days: "days", selected: "Selected: "
    }
};

// -------------------------
// 选择旅行天数
// -------------------------
function selectDays(button, days) {
    selectedDays = Number(days);
    if (customSelectedAttractionKeys.length > selectedDays * 3) {
        customSelectedAttractionKeys = customSelectedAttractionKeys.slice(0, selectedDays * 3);
    }
    document.querySelectorAll(".days button").forEach(item => item.classList.remove("selected"));
    if (button) button.classList.add("selected");
    const output = document.getElementById("selectedDays");
    if (routeMode === "custom") renderCustomAttractionPicker();
    if (output) {
        if (currentLanguage === "en") output.innerText = `Selected: ${selectedDays} days`;
        else if (currentLanguage === "ko") output.innerText = `선택 완료: ${selectedDays}일`;
        else output.innerText = `已选择：${selectedDays}天`;
    }
}

// -------------------------
// 选择同行人数
// -------------------------
function selectPeople(button, people) {
    selectedPeople = Number(people);
    document.querySelectorAll(".people button").forEach(item => item.classList.remove("selected"));
    if (button) button.classList.add("selected");
    const output = document.getElementById("selectedPeople");
    if (output) {
        if (currentLanguage === "en") output.innerText = `Selected: ${selectedPeople} people`;
        else if (currentLanguage === "ko") output.innerText = `선택 완료: ${selectedPeople}명`;
        else output.innerText = `已选择：${selectedPeople}人`;
    }
}

// -------------------------
// 选择旅行偏好
// -------------------------
function togglePreference(button, preference) {
    if (button) button.classList.toggle("selected");
    if (selectedPreferences.includes(preference)) {
        selectedPreferences = selectedPreferences.filter(item => item !== preference);
    } else {
        selectedPreferences.push(preference);
    }
}

// -------------------------
// 自动 / 自定义路线模式
// -------------------------
function getAttractionKey(attraction) {
    const name = attraction && attraction.name;
    if (name && typeof name === "object") {
        return String(name.zh || name.ko || name.en || "").trim();
    }
    return String(name || "").trim();
}

function setRouteMode(mode) {
    routeMode = mode === "custom" ? "custom" : "automatic";
    const automaticButton = document.getElementById("automaticModeButton");
    const customButton = document.getElementById("customModeButton");
    const picker = document.getElementById("customAttractionPicker");
    if (automaticButton) automaticButton.classList.toggle("selected", routeMode === "automatic");
    if (customButton) customButton.classList.toggle("selected", routeMode === "custom");
    if (picker) picker.hidden = routeMode !== "custom";
    if (routeMode === "custom") renderCustomAttractionPicker();
    updateRouteModeLabels();
}

function updateRouteModeLabels() {
    const labels = {
        zh: {
            title: "路线模式", automatic: "自动路线", custom: "Custom 自定义",
            hint: "自动模式会根据偏好安排景点；自定义模式可自行选择想去的地点。",
            pickerTitle: "选择想去的景点", pickerHint: "勾选景点，系统会按选择顺序安排路线。",
            count: n => `已选择 ${n} 个`, empty: "请先输入一个已支持的目的地。", noData: "该城市暂无可选景点数据。",
            max: n => `最多可选择 ${n} 个景点（每天最多安排 3 个）。`,
            maxReached: "已达到当前行程可安排的景点上限。"
        },
        ko: {
            title: "여행 경로 모드", automatic: "자동 경로", custom: "Custom 직접 선택",
            hint: "자동 모드는 취향에 따라 관광지를 선택하고, 사용자 지정 모드에서는 방문할 장소를 직접 고를 수 있습니다.",
            pickerTitle: "방문할 장소 선택", pickerHint: "장소를 선택하면 선택한 순서대로 일정을 구성합니다.",
            count: n => `${n}곳 선택됨`, empty: "먼저 지원되는 여행지를 입력하세요.", noData: "이 도시에는 선택할 관광지 데이터가 없습니다.",
            max: n => `최대 ${n}곳까지 선택할 수 있습니다(하루 최대 3곳).`,
            maxReached: "현재 여행 일정에 배정할 수 있는 관광지 수에 도달했습니다."
        },
        en: {
            title: "Route mode", automatic: "Automatic", custom: "Custom",
            hint: "Automatic mode selects attractions based on your preferences. Custom mode lets you choose the places you want to visit.",
            pickerTitle: "Choose places to visit", pickerHint: "Select attractions; your selection order will be used to build the itinerary.",
            count: n => `${n} selected`, empty: "Enter a supported destination first.", noData: "No attraction data is available for this city.",
            max: n => `Select up to ${n} places (up to 3 attractions per day).`,
            maxReached: "You have reached the attraction limit for this trip."
        }
    };
    const t = labels[currentLanguage] || labels.zh;
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    set("routeModeTitle", t.title);
    set("automaticModeButton", t.automatic);
    set("customModeButton", t.custom);
    set("routeModeHint", t.hint);
    set("customPickerTitle", t.pickerTitle);
    set("customPickerHint", t.pickerHint);
    updateCustomSelectedCount();
}

function updateCustomSelectedCount() {
    const output = document.getElementById("customSelectedCount");
    if (!output) return;
    const labels = {
        zh: n => `已选择 ${n} 个`,
        ko: n => `${n}곳 선택됨`,
        en: n => `${n} selected`
    };
    output.textContent = (labels[currentLanguage] || labels.zh)(customSelectedAttractionKeys.length);
}

function renderCustomAttractionPicker() {
    const destinationInput = document.getElementById("destination");
    const list = document.getElementById("customAttractionList");
    if (!list) return;
    const city = normalizeDestination(destinationInput ? destinationInput.value.trim() : "");
    const emptyText = currentLanguage === "en" ? "Enter a supported destination first."
        : currentLanguage === "ko" ? "먼저 지원되는 여행지를 입력하세요." : "请先输入一个已支持的目的地。";
    const noDataText = currentLanguage === "en" ? "No attraction data is available for this city."
        : currentLanguage === "ko" ? "이 도시에는 선택할 관광지 데이터가 없습니다." : "该城市暂无可选景点数据。";
    if (!city || !travelData[city]) {
        list.innerHTML = `<div class="custom-picker-empty">${emptyText}</div>`;
        updateCustomSelectedCount();
        return;
    }
    if (customPickerCity !== city) {
        customSelectedAttractionKeys = [];
        customPickerCity = city;
    }
    const attractions = Array.isArray(travelData[city].attractions) ? travelData[city].attractions : [];
    if (!attractions.length) {
        list.innerHTML = `<div class="custom-picker-empty">${noDataText}</div>`;
        updateCustomSelectedCount();
        return;
    }
    const maxAllowed = selectedDays ? selectedDays * 3 : 15;
    const maxText = currentLanguage === "en"
        ? `Up to ${maxAllowed} places (${selectedDays || 5} days × 3 attractions).`
        : currentLanguage === "ko"
            ? `최대 ${maxAllowed}곳까지 선택할 수 있습니다.`
            : `最多选择 ${maxAllowed} 个景点（每天最多安排 3 个）。`;

    const selectedItems = customSelectedAttractionKeys.map(key =>
        attractions.find(item => getAttractionKey(item) === key)
    ).filter(Boolean);
    const orderTitle = currentLanguage === "en" ? "Your route order"
        : currentLanguage === "ko" ? "방문 순서" : "已选路线顺序";
    const orderHint = currentLanguage === "en" ? "Drag to reorder, or use ↑ / ↓."
        : currentLanguage === "ko" ? "드래그하거나 ↑ / ↓ 버튼으로 순서를 바꾸세요."
        : "拖动景点调整顺序，也可以使用 ↑ / ↓ 按钮。";
    const orderMarkup = selectedItems.length ? `
        <section class="custom-route-order" aria-label="${orderTitle}">
          <div class="custom-route-order-heading"><strong>${orderTitle}</strong><span>${orderHint}</span></div>
          <ol class="custom-route-order-list">
            ${selectedItems.map((item, index) => {
                const key = getAttractionKey(item);
                const name = getText(item.name) || key;
                return `<li class="custom-route-order-item" draggable="true"
                    data-route-key="${escapeHTML(key)}"
                    ondragstart="startCustomRouteDrag(event)"
                    ondragover="allowCustomRouteDrop(event)"
                    ondrop="dropCustomRouteItem(event)"
                    ondragend="endCustomRouteDrag()">
                    <span class="custom-route-order-number">${index + 1}</span>
                    <span class="custom-route-order-name">${escapeHTML(name)}</span>
                    <span class="custom-route-order-actions">
                      <button type="button" aria-label="Move ${escapeHTML(name)} up" ${index === 0 ? "disabled" : ""} onclick="moveCustomAttraction(this.closest('li').dataset.routeKey, -1)">↑</button>
                      <button type="button" aria-label="Move ${escapeHTML(name)} down" ${index === selectedItems.length - 1 ? "disabled" : ""} onclick="moveCustomAttraction(this.closest('li').dataset.routeKey, 1)">↓</button>
                    </span>
                  </li>`;
            }).join("")}
          </ol>
        </section>` : "";

    const cards = attractions.map(item => {
        const key = getAttractionKey(item);
        const checked = customSelectedAttractionKeys.includes(key);
        const disabled = !checked && customSelectedAttractionKeys.length >= maxAllowed;
        const name = getText(item.name) || key;
        const description = getText(item.description);
        const time = item.time || "";
        const type = item.type || "";
        return `<label class="custom-attraction-option">
            <input type="checkbox" data-attraction-key="${escapeHTML(key)}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} onchange="toggleCustomAttraction(this)">
            <span class="custom-attraction-copy">
                <span class="custom-attraction-name">${escapeHTML(name)}</span>
                <span class="custom-attraction-meta">${escapeHTML(type)}${time ? ` · ${escapeHTML(time)}` : ""}</span>
                ${description ? `<span class="custom-attraction-description">${escapeHTML(description)}</span>` : ""}
            </span>
        </label>`;
    }).join("");
    list.innerHTML = `${orderMarkup}<div class="custom-picker-empty">${maxText}</div>${cards}`;
    updateCustomSelectedCount();
}

let draggedCustomAttractionKey = "";

function startCustomRouteDrag(event) {
    const item = event.currentTarget;
    draggedCustomAttractionKey = item && item.dataset ? item.dataset.routeKey : "";
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", draggedCustomAttractionKey);
    }
    if (item) item.classList.add("dragging");
}

function allowCustomRouteDrop(event) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
}

function dropCustomRouteItem(event) {
    event.preventDefault();
    const targetKey = event.currentTarget && event.currentTarget.dataset
        ? event.currentTarget.dataset.routeKey : "";
    const sourceKey = draggedCustomAttractionKey || (event.dataTransfer && event.dataTransfer.getData("text/plain"));
    if (!sourceKey || !targetKey || sourceKey === targetKey) return;
    const from = customSelectedAttractionKeys.indexOf(sourceKey);
    const to = customSelectedAttractionKeys.indexOf(targetKey);
    if (from < 0 || to < 0) return;
    customSelectedAttractionKeys.splice(from, 1);
    customSelectedAttractionKeys.splice(to, 0, sourceKey);
    draggedCustomAttractionKey = "";
    renderCustomAttractionPicker();
}

function endCustomRouteDrag() {
    draggedCustomAttractionKey = "";
    document.querySelectorAll(".custom-route-order-item.dragging").forEach(item => item.classList.remove("dragging"));
}

function moveCustomAttraction(key, direction) {
    const from = customSelectedAttractionKeys.indexOf(key);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= customSelectedAttractionKeys.length) return;
    [customSelectedAttractionKeys[from], customSelectedAttractionKeys[to]] =
        [customSelectedAttractionKeys[to], customSelectedAttractionKeys[from]];
    renderCustomAttractionPicker();
}

function toggleCustomAttraction(checkbox) {
    const key = checkbox && checkbox.dataset ? checkbox.dataset.attractionKey : "";
    if (!key) return;
    if (checkbox.checked) {
        const maxAllowed = selectedDays ? selectedDays * 3 : 15;
        if (customSelectedAttractionKeys.length >= maxAllowed) {
            checkbox.checked = false;
            alert(currentLanguage === "en" ? "You have reached the attraction limit for this trip."
                : currentLanguage === "ko" ? "현재 여행 일정에 배정할 수 있는 관광지 수에 도달했습니다."
                : "已达到当前行程可安排的景点上限。");
            return;
        }
        if (!customSelectedAttractionKeys.includes(key)) customSelectedAttractionKeys.push(key);
    } else {
        customSelectedAttractionKeys = customSelectedAttractionKeys.filter(item => item !== key);
    }
    renderCustomAttractionPicker();
}

// -------------------------
// 生成旅游攻略
// -------------------------
function parseClockRange(range) {
    const match = String(range || "").match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return {
        start: Number(match[1]) * 60 + Number(match[2]),
        end: Number(match[3]) * 60 + Number(match[4])
    };
}

function smartSchedulePanel(day, stops) {
    const validStops = stops.filter(stop => stop && stop.attraction && parseClockRange(stop.range));
    if (!validStops.length) return "";
    const rows = validStops.map((stop, index) => {
        const range = parseClockRange(stop.range);
        const name = getText(stop.attraction.name) || `Stop ${index + 1}`;
        const nextName = validStops[index + 1] ? getText(validStops[index + 1].attraction.name) : "";
        return `<div class="smart-stop-row" data-smart-stop data-day="${day}" data-stop="${index}"
                    data-start="${range.start}" data-end="${range.end}" data-name="${escapeHTML(name)}"
                    data-next-name="${escapeHTML(nextName)}" data-travel="30">
            <div class="smart-stop-main">
              <span class="smart-stop-time">${formatClock(range.start)} – ${formatClock(range.end)}</span>
              <strong>${escapeHTML(name)}</strong>
              <span class="smart-stop-status" aria-live="polite">${currentLanguage === "en" ? "Scheduled" : currentLanguage === "ko" ? "예정" : "计划中"}</span>
            </div>
            ${index < validStops.length - 1 ? `<p class="smart-stop-next">${currentLanguage === "en" ? `Next: ${escapeHTML(nextName)} · estimated travel 30 min` : currentLanguage === "ko" ? `다음 장소: ${escapeHTML(nextName)} · 이동 약 30분` : `下一站：${escapeHTML(nextName)} · 预计交通 30 分钟`}</p>` : ""}
            <button type="button" class="smart-finish-button" onclick="finishSmartStop(${day}, ${index})">${currentLanguage === "en" ? "Mark finished now" : currentLanguage === "ko" ? "지금 종료로 기록" : "标记为现在结束"}</button>
        </div>`;
    }).join("");
    return `<section class="smart-reminder-panel" data-smart-day="${day}">
      <div class="smart-reminder-header">
        <div><strong>🔔 ${currentLanguage === "en" ? "Smart schedule alerts" : currentLanguage === "ko" ? "스마트 일정 알림" : "智能行程提醒"}</strong>
        <p>${currentLanguage === "en" ? "Keep this page open to receive departure reminders." : currentLanguage === "ko" ? "출발 알림을 받으려면 이 페이지를 열어 두세요." : "保持本页面打开；到出发时间时会在页面中央弹窗提醒。"}</p></div>
        <button type="button" class="smart-notification-enable" onclick="enableSmartNotifications()">${currentLanguage === "en" ? "Enable page alerts" : currentLanguage === "ko" ? "페이지 알림 켜기" : "开启页面弹窗提醒"}</button>
      </div>
      <div class="smart-stop-list">${rows}</div>
      <p class="smart-reminder-footnote">${currentLanguage === "en" ? "Travel time is an estimate (30 min per transfer). Actual traffic may vary." : currentLanguage === "ko" ? "이동 시간은 구간당 30분으로 추정하며 실제 교통 상황에 따라 달라질 수 있습니다." : "交通时间暂按每段 30 分钟估算，实际请以地图和路况为准。"}</p>
    </section>`;
}

function enableSmartNotifications() {
    // 微信内置浏览器及部分 iPhone 浏览器不可靠支持系统通知；改用网页内弹窗。
    showSmartReminderMessage(
        currentLanguage === "en" ? "Page alerts are enabled. Keep this page open during your trip." :
        currentLanguage === "ko" ? "페이지 알림이 켜졌습니다. 여행 중 이 페이지를 열어 두세요." :
        "页面弹窗提醒已开启。旅行期间请保持这个网页打开。",
        "success"
    );
    showSmartReminderPopup(
        currentLanguage === "en" ? "Page alerts enabled" : currentLanguage === "ko" ? "페이지 알림 켜짐" : "页面提醒已开启",
        currentLanguage === "en" ? "When it is time to leave, a reminder will appear in this page. Keep the page open." : currentLanguage === "ko" ? "출발 시간이 되면 이 페이지에 알림 창이 표시됩니다. 페이지를 열어 두세요." : "到该出发的时间时，网页会弹出醒目的提醒。请保持网页打开。",
        "success"
    );
}

function showSmartReminderPopup(title, body, type = "urgent") {
    let overlay = document.getElementById("smartReminderPopup");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "smartReminderPopup";
        overlay.className = "smart-reminder-overlay";
        overlay.setAttribute("role", "alertdialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "smartReminderPopupTitle");
        overlay.innerHTML = `<div class="smart-reminder-dialog"><div class="smart-reminder-popup-icon">🔔</div><h2 id="smartReminderPopupTitle"></h2><p id="smartReminderPopupBody"></p><button type="button" id="smartReminderPopupClose">我知道了</button></div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener("click", event => { if (event.target === overlay) overlay.remove(); });
        overlay.querySelector("#smartReminderPopupClose").addEventListener("click", () => overlay.remove());
    }
    overlay.className = `smart-reminder-overlay ${type}`;
    overlay.querySelector("#smartReminderPopupTitle").textContent = title;
    overlay.querySelector("#smartReminderPopupBody").textContent = body;
    const close = overlay.querySelector("#smartReminderPopupClose");
    close.textContent = currentLanguage === "en" ? "Got it" : currentLanguage === "ko" ? "확인" : "我知道了";
    overlay.hidden = false;
}

function showSmartReminderMessage(message, type = "warning") {
    let banner = document.getElementById("smartReminderLiveMessage");
    if (!banner) {
        banner = document.createElement("div");
        banner.id = "smartReminderLiveMessage";
        banner.className = "smart-reminder-live-message";
        const result = document.getElementById("result");
        if (result) result.prepend(banner);
    }
    if (!banner) return;
    banner.className = `smart-reminder-live-message ${type}`;
    banner.textContent = message;
    banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function sendSmartNotification(title, body, tag) {
    // 不依赖系统通知 API；直接在页面中央显示弹窗，适配微信内置浏览器。
    showSmartReminderMessage(`${title}：${body}`, "urgent");
    showSmartReminderPopup(title, body, "urgent");
    // iOS Safari/微信通常不支持网页振动；调用失败不影响弹窗。
    try { if (navigator.vibrate) navigator.vibrate([180, 80, 180]); } catch (error) { /* optional */ }
}

function finishSmartStop(day, stopIndex) {
    const panel = document.querySelector(`[data-smart-day="${day}"]`);
    if (!panel) return;
    const rows = [...panel.querySelectorAll("[data-smart-stop]")];
    const row = rows[stopIndex];
    if (!row) return;
    const now = new Date();
    const actualEnd = now.getHours() * 60 + now.getMinutes();
    const plannedEnd = Number(row.dataset.end);
    const delay = Math.max(0, actualEnd - plannedEnd);
    row.dataset.completed = "true";
    const status = row.querySelector(".smart-stop-status");
    const button = row.querySelector(".smart-finish-button");
    if (status) status.textContent = currentLanguage === "en" ? `Finished ${formatClock(actualEnd)}` : currentLanguage === "ko" ? `${formatClock(actualEnd)} 종료` : `实际 ${formatClock(actualEnd)} 结束`;
    if (button) { button.disabled = true; button.textContent = currentLanguage === "en" ? "Completed" : currentLanguage === "ko" ? "완료" : "已完成"; }

    const next = rows[stopIndex + 1];
    if (!next) {
        showSmartReminderMessage(currentLanguage === "en" ? "The last attraction is complete." : currentLanguage === "ko" ? "마지막 관광지를 완료했습니다." : "当天最后一个景点已完成。", "success");
        return;
    }

    const originalNextStart = Number(next.dataset.start);
    const travel = Number(row.dataset.travel || 30);
    const departureDeadline = originalNextStart - travel;
    const mustLeaveNow = actualEnd >= departureDeadline;
    // 只把实际到达时间晚于下一站原定开始时间的部分顺延，避免无谓地把整段交通时间重复加到日程中
    const scheduleShift = Math.max(0, actualEnd + travel - originalNextStart);

    if (scheduleShift > 0) {
        rows.slice(stopIndex + 1).forEach(nextRow => {
            const start = Number(nextRow.dataset.start) + scheduleShift;
            const end = Number(nextRow.dataset.end) + scheduleShift;
            nextRow.dataset.start = start;
            nextRow.dataset.end = end;
            const time = nextRow.querySelector(".smart-stop-time");
            if (time) time.textContent = `${formatClock(start)} – ${formatClock(end)}`;
        });
        // 同步顺延当前景点之后的所有行程卡片（餐饮、交通、景点和自由活动）
        const currentCard = document.querySelector(`[data-smart-card="${panel.dataset.smartDay}-${stopIndex}"]`);
        if (currentCard && currentCard.parentElement) {
            const siblings = [...currentCard.parentElement.children];
            const currentCardIndex = siblings.indexOf(currentCard);
            siblings.slice(currentCardIndex + 1).forEach(card => {
                if (!card.classList || !card.classList.contains("place")) return;
                const timeTitle = [...card.querySelectorAll(".place-title")].find(el => parseClockRange(el.textContent));
                if (!timeTitle) return;
                const oldRange = parseClockRange(timeTitle.textContent);
                const updated = `${formatClock(oldRange.start + scheduleShift)} - ${formatClock(oldRange.end + scheduleShift)}`;
                timeTitle.textContent = timeTitle.textContent.replace(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/, updated);
            });
        }
    }

    if (mustLeaveNow) {
        const nextName = next.dataset.name || (currentLanguage === "en" ? "the next stop" : currentLanguage === "ko" ? "다음 장소" : "下一个地点");
        const title = currentLanguage === "en" ? "Departure reminder" : currentLanguage === "ko" ? "출발 알림" : "出发提醒";
        const body = currentLanguage === "en"
            ? `You finished at ${formatClock(actualEnd)}. Leave now for ${nextName}; estimated travel is ${travel} min.`
            : currentLanguage === "ko"
                ? `${formatClock(actualEnd)}에 종료했습니다. 다음 장소 ${nextName}(으)로 지금 출발하세요. 이동 약 ${travel}분.`
                : `你在 ${formatClock(actualEnd)} 才结束当前行程。现在必须出发前往${nextName}，预计交通 ${travel} 分钟。`;
        sendSmartNotification(title, body, `late-day-${day}-stop-${stopIndex}`);
        smartReminderSent.add(`day-${day}-stop-${stopIndex}-${departureDeadline}`);
        smartReminderSent.add(`day-${day}-stop-${stopIndex}-${Number(next.dataset.start) - travel}`);
    } else if (delay > 0) {
        showSmartReminderMessage(currentLanguage === "en"
            ? `You are ${delay} min late, but there is still enough transfer time.`
            : currentLanguage === "ko"
                ? `${delay}분 지연되었지만 이동 시간은 아직 확보되어 있습니다.`
                : `当前比计划晚 ${delay} 分钟，但仍有足够交通时间；后续日程已按预计到达时间校准。`, "warning");
    } else {
        showSmartReminderMessage(currentLanguage === "en" ? "Great! You are on schedule." : currentLanguage === "ko" ? "좋습니다! 일정대로 진행 중입니다." : "很好，目前没有延误。", "success");
    }
}

function checkSmartDepartureDeadlines() {
    const now = new Date();
    const minute = now.getHours() * 60 + now.getMinutes();
    const activeTripDay = getCurrentTripDayNumber();
    document.querySelectorAll("[data-smart-day]").forEach(panel => {
        if (Number(panel.dataset.smartDay) !== activeTripDay) return;
        const rows = [...panel.querySelectorAll("[data-smart-stop]")];
        rows.slice(0, -1).forEach((row, index) => {
            const next = rows[index + 1];
            const deadline = Number(next.dataset.start) - Number(row.dataset.travel || 30);
            const key = `day-${panel.dataset.smartDay}-stop-${index}-${deadline}`;
            if (minute >= deadline && minute < Number(next.dataset.start) && !smartReminderSent.has(key)) {
                smartReminderSent.add(key);
                const nextName = next.dataset.name || (currentLanguage === "en" ? "the next stop" : currentLanguage === "ko" ? "다음 장소" : "下一个地点");
                sendSmartNotification(
                    currentLanguage === "en" ? "Time to leave" : currentLanguage === "ko" ? "출발할 시간입니다" : "该出发了",
                    currentLanguage === "en" ? `Leave now for ${nextName} to stay on schedule.` : currentLanguage === "ko" ? `${nextName}(으)로 지금 출발해야 일정에 맞출 수 있습니다.` : `现在出发前往${nextName}，才能尽量赶上原定行程。`,
                    key
                );
            }
        });
    });
}

function startSmartReminderClock() {
    if (smartReminderTimer) clearInterval(smartReminderTimer);
    smartReminderTimer = setInterval(checkSmartDepartureDeadlines, 30000);
    checkSmartDepartureDeadlines();
}

function generatePlan(silent = false) {
    if (typeof travelData === "undefined") {
        if (!silent) alert("未找到 travelData。请确认 index.html 中先加载 data.js，再加载 script.js。");
        return;
    }

    const destinationInput = document.getElementById("destination");
    const budgetInput = document.getElementById("budget");
    const destination = destinationInput ? destinationInput.value.trim() : "";
    const budget = budgetInput ? budgetInput.value.trim() : "";

    const messages = {
        zh: { destination: "请输入旅游目的地", days: "请选择旅行天数", people: "请选择同行人数", noCity: "目前暂时没有这个城市的数据。请检查城市名称或 data.js 中的城市键。" },
        ko: { destination: "여행 목적지를 입력하세요", days: "여행 일수를 선택하세요", people: "동행 인원을 선택하세요", noCity: "아직 이 도시의 데이터가 없습니다. 도시 이름 또는 data.js의 도시 키를 확인하세요." },
        en: { destination: "Please enter a destination.", days: "Please select the trip duration.", people: "Please select the number of travelers.", noCity: "No data is available for this city yet. Check the city name and the keys in data.js." }
    };
    const M = messages[currentLanguage] || messages.zh;

    if (!destination) { if (!silent) alert(M.destination); return; }
    if (!selectedDays) { if (!silent) alert(M.days); return; }
    if (!selectedPeople) { if (!silent) alert(M.people); return; }

    const finalCity = normalizeDestination(destination);
    if (!travelData[finalCity]) {
        if (!silent) alert(M.noCity + "\n\n" + Object.keys(travelData).join("、"));
        return;
    }

    const cityData = travelData[finalCity];
    const attractions = Array.isArray(cityData.attractions) ? cityData.attractions : [];
    const foods = Array.isArray(cityData.foods) ? cityData.foods : [];
    // 读取当前地区的餐厅推荐
const restaurants = Array.isArray(cityData.restaurants)
    ? cityData.restaurants
    : [];
    if (!attractions.length) {
        if (!silent) alert(currentLanguage === "en" ? "No attractions are registered for this city." : currentLanguage === "ko" ? "이 도시에는 등록된 관광지가 없습니다." : "这个城市还没有景点数据。");
        return;
    }

    const preferredTypes = [];
    selectedPreferences.forEach(preference => {
        (preferenceTypeMap[preference] || []).forEach(type => {
            if (!preferredTypes.includes(type)) preferredTypes.push(type);
        });
    });

    if (routeMode === "custom" && customSelectedAttractionKeys.length === 0) {
        if (!silent) alert(currentLanguage === "en" ? "Please select at least one attraction for your custom route."
            : currentLanguage === "ko" ? "사용자 지정 경로에 관광지를 하나 이상 선택하세요."
            : "请至少选择一个想去的景点。");
        return;
    }
    const sortedAttractions = routeMode === "custom"
        ? customSelectedAttractionKeys
            .map(key => attractions.find(item => getAttractionKey(item) === key))
            .filter(Boolean)
        : attractions.slice().sort((a, b) => {
            const aMatch = preferredTypes.includes(a.type) ? 0 : 1;
            const bMatch = preferredTypes.includes(b.type) ? 0 : 1;
            return aMatch - bMatch;
        });
    const wantFood = selectedPreferences.includes("美食");
    const prefText = selectedPreferences.length
        ? selectedPreferences.map(p => preferenceNames[p]?.[currentLanguage] || preferenceNames[p]?.zh || p).join(currentLanguage === "zh" ? "、" : ", ")
        : (timelineText[currentLanguage] || timelineText.zh).noPreference;

    const planTitle = currentLanguage === "zh"
        ? `${finalCity} ${selectedDays}日游`
        : currentLanguage === "ko"
            ? `${finalCity} ${selectedDays}일 여행`
            : `${finalCity} ${selectedDays}-Day Trip`;

    const T = timelineText[currentLanguage] || timelineText.zh;
    const nightText = nightActivity[currentLanguage] || nightActivity.zh;
    const totalBudget = Number(budget);
    const validBudget = Number.isFinite(totalBudget) && totalBudget > 0 ? totalBudget : 0;
    const dailyPerPerson = validBudget > 0 ? validBudget / selectedPeople / selectedDays : 0;

    const budgetWords = {
        zh: { total: "总预算", perDay: "人均每天约", accommodation: "住宿", food: "餐饮", transport: "市内交通", tickets: "景点门票", reserve: "机动预留", note: "以上为预算规划参考，实际花费会受住宿、旺季和汇率影响，请按需调整。", enter: "输入总预算后可查看分类预算参考。", title: "交通与预算", tips: "城市交通建议" },
        ko: { total: "총예산", perDay: "1인 하루 약", accommodation: "숙박", food: "식사", transport: "시내 교통", tickets: "입장권", reserve: "예비비", note: "예산은 참고용이며 숙박비, 성수기 및 환율에 따라 달라질 수 있습니다.", enter: "총예산을 입력하면 항목별 예산을 확인할 수 있습니다.", title: "교통 및 예산", tips: "도시 교통 안내" },
        en: { total: "Total Budget", perDay: "Approx. per person per day", accommodation: "Accommodation", food: "Food", transport: "Local Transport", tickets: "Attraction Tickets", reserve: "Contingency", note: "This is an estimate. Actual costs vary by accommodation, season, and exchange rates.", enter: "Enter a total budget to view the estimated breakdown.", title: "Transportation & Budget", tips: "City Transportation" }
    };
    const B = budgetWords[currentLanguage] || budgetWords.zh;
    const currency = currentLanguage === "en" ? "CNY" : currentLanguage === "ko" ? "위안" : "元";

    let resultHTML = `
        <h1>${escapeHTML(planTitle)}</h1>
        <p style="margin:15px 0;color:#777;">
            ${currentLanguage === "zh"
                ? `预算：${escapeHTML(budget || "未设置")} 元　同行人数：${selectedPeople} 人　偏好：${escapeHTML(prefText)}　路线：${routeMode === "custom" ? "自定义" : "自动"}`
                : currentLanguage === "ko"
                    ? `예산: ${escapeHTML(budget || "미설정")} 위안　동행 인원: ${selectedPeople}명　취향: ${escapeHTML(prefText)}　경로: ${routeMode === "custom" ? "사용자 지정" : "자동"}`
                    : `Budget: ${escapeHTML(budget || "not set")} CNY　Travelers: ${selectedPeople}　Preferences: ${escapeHTML(prefText)}　Route: ${routeMode === "custom" ? "Custom" : "Automatic"}`}
        </p>
        <div class="day-card">
            <h2>${B.title}</h2>
            <div class="place">
                <div class="place-title">🚇 ${B.tips}</div>
                <div class="place-info">${getText(cityData.transport) || (currentLanguage === "en" ? "Check a map app for local transportation." : currentLanguage === "ko" ? "현지 교통은 지도 앱에서 확인하세요." : "请通过地图应用确认当地交通信息。")}</div>
            </div>
            <div class="place">
                <div class="place-title">💰 ${T.budget || "Budget"}</div>
                ${validBudget > 0 ? `
                    <div class="place-info">${B.total}: ${validBudget.toFixed(0)} ${currency} ｜ ${B.perDay}: ${dailyPerPerson.toFixed(0)} ${currency}</div>
                    <div class="place-info">${B.accommodation} 35%: ${(validBudget * 0.35).toFixed(0)} ${currency} ｜ ${B.food} 25%: ${(validBudget * 0.25).toFixed(0)} ${currency}</div>
                    <div class="place-info">${B.transport} 15%: ${(validBudget * 0.15).toFixed(0)} ${currency} ｜ ${B.tickets} 15%: ${(validBudget * 0.15).toFixed(0)} ${currency} ｜ ${B.reserve} 10%: ${(validBudget * 0.10).toFixed(0)} ${currency}</div>
                    <div class="place-info">${B.note}</div>
                ` : `<div class="place-info">${B.enter}</div>`}
            </div>
        </div>
    `;

    // 记录已经安排过的景点，不再重复使用
let nextAttractionIndex = 0;

// 记录已经推荐过的餐厅，避免不同日期重复推荐
const usedRestaurantNames = new Set();
// 记录整个行程已经推荐过的美食
const usedFoodNames = new Set();
let nextFoodIndex = 0;

// 判断美食属于正餐还是小吃、早餐、甜品
function classifyFoodForMeal(item) {
    if (!item) return "other";

    const name = getText(item.name).toLowerCase();
    const description = getText(item.description).toLowerCase();

    const text = `${name} ${description}`;

    const otherKeywords = [
        // 中文：早餐、小吃、甜品、饮料
        "早餐", "早点", "早饭", "下午茶",
        "小吃", "街边小吃", "零食",
        "甜品", "甜点", "糖水", "糕点",
        "冰淇淋", "雪糕", "奶茶", "饮料",
        "蛋糕", "面包", "月饼", "烧饼",

        // 韩文
        "아침 식사", "아침식사", "간식",
        "디저트", "후식", "빙수", "케이크",
        "빵", "아이스크림", "음료",

        // 英文
        "breakfast", "snack", "dessert",
        "ice cream", "cake", "pastry",
        "bakery", "sweet drink", "bubble tea"
    ];

    if (otherKeywords.some(word => text.includes(word))) {
        return "other";
    }

    return "main";
}

// 整份攻略共用排重集合，跨天不重复

// 整份攻略共用排重集合：同一道菜整个行程只推荐一次
function takeUniqueFood(mealType = "main") {
    for (const item of foods) {
        if (!item) continue;

        const name = item.name;

        const aliases = (
            name && typeof name === "object"
                ? [name.zh, name.ko, name.en]
                : [name]
        )
            .filter(Boolean)
            .map(value => String(value).trim().toLowerCase())
            .filter(Boolean);

        if (!aliases.length) continue;

        // 正餐和小吃分别筛选
        if (classifyFoodForMeal(item) !== mealType) {
            continue;
        }

        // 只选择整个行程中从未推荐过的菜品
        const alreadyUsed = aliases.some(alias =>
            usedFoodNames.has(alias)
        );

        if (alreadyUsed) continue;

        // 记录所有语言名称，避免中韩英名称不同造成重复
        aliases.forEach(alias => {
            usedFoodNames.add(alias);
        });

        return item;
    }

    // 没有新的菜品就不再推荐，绝不重复
    return null;
}

function getRestaurantKey(item) {
    const name = item && item.name;
    if (name && typeof name === "object") {
        return String(name.zh || name.ko || name.en || "").trim();
    }
    return String(name || "").trim();
}
// 根据推荐美食匹配餐厅，避免随意搭配

function findRestaurantForFood(food) {
    if (!food || !Array.isArray(restaurants)) return null;

    const foodName = getText(food.name).trim().toLowerCase();

    if (!foodName) return null;

    // 只允许主打菜品与推荐菜匹配的餐厅
    const matchingRestaurants = restaurants.filter(item => {
        const key = getRestaurantKey(item);
        const specialty = getText(item.specialty).trim().toLowerCase();

        if (!key || !specialty) return false;

        return specialty.includes(foodName) ||
               foodName.includes(specialty);
    });

    // 第一优先级：尚未推荐过的匹配餐厅
    let selected = matchingRestaurants.find(item =>
        !usedRestaurantNames.has(getRestaurantKey(item))
    );

    // 第二优先级：没有新餐厅时，允许重新推荐匹配餐厅
    if (!selected && matchingRestaurants.length > 0) {
        selected = matchingRestaurants[0];
    }

    if (!selected) return null;

    usedRestaurantNames.add(getRestaurantKey(selected));

    return selected;
}
    
for (let day = 1; day <= selectedDays; day++) {
    // 先安排真实景点，不够时再使用备用体验活动
    // 每天优先安排最多三个真实景点
let attraction1 = sortedAttractions[nextAttractionIndex++] || null;
let attraction2 = sortedAttractions[nextAttractionIndex++] || null;
let attraction3 = sortedAttractions[nextAttractionIndex++] || null;

    // 午餐和晚餐优先选择正餐
const food = takeUniqueFood("main");
const foodExtra = takeUniqueFood("main");

// 另外推荐一道小吃、早餐或甜品
const extraSnack = takeUniqueFood("other");

   // 午餐和晚餐分别匹配对应餐厅
const lunchRestaurant = findRestaurantForFood(food);
const dinnerRestaurant = findRestaurantForFood(foodExtra);

    
    // 每天从上午09:00开始安排时间
    // 每天重新计算，避免第二天时间接着前一天累加
    let currentMinute = 9 * 60;

    const takeTimeRange = (duration) => {
        const startMinute = currentMinute;
        const endMinute = startMinute + Math.max(0, Number(duration) || 0);

        currentMinute = endMinute;

        return `${formatClock(startMinute)} - ${formatClock(endMinute)}`;
    };

    // 景点、用餐和交通时间
    // 景点、用餐和交通时间
const attraction1Range = attraction1
    ? takeTimeRange(durationToMinutes(attraction1.time))
    : "";

const foodRange = takeTimeRange(60);

const transferRange = attraction1 && attraction2
    ? takeTimeRange(30)
    : "";

const attraction2Range = attraction2
    ? takeTimeRange(durationToMinutes(attraction2.time))
    : "";

const transfer2Range = attraction2 && attraction3
    ? takeTimeRange(30)
    : "";

const attraction3Range = attraction3
    ? takeTimeRange(durationToMinutes(attraction3.time))
    : "";

// 自由活动控制在30—60分钟
const freeDuration = Math.max(
    30,
    Math.min(60, 18 * 60 - currentMinute)
);

const freeRange = takeTimeRange(freeDuration);

const dinnerRange = takeTimeRange(60);
const nightRange = takeTimeRange(120);

    const attractionCard = (attraction, range, emoji, smartId = "") => {
        if (!attraction) {
    return "";
}

        const name = getText(attraction.name) || (
            currentLanguage === "en" ? "Attraction" :
            currentLanguage === "ko" ? "관광지" : "景点"
        );

        const description = getText(attraction.description) || "";

        const typeText = attraction.isGenericActivity
            ? (
                currentLanguage === "en" ? "Optional local experience" :
                currentLanguage === "ko" ? "선택 가능한 현지 체험" :
                "可选当地体验"
            )
            : `${escapeHTML(translateType(attraction.type))} · ${escapeHTML(T.duration)}: ${escapeHTML(translateTime(attraction.time))}`;

        return `
            <div class="place" data-smart-card="${smartId}">
                <div class="place-title" data-smart-card-time>${emoji} ${range}</div>
                <div class="place-title">${escapeHTML(name)}</div>
                
              
<figure style="margin:10px 0;">

    <div
        data-attraction-gallery
        data-photo-query="${escapeHTML(finalCity + " " + (attraction.name?.en || attraction.name?.ko || attraction.name?.zh || name))} landscape scenery"
data-photo-identity="${escapeHTML([attraction.name?.zh, attraction.name?.ko, attraction.name?.en, name].filter(Boolean).join("|"))}"
        style="
            display:flex;
            gap:12px;
            overflow-x:auto;
            padding:4px 2px 12px;
            scroll-snap-type:x mandatory;
            -webkit-overflow-scrolling:touch;
        "
    ></div>

    <div
        data-photo-placeholder
        class="place-info"
        style="padding:12px 0;"
    >
        📷 正在查找景点照片……
    </div>

    <figcaption style="font-size:12px;margin-top:5px;">
        左右滑动查看更多照片（最多5张）
    </figcaption>

</figure>

                <div class="place-info">${typeText}</div>
                <div class="place-info">${escapeHTML(description)}</div>
                ${!attraction.isGenericActivity
                    ? `<div class="place-info">🚇 ${getAttractionRoute(finalCity, attraction.name)}</div>`
                    : ""}
            </div>
        `;
    };

    const foodName = food ? getText(food.name) : T.noFood;
    const foodDescription = food ? getText(food.description) : "";
    // 美食与餐厅合并显示
// 美食与餐厅合并显示：同一家餐厅展示最多三道推荐菜
const foodRestaurantCard = (mealLabel, dish, range, shop) => {
    if (!dish) return "";

    const mainDishName = getText(dish.name);
    const mainDishDescription = getText(dish.description);

    // 优先读取餐厅中已经录入的三道真实推荐菜
    // 当前行程推荐的菜品也作为第一道，避免与主推荐脱节
    let dishes = [];

    if (shop && Array.isArray(shop.recommendedDishes)) {
        dishes = shop.recommendedDishes.filter(item => item && item.name);
    }

    if (dishes.length === 0) {
        dishes = [{
            name: dish.name,
            description: dish.description
        }];
    }

    // 确保本次推荐的主菜排在第一位
    const mainKey = mainDishName.trim().toLowerCase();

    dishes = [
        {
            name: dish.name,
            description: dish.description
        },
        ...dishes.filter(item =>
            getText(item.name).trim().toLowerCase() !== mainKey
        )
    ].slice(0, 3);

    const dishCards = dishes.map((item, index) => {
        const name = getText(item.name);
        const description = getText(item.description);

        return `
            <div style="
                border:1px solid #e5e7eb;
                border-radius:10px;
                padding:12px;
                margin:10px 0;
            ">
                <div class="place-title">
                    🍽️ ${index + 1}. ${escapeHTML(name)}
                </div>

                <div
                    data-food-gallery
                    data-food-query="${escapeHTML(
                        finalCity + " " +
                        (item.name?.en || name) +
                        " food dish"
                    )}"
                    data-food-identity="${escapeHTML(
                        [
                            item.name?.zh,
                            item.name?.ko,
                            item.name?.en,
                            name
                        ].filter(Boolean).join("|")
                    )}"
                    style="width:100%;margin:10px 0;"
                >
                    <div
                        data-food-placeholder
                        class="place-info"
                        style="padding:12px 0;"
                    >
                        📷 正在查找这道菜的照片……
                    </div>
                </div>

                <div class="place-info">
                    ${escapeHTML(description)}
                </div>
            </div>
        `;
    }).join("");

    return `
        <div class="place">

            <div class="place-title">
                🍴 ${escapeHTML(range)} · ${escapeHTML(mealLabel)}
            </div>

            ${shop ? `
                <div class="place-title">
                    🏪 ${currentLanguage === "en"
                        ? "Recommended Restaurant"
                        : currentLanguage === "ko"
                            ? "추천 맛집"
                            : "推荐餐厅"}
                </div>

                <div class="place-info">
                    ${escapeHTML(getText(shop.name))}
                </div>

                <div class="place-info">
                    📍 ${escapeHTML(getText(shop.area))}
                </div>

                <div class="place-info">
                    ${currentLanguage === "en" ? "Specialty: "
                        : currentLanguage === "ko" ? "대표 메뉴: "
                        : "招牌菜："}
                    ${escapeHTML(getText(shop.specialty))}
                </div>

                <div class="place-info">
                    ${escapeHTML(getText(shop.description))}
                </div>

                <div class="place-title">
                    🍽️ ${currentLanguage === "en"
                        ? "Recommended Dishes"
                        : currentLanguage === "ko"
                            ? "추천 메뉴"
                            : "推荐菜品"}
                </div>

                ${dishCards}

            ` : `
                <div class="place-info">
                    ${currentLanguage === "en"
                        ? "No verified restaurant matching this dish has been added yet."
                        : currentLanguage === "ko"
                            ? "이 음식과 일치하는 확인된 식당 정보가 아직 없습니다."
                            : "暂时没有录入与这道美食匹配的已核实餐厅。"}
                </div>

                ${dishCards}
            `}

        </div>
    `;
};
const lunchLabel = currentLanguage === "en" ? "Lunch"
    : currentLanguage === "ko" ? "점심 추천" : "午餐推荐";

const dinnerLabel = currentLanguage === "en" ? "Dinner"
    : currentLanguage === "ko" ? "저녁 추천" : "晚餐推荐";
    // 根据美食匹配对应餐厅，避免餐厅重复

    resultHTML += `
        <div class="day-card">
            <h2>${T.titleDay(day)}</h2>
            ${smartSchedulePanel(day, [
                { attraction: attraction1, range: attraction1Range },
                { attraction: attraction2, range: attraction2Range },
                { attraction: attraction3, range: attraction3Range }
            ])}

            ${attractionCard(attraction1, attraction1Range, "📍", `${day}-0`)}

            ${foodRestaurantCard(
    lunchLabel,
    food,
    foodRange,
    lunchRestaurant
)}

            ${attraction1 && attraction2 ? `
                <div class="place">
                    <div class="place-title">🚇 ${transferRange}</div>
                    <div class="place-title">${T.transport}</div>
                    <div class="place-info">${getTransferRoute(finalCity, attraction1.name, attraction2.name)}</div>
                </div>
            ` : ""}

            ${attractionCard(attraction2, attraction2Range, "📷", `${day}-1`)}
            ${attraction2 && attraction3 ? `
    <div class="place">
        <div class="place-title">🚇 ${transfer2Range}</div>
        <div class="place-title">${T.transport}</div>
        <div class="place-info">${getTransferRoute(finalCity, attraction2.name, attraction3.name)}</div>
    </div>
` : ""}

${attractionCard(attraction3, attraction3Range, "📍", `${day}-2`)}

            <div class="place">
                <div class="place-title">☕ ${freeRange}</div>
                <div class="place-title">${T.free}</div>
            </div>
            
            ${foodExtra ? foodRestaurantCard(
    dinnerLabel,
    foodExtra,
    dinnerRange,
    dinnerRestaurant
) : ""}
      
          ${extraSnack ? `
    <div class="place">
        <div class="place-title">
            ${currentLanguage === "en"
                ? "🍰 Extra Snack & Dessert Recommendations"
                : currentLanguage === "ko"
                    ? "🍰 추가 간식 및 디저트 추천"
                    : "🍰 额外小吃与甜品推荐"}
        </div>
        ${foodRestaurantCard(
            currentLanguage === "en" ? "Extra recommendation"
                : currentLanguage === "ko" ? "추가 추천"
                : "额外推荐",
            extraSnack,
            "",
            null
        )}
    </div>
` : ""} 

            <div class="place">
                <div class="place-title">🌙 ${nightRange}</div>
                <div class="place-title">${escapeHTML(finalCity)} - ${nightText.title}</div>
                <div class="place-info">${nightText.description}</div>
            </div>
        </div>
    `;
}
resultHTML += `
    <div class="route-map-section">
        <h2>
            ${currentLanguage === "en" ? "🗺️ Travel Route Map" :
              currentLanguage === "ko" ? "🗺️ 여행 경로 지도" :
              "🗺️ 旅行路线地图"}
        </h2>
        <div id="travelRouteMap" style="width:100%; height:400px; border-radius:12px;"></div>
    </div>
`;

    const result = document.getElementById("result");

if (result) {
    result.innerHTML = resultHTML;
    initializeTravelRouteMap();
    startSmartReminderClock();
    renderLiveLocationPanel();

    // 加载景点照片
    loadAttractionPhotos(result);

    // 加载美食照片
    loadFoodPhotos(result);
}

    currentPlan = { title: planTitle, html: resultHTML };
    hasGeneratedPlan = true;

    const saveArea = document.getElementById("saveArea");
    if (saveArea) saveArea.style.display = "block";

    if (!silent && result) result.scrollIntoView({ behavior: "smooth" });
}
// 地图在行程 HTML 插入后才初始化；手机端容器尺寸变化后重新计算 Leaflet 画布
let travelRouteMapInstance = null;

function initializeTravelRouteMap() {
    const mapElement = document.getElementById("travelRouteMap");
    if (!mapElement || typeof L === "undefined") return;

    if (travelRouteMapInstance) {
        travelRouteMapInstance.remove();
        travelRouteMapInstance = null;
    }

    travelRouteMapInstance = L.map(mapElement, {
        zoomControl: true,
        scrollWheelZoom: false
    }).setView([35.1796, 129.0756], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(travelRouteMapInstance);

    // 等待移动端布局完成后刷新地图尺寸，避免出现灰色/空白瓦片区域
    requestAnimationFrame(() => {
        if (travelRouteMapInstance) travelRouteMapInstance.invalidateSize();
    });
}

// -------------------------
// 保存 / 查看 / 删除攻略
// -------------------------
function getSavedPlans() {
    try {
        const saved = JSON.parse(localStorage.getItem("travelGuidePlans") || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.error("读取已保存攻略失败：", error);
        return [];
    }
}

function savePlan() {
    if (!currentPlan) {
        alert(currentLanguage === "en" ? "Generate a travel guide before saving." : currentLanguage === "ko" ? "저장하기 전에 여행 가이드를 생성하세요." : "请先生成旅游攻略，再保存。");
        return;
    }

    const plan = {
        id: Date.now(),
        title: currentPlan.title,
        time: new Date().toLocaleString(),
        html: document.getElementById("result")?.innerHTML || currentPlan.html
    };
    const plans = getSavedPlans();
    plans.unshift(plan);

    try {
        localStorage.setItem("travelGuidePlans", JSON.stringify(plans));
    } catch (error) {
        console.error("保存攻略失败：", error);
        alert(currentLanguage === "en" ? "Unable to save. Browser storage may be unavailable." : currentLanguage === "ko" ? "저장하지 못했습니다. 브라우저 저장 공간을 확인하세요." : "保存失败，请检查浏览器存储设置。");
        return;
    }

    renderSavedList();
    alert(currentLanguage === "en" ? "Guide saved." : currentLanguage === "ko" ? "저장되었습니다." : "保存成功");
}

function renderSavedList() {
    const list = document.getElementById("savedList");
    const empty = document.getElementById("savedEmpty");
    if (!list || !empty) return;

    const plans = getSavedPlans();
    list.innerHTML = "";
    if (plans.length === 0) {
        empty.style.display = "block";
        return;
    }
    empty.style.display = "none";

    plans.forEach(plan => {
        const item = document.createElement("div");
        item.className = "saved-item";
        const viewLabel = currentLanguage === "ko" ? "보기" : currentLanguage === "en" ? "View" : "查看";
        const deleteLabel = currentLanguage === "ko" ? "삭제" : currentLanguage === "en" ? "Delete" : "删除";
        item.innerHTML = `
            <div class="saved-info">
                <div class="saved-name">${escapeHTML(plan.title)}</div>
                <div class="saved-time">${escapeHTML(plan.time)}</div>
            </div>
            <div class="saved-actions">
                <button type="button" onclick="viewPlan(${Number(plan.id)})">${viewLabel}</button>
                <button type="button" onclick="deletePlan(${Number(plan.id)})">${deleteLabel}</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function viewPlan(id) {
    const plan = getSavedPlans().find(item => Number(item.id) === Number(id));
    if (!plan) return;
    const result = document.getElementById("result");
    if (result) result.innerHTML = plan.html;
    const saveArea = document.getElementById("saveArea");
    if (saveArea) saveArea.style.display = "none";
    if (result) result.scrollIntoView({ behavior: "smooth" });
}

function deletePlan(id) {
    const plans = getSavedPlans().filter(item => Number(item.id) !== Number(id));
    localStorage.setItem("travelGuidePlans", JSON.stringify(plans));
    renderSavedList();
    renderLiveLocationPanel();
}

// -------------------------
// 中文、韩语、英语语言切换
// -------------------------
function changeLanguage(language) {
    if (!["zh", "ko", "en"].includes(language)) return;

    currentLanguage = language;
    isKorean = currentLanguage === "ko";

    const translations = {
        zh: {
            pageTitle: "智游旅行 - 旅游路线推荐系统",
            brand: "智游旅行",
            heroEyebrow: "开启你的下一段旅程",
            title: "你的旅行，我来规划",
            subtitle: "输入你的旅行需求，生成专属旅游攻略",
            tagRegions: "45 个地区",
            tagLanguages: "中 / 韩 / 英",
            tagTimeline: "智能行程时间线",
            plannerHeading: "计划你的旅行",
            plannerDescription: "填写旅行需求，生成每日安排",
            destinationTitle: "你想去哪里？",
            destinationPlaceholder: "请输入城市，例如：南京",
            destinationHint: "可输入中文、韩文或英文城市名",
            daysTitle: "你想去多久？",
            days: ["2天", "3天", "4天", "5天"],
            tripStartDateTitle: "旅行开始日期",
            tripStartDateHint: "用于判断当前是行程第几天，以免跨天提醒错位。",
            budgetTitle: "旅行预算",
            budgetPlaceholder: "请输入预算，例如：2000",
            currency: "元",
            peopleTitle: "同行人数",
            people: ["1人", "2人", "3人", "4人"],
            preferenceTitle: "旅行偏好",
            preferences: ["吃吃喝喝", "逛街购物", "历史古建", "自然风光", "拍照出片", "文艺展览"],
            planButton: "智能规划",
            privacyNote: "路线及时间为规划参考；出发前请核对地图、开放时间和交通信息。",
            resultsEyebrow: "你的旅行安排",
            resultsHeading: "旅游攻略",
            emptyTitle: "你的旅程即将开始",
            emptyDescription: "选择目的地、天数和人数后，生成专属旅游攻略。",
            saveButton: "💾 保存攻略",
            savedTitle: "我的攻略",
            savedDescription: "随时查看之前保存的行程",
            savedEmpty: "暂无保存的攻略",
            daysNotSelected: "尚未选择",
            peopleNotSelected: "尚未选择",
            selectedDays: n => `已选择：${n}天`,
            selectedPeople: n => `已选择：${n}人`,
            footerBrand: "智游旅行",
            footerSlogan: "用心规划 · 畅享旅程",
            languageLabel: "语言选择",
            daysGroup: "旅行天数",
            peopleGroup: "同行人数"
        },

        ko: {
            pageTitle: "여행 플래너 - 여행 경로 추천 시스템",
            brand: "여행 플래너",
            heroEyebrow: "새로운 여행을 시작하세요",
            title: "당신의 여행, 제가 계획해 드립니다",
            subtitle: "여행 정보를 입력하고 나만의 여행 가이드를 만들어보세요",
            tagRegions: "45개 지역",
            tagLanguages: "중국어 / 한국어 / 영어",
            tagTimeline: "스마트 일정표",
            plannerHeading: "여행 계획하기",
            plannerDescription: "여행 정보를 입력하고 일정을 만들어보세요",
            destinationTitle: "어디로 여행하고 싶나요?",
            destinationPlaceholder: "도시를 입력하세요. 예: 난징",
            destinationHint: "중국어, 한국어 또는 영어 도시명을 입력할 수 있습니다",
            daysTitle: "며칠 동안 여행하시나요?",
            days: ["2일", "3일", "4일", "5일"],
            tripStartDateTitle: "여행 시작일",
            tripStartDateHint: "여행 날짜를 기준으로 오늘의 일정만 알림을 보냅니다.",
            budgetTitle: "여행 예산",
            budgetPlaceholder: "예산을 입력하세요. 예: 2000",
            currency: "위안",
            peopleTitle: "여행 인원",
            people: ["1명", "2명", "3명", "4명"],
            preferenceTitle: "여행 취향",
            preferences: ["맛집 / 음식", "쇼핑", "역사 / 문화", "자연 경관", "사진 명소", "전시 / 예술"],
            planButton: "스마트 일정 만들기",
            privacyNote: "경로와 시간은 참고용입니다. 출발 전에 지도, 운영 시간 및 교통 정보를 확인해 주세요.",
            resultsEyebrow: "나의 여행 일정",
            resultsHeading: "여행 가이드",
            emptyTitle: "여행을 시작해 보세요",
            emptyDescription: "목적지, 여행 일수와 인원을 선택하면 맞춤 일정을 만들 수 있습니다.",
            saveButton: "💾 일정 저장",
            savedTitle: "내 여행 일정",
            savedDescription: "이전에 저장한 여행 일정을 확인하세요",
            savedEmpty: "저장된 일정이 없습니다",
            daysNotSelected: "아직 선택하지 않았습니다",
            peopleNotSelected: "아직 선택하지 않았습니다",
            selectedDays: n => `선택한 기간: ${n}일`,
            selectedPeople: n => `선택한 인원: ${n}명`,
            footerBrand: "여행 플래너",
            footerSlogan: "세심하게 계획하고 즐겁게 여행하세요",
            languageLabel: "언어 선택",
            daysGroup: "여행 기간",
            peopleGroup: "여행 인원"
        },

        en: {
            pageTitle: "Travel Planner - Travel Route Recommendation",
            brand: "Travel Planner",
            heroEyebrow: "YOUR NEXT JOURNEY",
            title: "Your Trip, Planned for You",
            subtitle: "Tell us your travel preferences and create your personalized travel guide",
            tagRegions: "45 Destinations",
            tagLanguages: "Chinese / Korean / English",
            tagTimeline: "Smart Itinerary",
            plannerHeading: "Plan Your Trip",
            plannerDescription: "Enter your travel details to create a daily itinerary",
            destinationTitle: "Where would you like to go?",
            destinationPlaceholder: "Enter a city, e.g. Nanjing",
            destinationHint: "Enter a city name in Chinese, Korean, or English",
            daysTitle: "How long will you stay?",
            days: ["2 days", "3 days", "4 days", "5 days"],
            tripStartDateTitle: "Trip start date",
            tripStartDateHint: "Used to identify the active trip day and avoid alerts for other days.",
            budgetTitle: "Travel Budget",
            budgetPlaceholder: "Enter your budget, e.g. 2000",
            currency: "CNY",
            peopleTitle: "Number of Travelers",
            people: ["1 person", "2 people", "3 people", "4 people"],
            preferenceTitle: "Travel Preferences",
            preferences: ["Food", "Shopping", "History & Architecture", "Nature", "Photography", "Art & Exhibitions"],
            planButton: "Generate Itinerary",
            privacyNote: "Routes and times are estimates. Please verify maps, opening hours, and transport before departure.",
            resultsEyebrow: "YOUR ITINERARY",
            resultsHeading: "Travel Guide",
            emptyTitle: "Your Journey Starts Here",
            emptyDescription: "Choose a destination, trip duration, and group size to create your travel guide.",
            saveButton: "💾 Save Guide",
            savedTitle: "My Travel Guides",
            savedDescription: "View your previously saved itineraries",
            savedEmpty: "No saved guides yet",
            daysNotSelected: "Not selected",
            peopleNotSelected: "Not selected",
            selectedDays: n => `Selected: ${n} days`,
            selectedPeople: n => `Selected: ${n} people`,
            footerBrand: "Travel Planner",
            footerSlogan: "Plan thoughtfully · Travel well",
            languageLabel: "Language",
            daysGroup: "Trip duration",
            peopleGroup: "Number of travelers"
        }
    };

    const t = translations[currentLanguage];

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    document.documentElement.lang =
        currentLanguage === "zh" ? "zh-CN" :
        currentLanguage === "ko" ? "ko" : "en";

    document.title = t.pageTitle;

    setText("brandName", t.brand);
    setText("heroEyebrow", t.heroEyebrow);
    setText("title", t.title);
    setText("subtitle", t.subtitle);

    setText("heroTagRegions", t.tagRegions);
    setText("heroTagLanguages", t.tagLanguages);
    setText("heroTagTimeline", t.tagTimeline);

    setText("plannerHeading", t.plannerHeading);
    setText("plannerDescription", t.plannerDescription);

    setText("destinationTitle", t.destinationTitle);

    const destinationElement = document.getElementById("destination");
    if (destinationElement) {
        destinationElement.placeholder = t.destinationPlaceholder;
    }

    setText("destinationHint", t.destinationHint);
    setText("daysTitle", t.daysTitle);
    setText("tripStartDateTitle", t.tripStartDateTitle);
    setText("tripStartDateHint", t.tripStartDateHint);

    document.querySelectorAll(".days button").forEach((button, index) => {
        if (t.days[index]) button.textContent = t.days[index];
    });

    setText("budgetTitle", t.budgetTitle);

    const budgetElement = document.getElementById("budget");
    if (budgetElement) {
        budgetElement.placeholder = t.budgetPlaceholder;
    }

    const currencyElement = document.querySelector("#budget + span");
    if (currencyElement) currencyElement.textContent = t.currency;

    setText("peopleTitle", t.peopleTitle);

    document.querySelectorAll(".people button").forEach((button, index) => {
        if (t.people[index]) button.textContent = t.people[index];
    });

    setText("preferenceTitle", t.preferenceTitle);

    const preferenceIds = [
        "prefFood",
        "prefShopping",
        "prefHistory",
        "prefNature",
        "prefPhoto",
        "prefCulture"
    ];

    preferenceIds.forEach((id, index) => {
        const span = document.querySelector(`#${id} span`);
        if (span) span.textContent = t.preferences[index];
    });

    setText("planButton", t.planButton);
    setText("privacyNote", t.privacyNote);

    setText("resultsEyebrow", t.resultsEyebrow);
    setText("resultsHeading", t.resultsHeading);
    setText("emptyResultTitle", t.emptyTitle);
    setText("emptyResultDescription", t.emptyDescription);

    setText("saveButton", t.saveButton);
    setText("savedTitle", t.savedTitle);
    setText("savedDescription", t.savedDescription);
    setText("savedEmpty", t.savedEmpty);

    setText(
        "selectedDays",
        selectedDays === 0 ? t.daysNotSelected : t.selectedDays(selectedDays)
    );

    setText(
        "selectedPeople",
        selectedPeople === 0 ? t.peopleNotSelected : t.selectedPeople(selectedPeople)
    );

    const languageNav = document.querySelector(".language-switch");
    if (languageNav) languageNav.setAttribute("aria-label", t.languageLabel);

    const daysGroup = document.querySelector(".choice-row.days");
    if (daysGroup) daysGroup.setAttribute("aria-label", t.daysGroup);

    const peopleGroup = document.querySelector(".choice-row.people");
    if (peopleGroup) peopleGroup.setAttribute("aria-label", t.peopleGroup);

    setText("footerBrand", t.footerBrand);
    setText("footerSlogan", t.footerSlogan);

    // 刷新路线模式与自定义景点列表的语言
    updateRouteModeLabels();
    if (routeMode === "custom") renderCustomAttractionPicker();

    // 刷新定位卡片，使定位标题、状态、按钮同步切换语言
    renderLiveLocationPanel();

    // 刷新已保存攻略
    renderSavedList();

    // 如果当前已经生成攻略，重新生成以更新攻略内部的语言
    if (
        hasGeneratedPlan &&
        destinationElement &&
        destinationElement.value.trim() &&
        selectedDays &&
        selectedPeople
    ) {
        generatePlan(true);
    }

    updateLiveLocationButton();
}

// ==========================================
// 实时定位：自动监听当前位置
// ==========================================

let liveLocationWatchId = null;
let liveCurrentPosition = null;

function getLocationText(type) {
    const messages = {
        zh: {
            title: "📍 实时位置追踪",
            panelTitle: "实时位置",
            on: "追踪中",
            off: "未开启",
            start: "开启自动定位",
            stop: "暂停定位",
            waiting: "等待开启定位",
            locating: "正在获取当前位置……",
            success: "定位成功，正在自动监听位置变化",
            denied: "定位权限被拒绝，请在浏览器设置中允许定位",
            unavailable: "暂时无法获取位置信息，请检查设备定位",
            timeout: "定位超时，请稍后重试",
            unsupported: "当前浏览器不支持定位功能",
            current: "当前位置",
            accuracy: "定位精度",
            updated: "最后更新时间",
            next: "下一个游玩点",
            emptyNext: "生成攻略后，这里会显示下一处景点",
            viewNext: "查看景点攻略 →",
            tracking: "追踪中"
        },
        ko: {
            title: "📍 실시간 위치 추적",
            panelTitle: "실시간 위치",
            on: "추적 중",
            off: "꺼짐",
            start: "자동 위치 추적 시작",
            stop: "위치 추적 일시 중지",
            waiting: "위치 추적을 시작해 주세요",
            locating: "현재 위치를 확인하는 중…",
            success: "위치 확인 완료 · 자동으로 위치를 추적합니다",
            denied: "위치 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요",
            unavailable: "위치를 확인할 수 없습니다. 기기 위치 설정을 확인해 주세요",
            timeout: "위치 확인 시간이 초과되었습니다. 다시 시도해 주세요",
            unsupported: "이 브라우저는 위치 기능을 지원하지 않습니다",
            current: "현재 위치",
            accuracy: "위치 정확도",
            updated: "마지막 업데이트",
            next: "다음 관광지",
            emptyNext: "여행 계획을 생성하면 다음 관광지가 표시됩니다",
            viewNext: "관광지 일정 보기 →",
            tracking: "추적 중"
        },
        en: {
            title: "📍 Live Location Tracking",
            panelTitle: "Live location",
            on: "Tracking",
            off: "Paused",
            start: "Start automatic tracking",
            stop: "Pause tracking",
            waiting: "Waiting to start location tracking",
            locating: "Getting your current location…",
            success: "Location acquired · Automatically tracking changes",
            denied: "Location permission denied. Allow location access in browser settings",
            unavailable: "Unable to get location. Check your device location settings",
            timeout: "Location request timed out. Please try again",
            unsupported: "This browser does not support geolocation",
            current: "Current location",
            accuracy: "Accuracy",
            updated: "Last updated",
            next: "Next Attraction",
            emptyNext: "Your next attraction will appear after generating a plan",
            viewNext: "View Attraction Guide →",
            tracking: "Tracking"
        }
    };

    return messages[currentLanguage] || messages.zh;
}

// ==========================================
// 实时定位面板：固定放在页面顶部
// ==========================================
// ==========================================
// 紧凑型实时旅程卡片
// ==========================================

function renderLiveLocationPanel() {
    const topContainer = document.getElementById("liveLocationTop");
    if (!topContainer) return;

    let panel = document.getElementById("liveLocationPanel");

    if (!panel) {
        panel = document.createElement("section");
        panel.id = "liveLocationPanel";
        topContainer.appendChild(panel);
    } else if (panel.parentElement !== topContainer) {
        topContainer.appendChild(panel);
    }

    const t = getLocationText();

    const L = {
    tracking: t.panelTitle,
    on: t.on,
    off: t.off,
    next: t.next,
    empty: t.emptyNext,
    view: t.viewNext,
    accuracy: t.accuracy,
    updated: t.updated
};

    // 从当前攻略中读取第一处真实景点
    const result = document.getElementById("result");

    const nextPlace = result
        ? Array.from(result.querySelectorAll(".day-card .place"))
            .find(place => place.querySelector("figure"))
        : null;

    let nextName = "";
    let nextTime = "";
    let nextDescription = "";

    if (nextPlace) {
        const titles = nextPlace.querySelectorAll(".place-title");
        const infos = nextPlace.querySelectorAll(".place-info");

        nextName = titles[1]?.textContent.trim()
            || titles[0]?.textContent.trim()
            || "";

        nextTime = infos[0]?.textContent.trim() || "";
        nextDescription = infos[1]?.textContent.trim() || "";

        nextPlace.id = "liveNextAttractionTarget";
    }

    const positionText = liveCurrentPosition
        ? `${liveCurrentPosition.latitude.toFixed(6)}, ${liveCurrentPosition.longitude.toFixed(6)}`
        : t.waiting;

    const accuracyText = liveCurrentPosition
        ? `${L.accuracy}：约 ${Math.round(liveCurrentPosition.accuracy)} 米`
        : "";

    const updatedText = liveCurrentPosition
        ? `${L.updated}：${new Date(liveCurrentPosition.timestamp).toLocaleTimeString()}`
        : "";

    panel.innerHTML = `
        <div class="live-location-head">
            <div class="live-location-heading">
                <span class="live-location-icon">📍</span>
                <span>${L.tracking}</span>
            </div>

           <span class="live-location-state" id="liveLocationState">
    ${liveLocationWatchId !== null ? L.on : L.off}
</span> 
        </div>

        <div id="liveLocationStatus" class="live-location-details">
            ${liveCurrentPosition ? t.success : t.waiting}
        </div>

        <div id="liveLocationDetails" class="live-location-details">
            ${liveCurrentPosition
                ? `${t.current}：${positionText} ｜ ${accuracyText} ｜ ${updatedText}`
                : ""}
        </div>

        <div class="live-location-actions">
            <span class="live-location-details" id="liveLocationGpsState">
    GPS · ${liveLocationWatchId !== null ? "ON" : "OFF"}
</span>

            <button
                type="button"
                id="liveLocationButton"
                class="live-location-button"
                onclick="toggleLiveLocation()"
            >
                ${liveLocationWatchId === null ? t.start : t.stop}
            </button>
        </div>

        <div class="live-next-stop">
            <div class="live-next-label">🧭 ${L.next}</div>

            <div class="live-next-name">
                ${nextName ? escapeHTML(nextName) : L.empty}
            </div>

            ${nextTime ? `
                <div class="live-next-info">
                    ${escapeHTML(nextTime)}
                </div>
            ` : ""}

            ${nextDescription ? `
                <div class="live-next-info">
                    ${escapeHTML(nextDescription)}
                </div>
            ` : ""}

            ${nextName ? `
                <a
                    href="#liveNextAttractionTarget"
                    class="live-next-link"
                    onclick="document.getElementById('liveNextAttractionTarget')?.scrollIntoView({behavior:'smooth',block:'center'}); return false;"
                >
                    ${L.view}
                </a>
            ` : ""}
        </div>
    `;
}

function updateLiveLocationStatus(message, details = "") {
    const status = document.getElementById("liveLocationStatus");
    const detailsElement = document.getElementById("liveLocationDetails");

    if (status) status.textContent = message;
    if (detailsElement) detailsElement.textContent = details;
}

function startLiveLocation() {
    const t = getLocationText();

    if (!navigator.geolocation) {
        updateLiveLocationStatus(t.unsupported);
        return;
    }

    if (liveLocationWatchId !== null) return;

    updateLiveLocationStatus(t.locating);

    liveLocationWatchId = navigator.geolocation.watchPosition(
        function (position) {
            const liveText = getLocationText();
            liveCurrentPosition = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
            };

            const updatedTime = new Date(position.timestamp)
                .toLocaleTimeString();

            const details = [
              `${liveText.current}：${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
              `${liveText.accuracy}：${Math.round(position.coords.accuracy)} 米`,
              `${liveText.updated}：${new Date().toLocaleTimeString()}`
            ].join(" ｜ ");

            updateLiveLocationStatus(liveText.success, details);
            updateLiveLocationButton();
        },
        function (error) {
    const liveText = getLocationText();
    let message = liveText.unavailable;

    if (error.code === 1) message = liveText.denied;
    if (error.code === 2) message = liveText.unavailable;
    if (error.code === 3) message = liveText.timeout;

            updateLiveLocationStatus(message);

            if (liveLocationWatchId !== null) {
                navigator.geolocation.clearWatch(liveLocationWatchId);
                liveLocationWatchId = null;
            }

            updateLiveLocationButton();
        },
        {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 20000
        }
    );

    updateLiveLocationButton();
}

function stopLiveLocation() {
    if (liveLocationWatchId !== null) {
        navigator.geolocation.clearWatch(liveLocationWatchId);
        liveLocationWatchId = null;
    }

    updateLiveLocationStatus(getLocationText().waiting);
    updateLiveLocationButton();
}

function updateLiveLocationButton() {
    const button = document.getElementById("liveLocationButton");
    const state = document.getElementById("liveLocationState");
    const gpsState = document.getElementById("liveLocationGpsState");

    const t = getLocationText();
    const isTracking = liveLocationWatchId !== null;

    // 同步更新按钮
    if (button) {
        button.textContent = isTracking ? t.stop : t.start;
    }

    // 同步更新顶部定位状态
    if (state) {
        state.textContent = isTracking ? t.on : t.off;
    }

    // 同步更新 GPS 状态
    if (gpsState) {
        gpsState.textContent = isTracking ? "GPS · ON" : "GPS · OFF";
    }
}

function toggleLiveLocation() {
    if (liveLocationWatchId === null) {
        startLiveLocation();
    } else {
        stopLiveLocation();
    }
}

// -------------------------
// 页面初始化
// -------------------------
function initializeTravelGuide() {
    renderLiveLocationPanel();
    renderSavedList();
    updateRouteModeLabels();
    const destinationInput = document.getElementById("destination");
    if (destinationInput) {
        destinationInput.addEventListener("input", () => {
            if (routeMode === "custom") renderCustomAttractionPicker();
        });
    }
}

document.addEventListener("DOMContentLoaded", initializeTravelGuide);

// PWA：仅在 HTTPS 或 localhost 环境注册 Service Worker
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(error => {
            console.warn("Service worker registration failed:", error);
        });
    });
}
