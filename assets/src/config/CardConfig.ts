/**
 * 主牌布局配置：key 为卡牌 id（如 card1），仅含位置与覆盖关系；牌面数字由 levelConfigs 提供
 * - id: 序号
 * - pos: [x, y] 在牌桌中的目标坐标
 * - cover: 覆盖当前牌的卡牌 key 数组，空表示无牌压住（正面朝上）
 */
export const cardCfg: Object = {
  "card1": {"id": 1, "pos":[358, 72], "cover": ["card2","card3"]},
  "card2": {"id": 2, "pos":[308, 144], "cover": ["card4","card5"]},
  "card3": {"id": 3, "pos":[408, 144], "cover": ["card5","card6"]},
  "card4": {"id": 4, "pos":[258, 216], "cover": ["card7","card8"]},
  "card5": {"id": 5, "pos":[358, 216], "cover": ["card8","card9"]},
  "card6": {"id": 6, "pos":[458, 216], "cover": ["card9","card10"]},
  "card7": {"id": 7, "pos":[208, 288], "cover": ["card11","card12"]},
  "card8": {"id": 8, "pos":[308, 288], "cover": ["card12","card13"]},
  "card9": {"id": 9, "pos":[408, 288], "cover": ["card13","card14"]},
  "card10": {"id": 10, "pos":[508, 288], "cover": ["card14","card15"]},
  "card11": {"id": 11, "pos":[158, 360], "cover": ["card16","card17"]},
  "card12": {"id": 12, "pos":[258, 360], "cover": ["card17","card18"]},
  "card13": {"id": 13, "pos":[358, 360], "cover": ["card18","card19"]},
  "card14": {"id": 14, "pos":[458, 360], "cover": ["card19","card20"]},
  "card15": {"id": 15, "pos":[558, 360], "cover": ["card20","card21"]},
  "card16": {"id": 16, "pos":[108, 432], "cover": []},
  "card17": {"id": 17, "pos":[208, 432], "cover": []},
  "card18": {"id": 18, "pos":[308, 432], "cover": []},
  "card19": {"id": 19, "pos":[408, 432], "cover": []},
  "card20": {"id": 20, "pos":[508, 432], "cover": []},
  "card21": {"id": 21, "pos":[608, 432], "cover": []}
};

/**
 * 关卡配置数组：每次进入游戏随机选一关
 * 每关包含：
 * - handValue: 初始手牌点数（1-13），与主牌相邻即可消除
 * - cards: 主牌 key（如 card1）-> 牌面数字 1-13 的映射，需与 cardCfg 的 key 一一对应
 */
export const levelConfigs = [
	// 第 1 关 (原关卡，保持不变)
	{
			handValue: 6,
			cards: {
					"card1": 13, "card2": 7, "card3": 8, "card4": 5, "card5": 6,
					"card6": 10, "card7": 12, "card8": 11, "card9": 9, "card10": 8,
					"card11": 9, "card12": 11, "card13": 3, "card14": 7, "card15": 6,
					"card16": 7, "card17": 8, "card18": 10, "card19": 2, "card20": 4, "card21": 5
			}
	},
	// 第 2 关：左下角起手，底排僵局
	// 起手H=9。消除C16(8)->C17(7)，解锁C11(2)。
	// 此时底排剩余牌全是安全牌，没有任何牌能与7匹配 -> 触发第1次洗牌！
	// 之后一路连击到顶层剩C21,C15等，触发第2次洗牌。
	{
			handValue: 9,
			cards: {
					"card1": 13, "card2": 9, "card3": 1, "card4": 9, "card5": 10,
					"card6": 2, "card7": 5, "card8": 2, "card9": 11, "card10": 3,
					"card11": 2, "card12": 4, "card13": 3, "card14": 12, "card15": 4,
					"card16": 8, "card17": 7, "card18": 3, "card19": 4, "card20": 13, "card21": 5
			}
	},
	// 第 3 关：右下角起手，底排僵局
	// 起手H=2。消除C21(3)->C20(4)，解锁C15(9)。
	// 此时底排剩余牌全被锁死避开，没有任何牌能与4匹配 -> 触发第1次洗牌！
	// 之后右向左一路连击至顶层，触发第2次洗牌。
	{
			handValue: 2,
			cards: {
					"card1": 5, "card2": 6, "card3": 3, "card4": 7, "card5": 4,
					"card6": 8, "card7": 8, "card8": 5, "card9": 9, "card10": 12,
					"card11": 9, "card12": 6, "card13": 10, "card14": 11, "card15": 9,
					"card16": 10, "card17": 7, "card18": 11, "card19": 10, "card20": 4, "card21": 3
			}
	},
	// 第 4 关：中间爆破，底排僵局
	// 起手H=10。消除底排中间的C18(11)->C19(12)，解锁倒数第二排的C13(6)。
	// 此时H=12，底排其余明牌为3,5,1,3，完美避开 -> 触发第1次洗牌！
	// 向两边散开消除后，在金字塔上层触发第2次洗牌。
	{
			handValue: 10,
			cards: {
					"card1": 5, "card2": 6, "card3": 7, "card4": 10, "card5": 9,
					"card6": 8, "card7": 1, "card8": 13, "card9": 6, "card10": 5,
					"card11": 2, "card12": 4, "card13": 6, "card14": 2, "card15": 4,
					"card16": 3, "card17": 5, "card18": 11, "card19": 12, "card20": 1, "card21": 3
			}
	},
	// 第 5 关：底部极速阻断，大扫荡
	// 起手H=7。消除最左侧C16(8)->C17(9)，解锁C11(2)。
	// H=9，底排明牌皆不匹配 -> 触发第1次洗牌！
	// 随后开启长达 13 张牌的终极连击横扫版面，最后在塔尖部分触发第2次洗牌。
	{
			handValue: 7,
			cards: {
					"card1": 7, "card2": 6, "card3": 5, "card4": 2, "card5": 3,
					"card6": 4, "card7": 1, "card8": 13, "card9": 12, "card10": 11,
					"card11": 2, "card12": 4, "card13": 6, "card14": 4, "card15": 2,
					"card16": 8, "card17": 9, "card18": 3, "card19": 5, "card20": 5, "card21": 3
			}
	}
];