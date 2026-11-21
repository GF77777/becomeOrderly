// 四象限唯一元数据源：所有页面/组件的象限标题、颜色、图标均从此处读取
export const UNCATEGORIZED_KEY = 'uncategorized'

export const QUADRANTS = [
	{
		key: 'importantUrgent',
		shortLabel: '重要紧急', // index 页格标题
		detailLabel: 'I：重要且紧急', // detail 页 section 标题
		label: '重要紧急', // event-detail 页短标签
		color: '#F44336',
		icons: { active: 'static/index/紧急1.png', done: 'static/index/紧急.png' },
		gridClass: 'top-right',
		importance: 'important',
		urgency: 'urgent'
	},
	{
		key: 'importantNotUrgent',
		shortLabel: '重要不紧急',
		detailLabel: 'II：重要但不紧急',
		label: '重要不紧急',
		color: '#FF9800',
		icons: { active: 'static/index/计划1.png', done: 'static/index/计划.png' },
		gridClass: 'top-left',
		importance: 'important',
		urgency: 'notUrgent'
	},
	{
		key: 'notImportantUrgent',
		shortLabel: '不重要紧急',
		detailLabel: 'III：不重要但紧急',
		label: '不重要紧急',
		color: '#2196F3',
		icons: { active: 'static/index/干扰1.png', done: 'static/index/干扰.png' },
		gridClass: 'bottom-right',
		importance: 'notImportant',
		urgency: 'urgent'
	},
	{
		key: 'notImportantNotUrgent',
		shortLabel: '不紧急不重要',
		detailLabel: 'IV：不重要不紧急',
		label: '不重要不紧急',
		color: '#9E9E9E',
		icons: { active: 'static/index/娱乐1.png', done: 'static/index/娱乐.png' },
		gridClass: 'bottom-left',
		importance: 'notImportant',
		urgency: 'notUrgent'
	}
]

// 待归类（无 importance/urgency 的事件）
export const UNCATEGORIZED = {
	key: UNCATEGORIZED_KEY,
	shortLabel: '待归类',
	detailLabel: '待归类',
	label: '待归类',
	color: '#607D8B',
	icons: null,
	gridClass: '',
	importance: null,
	urgency: null
}

export const QUADRANT_BY_KEY = QUADRANTS.reduce((map, q) => {
	map[q.key] = q
	return map
}, { [UNCATEGORIZED_KEY]: UNCATEGORIZED })

// 由 importance/urgency 推出象限短标签（event-detail 用），未知返回「未知」
export function labelFor(importance, urgency) {
	const quadrant = QUADRANTS.find(q => q.importance === importance && q.urgency === urgency)
	return quadrant ? quadrant.label : '未知'
}

// 由象限 key 推出 {importance, urgency}；待归类返回 null（页面按 null 保存）
export function addDefaults(quadrantKey) {
	if (quadrantKey === UNCATEGORIZED_KEY) return null
	const quadrant = QUADRANT_BY_KEY[quadrantKey]
	return quadrant ? { importance: quadrant.importance, urgency: quadrant.urgency } : null
}
