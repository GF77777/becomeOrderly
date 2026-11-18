import { defineStore } from 'pinia'
import { getData, saveData, defaultData, importData as importStorageData } from '@/utils/storage'
import { QUADRANTS, UNCATEGORIZED_KEY } from '@/constants/quadrants'

// 事件数据 store：初始化时从 storage 读入一次，之后所有变更同步写穿到 storage（key/结构不变）
export const useEventStore = defineStore('event', {
	state: () => {
		const data = getData()
		return {
			events: data.events,
			eventTypes: data.eventTypes,
			// 替代原 selectedQuadrant storage 传参：index 跳转前写入，detail onShow 读取并清空
			pendingQuadrant: null
		}
	},
	getters: {
		// 按象限一次性分组（含待归类），替代 getEventByQuadrant + 各页内联过滤
		byQuadrant(state) {
			const result = {}
			QUADRANTS.forEach(q => {
				result[q.key] = []
			})
			result[UNCATEGORIZED_KEY] = []
			state.events.forEach(event => {
				const quadrant = QUADRANTS.find(
					q => q.importance === event.importance && q.urgency === event.urgency
				)
				if (quadrant) {
					result[quadrant.key].push(event)
				} else {
					result[UNCATEGORIZED_KEY].push(event)
				}
			})
			return result
		},
		// index 与 personal 共用的统计
		stats(state) {
			const total = state.events.length
			const completed = state.events.filter(e => e.completed).length
			const pending = total - completed
			return {
				total,
				completed,
				pending,
				completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
			}
		},
		// personal 各象限计数（由 byQuadrant 派生，不再重复过滤）
		quadrantCounts() {
			const grouped = this.byQuadrant
			const counts = {}
			QUADRANTS.forEach(q => {
				counts[q.key] = grouped[q.key].length
			})
			return counts
		},
		byId(state) {
			return id => state.events.find(e => e.id === id)
		}
	},
	actions: {
		persist() {
			saveData({ events: this.events, eventTypes: this.eventTypes })
		},
		addEvent(event) {
			const newEvent = {
				id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
				name: event.name,
				typeId: event.typeId || 'type1',
				importance: event.importance !== undefined ? event.importance : 'important',
				urgency: event.urgency !== undefined ? event.urgency : 'notUrgent',
				completed: false,
				createdAt: new Date().toISOString(),
				completedAt: null
			}
			this.events.push(newEvent)
			this.persist()
			return newEvent
		},
		toggleEvent(eventId) {
			const event = this.events.find(e => e.id === eventId)
			if (!event) return false
			event.completed = !event.completed
			event.completedAt = event.completed ? new Date().toISOString() : null
			this.persist()
			return true
		},
		deleteEvent(eventId) {
			this.events = this.events.filter(e => e.id !== eventId)
			this.persist()
			return true
		},
		updateEvent(eventId, updates) {
			const event = this.events.find(e => e.id === eventId)
			if (!event) return false
			Object.assign(event, updates)
			this.persist()
			return true
		},
		// 委托 storage.importData 做解析校验并落盘，成功后把 storage 数据刷回 state
		importData(jsonString) {
			const result = importStorageData(jsonString)
			if (result.success) {
				const data = getData()
				this.events = data.events
				this.eventTypes = data.eventTypes
			}
			return result
		},
		clearAll() {
			this.events = defaultData.events
			this.eventTypes = defaultData.eventTypes
			this.persist()
			return true
		},
		exportData() {
			return JSON.stringify({ events: this.events, eventTypes: this.eventTypes }, null, 2)
		}
	}
})
