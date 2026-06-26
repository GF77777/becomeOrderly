<template>
	<view class="container">
		<view 
			v-if="dragMirrorVisible && draggingTask" 
			class="drag-mirror"
			:style="dragMirrorStyle"
		>
			<text class="drag-mirror-text">{{ draggingTask.name }}</text>
		</view>
		<view class="filter-bar">
			<view 
				v-for="filter in filters" 
				:key="filter.key" 
				class="filter-item"
				:class="{ active: currentFilter === filter.key }"
				@click="setFilter(filter.key)"
			>
				<text>{{ filter.label }}</text>
			</view>
		</view>
		
		<view 
			v-for="quadrant in quadrants" 
			:key="quadrant.key" 
			class="section"
			:class="{ 
				'drop-target': isDragging && dragSource !== quadrant.key,
				'highlight-target': highlightedQuadrant === quadrant.key 
			}"
			@dragover.prevent="onDragOver($event, quadrant.key)"
			@drop="onDrop(quadrant.key)"
		>
			<view class="section-header" :style="{ color: quadrant.color }">
				{{ quadrant.label }}
				<text class="count">({{ getQuadrantData(quadrant.key).length }})</text>
			</view>
			<view class="task-list">
				<view 
					v-for="(task, index) in getQuadrantData(quadrant.key)" 
					:key="task.id" 
					class="task-item"
					:class="{ completed: task.completed, dragging: isDragging && draggingTask && draggingTask.id === task.id }"
					draggable="true"
					@click="goToDetail(task.id)"
					@dragstart="onDragStart($event, task, quadrant.key)"
					@dragend="onDragEnd"
					@touchstart="onTouchStart($event, task, quadrant.key)"
					@touchmove="onTouchMove($event)"
					@touchend="onTouchEnd($event)"
				>
					<view class="checkbox" @click.stop="toggleComplete(task)" @touchstart.stop>
						<text v-if="task.completed">✓</text>
					</view>
					<text class="task-text">{{ task.name }}</text>
					<view class="task-actions">
						<view class="delete-btn" @click.stop="confirmDelete(task)" @touchstart.stop>
							<text>删除</text>
						</view>
						<text class="drag-icon">⋮⋮</text>
					</view>
				</view>
				<view v-if="getQuadrantData(quadrant.key).length === 0" class="empty-tip">
					<text>暂无任务</text>
				</view>
			</view>
			<view class="input-row">
				<input 
					class="add-input" 
					type="text" 
					:placeholder="'添加' + quadrant.label + '事件'"
					v-model="newTasks[quadrant.key]"
					@confirm="addTask(quadrant.key)"
				/>
				<view class="add-btn" @click="addTask(quadrant.key)">
					<text>添加</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { addEvent, toggleEvent, deleteEvent, getEventByQuadrant, getData } from '@/utils/storage'

export default {
	data() {
			return {
				newTasks: {
					importantNotUrgent: '',
					importantUrgent: '',
					notImportantNotUrgent: '',
					notImportantUrgent: '',
					uncategorized: ''
				},
				currentFilter: 'all',
				taskData: {},
				eventTypes: [],
				filters: [
					{ key: 'all', label: '全部' },
					{ key: 'importantUrgent', label: '重要紧急' },
					{ key: 'importantNotUrgent', label: '重要不紧急' },
					{ key: 'notImportantUrgent', label: '不重要紧急' },
					{ key: 'notImportantNotUrgent', label: '不重要不紧急' },
					{ key: 'uncategorized', label: '待归类' }
				],
				isDragging: false,
				draggingTask: null,
				dragSource: null,
				touchStartX: 0,
				touchStartY: 0,
				touchCurrentX: 0,
				touchCurrentY: 0,
				touchOffsetX: 0,
				touchOffsetY: 0,
				isTouchDragging: false,
				touchDragThreshold: 10,
				dragMirrorVisible: false,
				dragMirrorStyle: {},
				longPressTimer: null,
				isLongPress: false,
				highlightedQuadrant: null
			}
		},
	computed: {
		quadrants() {
			const allQuadrants = [
				{ key: 'importantUrgent', label: 'I：重要且紧急', color: '#F44336' },
				{ key: 'importantNotUrgent', label: 'II：重要但不紧急', color: '#FF9800' },
				{ key: 'notImportantUrgent', label: 'III：不重要但紧急', color: '#2196F3' },
				{ key: 'notImportantNotUrgent', label: 'IV：不重要不紧急', color: '#9E9E9E' },
				{ key: 'uncategorized', label: '待归类', color: '#607D8B' }
			]
			
			if (this.currentFilter === 'all') {
				return allQuadrants
			}
			
			return allQuadrants.filter(q => q.key === this.currentFilter)
		}
	},
	onLoad() {
		this.loadData()
	},
	onShow() {
		this.loadData()
	},
	methods: {
		loadData() {
			this.taskData = getEventByQuadrant()
			this.eventTypes = getData().eventTypes
			const storedQuadrant = uni.getStorageSync('selectedQuadrant')
			if (storedQuadrant) {
				this.currentFilter = storedQuadrant
				uni.removeStorageSync('selectedQuadrant')
			}
		},
		setFilter(filterKey) {
			this.currentFilter = filterKey
		},
		goToDetail(eventId) {
			uni.navigateTo({
				url: `/pages/event-detail/event-detail?id=${eventId}`
			})
		},
		getQuadrantData(key) {
			if (key === 'uncategorized') {
				return getData().events.filter(e => !e.importance || !e.urgency)
			}
			return this.taskData[key] || []
		},
		getTypeName(typeId) {
			const type = this.eventTypes.find(t => t.id === typeId)
			return type ? type.name : '其他'
		},
		getTypeColor(typeId) {
			const type = this.eventTypes.find(t => t.id === typeId)
			return type ? type.color : '#9E9E9E'
		},
		toggleComplete(task) {
			toggleEvent(task.id)
			this.loadData()
		},
		addTask(quadrantKey) {
			const input = this.newTasks[quadrantKey]
			if (!input.trim()) return

			if (quadrantKey === 'uncategorized') {
				addEvent({
					name: input.trim(),
					importance: null,
					urgency: null
				})
			} else {
				const quadrantMap = {
					importantUrgent: { importance: 'important', urgency: 'urgent' },
					importantNotUrgent: { importance: 'important', urgency: 'notUrgent' },
					notImportantUrgent: { importance: 'notImportant', urgency: 'urgent' },
					notImportantNotUrgent: { importance: 'notImportant', urgency: 'notUrgent' }
				}

				const { importance, urgency } = quadrantMap[quadrantKey] || { importance: 'important', urgency: 'notUrgent' }

				addEvent({
					name: input.trim(),
					importance: importance,
					urgency: urgency
				})
			}

			this.newTasks[quadrantKey] = ''
			this.loadData()

			uni.showToast({
				title: '添加成功',
				icon: 'success'
			})
		},
		showTaskMenu(task) {
			uni.showActionSheet({
				itemList: ['删除任务'],
				success: (res) => {
					if (res.tapIndex === 0) {
						this.confirmDelete(task)
					}
				}
			})
		},
		confirmDelete(task) {
			uni.showModal({
				title: '确认删除',
				content: `确定要删除任务"${task.name}"吗？`,
				success: (res) => {
					if (res.confirm) {
						deleteEvent(task.id)
						this.loadData()
						uni.showToast({
							title: '删除成功',
							icon: 'success'
						})
					}
				}
			})
		},
		onDragStart(event, task, sourceKey) {
			console.log('🚀 拖拽开始:', task.name, '来源:', sourceKey)
			this.isDragging = true
			this.draggingTask = task
			this.dragSource = sourceKey
			this.highlightedQuadrant = null
			event.dataTransfer.effectAllowed = 'move'
			event.dataTransfer.setData('text/plain', task.id)
		},
		onDragOver(event, targetKey) {
			console.log('➡️ 拖拽经过:', targetKey)
			if (this.isDragging && this.dragSource !== targetKey) {
				event.preventDefault()
				event.dataTransfer.dropEffect = 'move'
				this.highlightedQuadrant = targetKey
			}
		},
		onDragEnd() {
			console.log('🛑 拖拽结束')
			this.isDragging = false
			this.draggingTask = null
			this.dragSource = null
			this.highlightedQuadrant = null
		},
		onTouchStart(event, task, sourceKey) {
			const touch = event.touches[0]
			this.touchStartX = touch.clientX
			this.touchStartY = touch.clientY
			this.touchCurrentX = touch.clientX
			this.touchCurrentY = touch.clientY
			this.draggingTask = task
			this.dragSource = sourceKey
			this.isTouchDragging = false
			this.isLongPress = false
			this.highlightedQuadrant = null
			
			const target = event.currentTarget
			if (target && target.getBoundingClientRect) {
				const rect = target.getBoundingClientRect()
				this.touchOffsetX = touch.clientX - rect.left
				this.touchOffsetY = touch.clientY - rect.top
			} else {
				this.touchOffsetX = 100
				this.touchOffsetY = 25
			}
			
			this.longPressTimer = setTimeout(() => {
				this.isLongPress = true
				this.isTouchDragging = true
				this.isDragging = true
				this.dragMirrorVisible = true
				console.log('👆 长按拖拽开始:', this.draggingTask.name)
			}, 300)
		},
		onTouchMove(event) {
			const touch = event.touches[0]
			this.touchCurrentX = touch.clientX
			this.touchCurrentY = touch.clientY
			
			const deltaX = Math.abs(this.touchCurrentX - this.touchStartX)
			const deltaY = Math.abs(this.touchCurrentY - this.touchStartY)
			
			if (this.longPressTimer && (deltaX > this.touchDragThreshold || deltaY > this.touchDragThreshold)) {
				clearTimeout(this.longPressTimer)
				this.longPressTimer = null
			}
			
			if (this.isTouchDragging) {
				event.preventDefault()
				this.dragMirrorStyle = {
					left: this.touchCurrentX - this.touchOffsetX + 'px',
					top: this.touchCurrentY - this.touchOffsetY + 'px'
				}
				
				const targetKey = this.getTargetQuadrantByPosition(this.touchCurrentX, this.touchCurrentY)
				this.highlightedQuadrant = (targetKey && targetKey !== this.dragSource) ? targetKey : null
				
				this.scrollPageByTouchPosition(this.touchCurrentY)
			}
		},
		onTouchEnd(event) {
			if (this.longPressTimer) {
				clearTimeout(this.longPressTimer)
				this.longPressTimer = null
			}
			
			if (!this.isTouchDragging) {
				this.draggingTask = null
				this.dragSource = null
				this.highlightedQuadrant = null
				return
			}
			
			this.dragMirrorVisible = false
			this.isTouchDragging = false
			this.isLongPress = false
			
			const targetKey = this.getTargetQuadrantByPosition(this.touchCurrentX, this.touchCurrentY)
			
			if (targetKey && targetKey !== this.dragSource) {
				console.log('📦 触摸放置到:', targetKey)
				this.handleTaskMove(targetKey)
			} else {
				console.log('❌ 触摸放置无效或位置不变')
			}
			
			this.isDragging = false
			this.draggingTask = null
			this.dragSource = null
			this.highlightedQuadrant = null
		},
		scrollPageByTouchPosition(touchY) {
			const screenHeight = window.innerHeight
			const centerY = screenHeight / 2
			const distanceFromCenter = touchY - centerY
			
			if (Math.abs(distanceFromCenter) < 50) return
			
			const scrollSpeed = Math.abs(distanceFromCenter) / centerY * 15
			
			if (distanceFromCenter > 0) {
				window.scrollBy(0, -scrollSpeed)
			} else {
				window.scrollBy(0, scrollSpeed)
			}
		},
		getTargetQuadrantByPosition(x, y) {
			try {
				const elements = document.elementsFromPoint(x, y)
				for (const el of elements) {
					if (el.classList && el.classList.contains('section')) {
						const sectionIndex = Array.from(document.querySelectorAll('.section')).indexOf(el)
						if (sectionIndex >= 0) {
							const filteredQuadrants = this.currentFilter === 'all' 
								? [
									'importantUrgent',
									'importantNotUrgent', 
									'notImportantUrgent',
									'notImportantNotUrgent',
									'uncategorized'
								]
								: [this.currentFilter]
							return filteredQuadrants[sectionIndex] || null
						}
					}
				}
			} catch (e) {
				console.error('获取目标象限失败:', e)
			}
			return null
		},
		handleTaskMove(targetKey) {
			if (!this.draggingTask || !this.dragSource) return
			
			const quadrantMap = {
				importantUrgent: { importance: 'important', urgency: 'urgent' },
				importantNotUrgent: { importance: 'important', urgency: 'notUrgent' },
				notImportantUrgent: { importance: 'notImportant', urgency: 'urgent' },
				notImportantNotUrgent: { importance: 'notImportant', urgency: 'notUrgent' },
				uncategorized: { importance: null, urgency: null }
			}
			
			const { importance, urgency } = quadrantMap[targetKey]
			
			const data = getData()
			const eventIndex = data.events.findIndex(e => e.id === this.draggingTask.id)
			
			if (eventIndex !== -1) {
				data.events[eventIndex].importance = importance
				data.events[eventIndex].urgency = urgency
				uni.setStorageSync('become_orderly_data', JSON.stringify(data))
				
				this.loadData()
				uni.showToast({
					title: '移动成功',
					icon: 'success'
				})
			} else {
				uni.showToast({
					title: '移动失败',
					icon: 'none'
				})
			}
		},
		onDrop(targetKey) {
			console.log('📦 放置到:', targetKey)
			if (!this.isDragging || !this.draggingTask || this.dragSource === targetKey) {
				console.log('❌ 条件不满足')
				this.highlightedQuadrant = null
				return
			}

			const quadrantMap = {
				importantUrgent: { importance: 'important', urgency: 'urgent' },
				importantNotUrgent: { importance: 'important', urgency: 'notUrgent' },
				notImportantUrgent: { importance: 'notImportant', urgency: 'urgent' },
				notImportantNotUrgent: { importance: 'notImportant', urgency: 'notUrgent' },
				uncategorized: { importance: null, urgency: null }
			}

			const { importance, urgency } = quadrantMap[targetKey]

			const data = getData()
			const eventIndex = data.events.findIndex(e => e.id === this.draggingTask.id)

			if (eventIndex !== -1) {
				console.log('✅ 找到任务，更新类型')
				data.events[eventIndex].importance = importance
				data.events[eventIndex].urgency = urgency
				uni.setStorageSync('become_orderly_data', JSON.stringify(data))
				
				this.loadData()
				uni.showToast({
					title: '移动成功',
					icon: 'success'
				})
			} else {
				console.log('❌ 未找到任务:', this.draggingTask.id)
				uni.showToast({
					title: '移动失败',
					icon: 'none'
				})
			}

			this.isDragging = false
			this.draggingTask = null
			this.dragSource = null
			this.highlightedQuadrant = null
		}
	}
}
</script>

<style>
	.container {
		padding: 20rpx;
		min-height: 100vh;
		background: #f5f5f5;
	}

	.filter-bar {
		display: flex;
		gap: 16rpx;
		margin-bottom: 20rpx;
		background: #fff;
		padding: 10rpx;
		border-radius: 8rpx;
	}

	.filter-item {
		flex: 1;
		text-align: center;
		padding: 16rpx;
		border-radius: 8rpx;
		font-size: 28rpx;
		color: #666;
		background: #f5f5f5;
	}

	.filter-item.active {
		background: #4CAF50;
		color: #fff;
	}

	.section {
		background: #fff;
		border-radius: 8rpx;
		padding: 20rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	}

	.section-header {
		font-size: 32rpx;
		font-weight: bold;
		margin-bottom: 20rpx;
		padding-bottom: 10rpx;
		border-bottom: 2rpx solid #eee;
	}

	.count {
		font-size: 24rpx;
		font-weight: normal;
		margin-left: 8rpx;
	}

	.task-list {
		margin-bottom: 16rpx;
	}

	.task-item {
		display: flex;
		align-items: center;
		padding: 16rpx;
		background: #fafafa;
		border-radius: 8rpx;
		margin-bottom: 10rpx;
		cursor: grab;
		transition: all 0.2s ease;
	}

	.task-item:active {
		cursor: grabbing;
	}

	.task-item.completed .task-text {
		text-decoration: line-through;
		color: #999;
	}

	.task-item.dragging {
		opacity: 0.4;
		background: #e8e8e8;
		border: 2rpx dashed #ccc;
	}

	.checkbox {
		width: 40rpx;
		height: 40rpx;
		border: 2rpx solid #ddd;
		border-radius: 8rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
		font-size: 24rpx;
		color: #fff;
		background: #fff;
	}

	.task-item.completed .checkbox {
		background: #4CAF50;
		border-color: #4CAF50;
	}

	.task-text {
		flex: 1;
		font-size: 28rpx;
		color: #333;
	}

	.task-actions {
		display: flex;
		gap: 12rpx;
	}

	.delete-btn {
		padding: 6rpx 16rpx;
		border-radius: 8rpx;
		font-size: 24rpx;
		color: #fff;
		background: #F44336;
	}

	.drag-icon {
		font-size: 32rpx;
		color: #bbb;
		cursor: move;
		padding: 16rpx;
		margin-left: 8rpx;
	}

	.empty-tip {
		text-align: center;
		padding: 40rpx;
		color: #999;
		font-size: 26rpx;
	}

	.input-row {
		display: flex;
		gap: 16rpx;
		margin-top: 10rpx;
	}

	.add-input {
		flex: 1;
		height: 72rpx;
		border: 2rpx solid #eee;
		border-radius: 8rpx;
		padding: 0 20rpx;
		font-size: 28rpx;
		background: #fafafa;
		box-sizing: border-box;
	}

	.add-btn {
		width: 120rpx;
		height: 72rpx;
		background: #4CAF50;
		border-radius: 8rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.add-btn text {
		color: #fff;
		font-size: 28rpx;
	}

	.section.drop-target {
		border: 2rpx dashed #4CAF50;
		background: rgba(76, 175, 80, 0.05);
	}

	.section.highlight-target {
		border: 2rpx solid #4CAF50;
		background: rgba(76, 175, 80, 0.1);
		box-shadow: 0 0 12rpx rgba(76, 175, 80, 0.3);
	}

	.section.highlight-target .section-header {
		color: #4CAF50;
		font-weight: bold;
	}

	.drag-mirror {
		position: fixed;
		z-index: 9999;
		pointer-events: none;
		background: #fff;
		padding: 20rpx 28rpx;
		border-radius: 12rpx;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.25);
		border: 2rpx solid rgba(76, 175, 80, 0.3);
		min-width: 140rpx;
		max-width: 450rpx;
		animation: dragPulse 0.5s ease-in-out infinite;
	}

	@keyframes dragPulse {
		0%, 100% {
			box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.25);
		}
		50% {
			box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.35);
		}
	}

	.drag-mirror-text {
		font-size: 28rpx;
		color: #333;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>