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
				{{ quadrant.detailLabel }}
				<text class="count">({{ (store.byQuadrant[quadrant.key] || []).length }})</text>
			</view>
			<view class="task-list">
				<task-item
					v-for="task in store.byQuadrant[quadrant.key]"
					:key="task.id"
					:task="task"
					:dragging="isDragging && !!draggingTask && draggingTask.id === task.id"
					@toggle="toggleComplete"
					@delete="confirmDelete"
					@open="goToDetail"
					@drag-start="onDragStart($event, task, quadrant.key)"
					@drag-end="onDragEnd"
					@touch-start="onTouchStart($event, task, quadrant.key)"
					@touch-move="onTouchMove"
					@touch-end="onTouchEnd"
				/>
				<view v-if="!(store.byQuadrant[quadrant.key] || []).length" class="empty-tip">
					<text>暂无任务</text>
				</view>
			</view>
			<add-task-input
				v-model="newTasks[quadrant.key]"
				:placeholder="'添加' + quadrant.detailLabel + '事件'"
				@confirm="addTask(quadrant.key)"
			/>
		</view>
	</view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useEventStore } from '@/store/event'
import { QUADRANTS, UNCATEGORIZED, UNCATEGORIZED_KEY, addDefaults } from '@/constants/quadrants'
import TaskItem from '@/components/task-item.vue'
import AddTaskInput from '@/components/add-task-input.vue'

const store = useEventStore()

const newTasks = reactive({
	importantNotUrgent: '',
	importantUrgent: '',
	notImportantNotUrgent: '',
	notImportantUrgent: '',
	[UNCATEGORIZED_KEY]: ''
})
const currentFilter = ref('all')
const filters = [
	{ key: 'all', label: '全部' },
	{ key: 'importantUrgent', label: '重要紧急' },
	{ key: 'importantNotUrgent', label: '重要不紧急' },
	{ key: 'notImportantUrgent', label: '不重要紧急' },
	{ key: 'notImportantNotUrgent', label: '不重要不紧急' },
	{ key: UNCATEGORIZED_KEY, label: '待归类' }
]

// 象限元数据统一来自 constants（含待归类，与原显示一致）
const ALL_QUADRANTS = [...QUADRANTS, UNCATEGORIZED]
const ALL_QUADRANT_KEYS = ALL_QUADRANTS.map(q => q.key)

// 拖拽状态
const isDragging = ref(false)
const draggingTask = ref(null)
const dragSource = ref(null)
const highlightedQuadrant = ref(null)
// 触摸长按拖拽状态
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchCurrentX = ref(0)
const touchCurrentY = ref(0)
const touchOffsetX = ref(0)
const touchOffsetY = ref(0)
const isTouchDragging = ref(false)
const touchDragThreshold = 10
const dragMirrorVisible = ref(false)
const dragMirrorStyle = ref({})
const longPressTimer = ref(null)
const isLongPress = ref(false)

const quadrants = computed(() => {
	if (currentFilter.value === 'all') {
		return ALL_QUADRANTS
	}
	return ALL_QUADRANTS.filter(q => q.key === currentFilter.value)
})

onShow(() => {
	// 消费 index 页写入的待跳转象限（原 selectedQuadrant storage 传参的替代）
	if (store.pendingQuadrant) {
		currentFilter.value = store.pendingQuadrant
		store.pendingQuadrant = null
	}
})

function setFilter(filterKey) {
	currentFilter.value = filterKey
}

function goToDetail(eventId) {
	uni.navigateTo({
		url: `/pages/event-detail/event-detail?id=${eventId}`
	})
}

function toggleComplete(task) {
	store.toggleEvent(task.id)
}

function addTask(quadrantKey) {
	const input = newTasks[quadrantKey]
	if (!input.trim()) return

	const defaults = addDefaults(quadrantKey) || { importance: null, urgency: null }
	store.addEvent({
		name: input.trim(),
		importance: defaults.importance,
		urgency: defaults.urgency
	})

	newTasks[quadrantKey] = ''
	uni.showToast({
		title: '添加成功',
		icon: 'success'
	})
}

function confirmDelete(task) {
	uni.showModal({
		title: '确认删除',
		content: `确定要删除任务"${task.name}"吗？`,
		success: (res) => {
			if (res.confirm) {
				store.deleteEvent(task.id)
				uni.showToast({
					title: '删除成功',
					icon: 'success'
				})
			}
		}
	})
}

// —— HTML5 拖拽 ——
function onDragStart(event, task, sourceKey) {
	console.log('🚀 拖拽开始:', task.name, '来源:', sourceKey)
	isDragging.value = true
	draggingTask.value = task
	dragSource.value = sourceKey
	highlightedQuadrant.value = null
	// 部分环境（合成拖拽事件）没有 dataTransfer，跳过其设置避免中断拖拽状态
	if (event.dataTransfer) {
		event.dataTransfer.effectAllowed = 'move'
		event.dataTransfer.setData('text/plain', task.id)
	}
}

function onDragOver(event, targetKey) {
	console.log('➡️ 拖拽经过:', targetKey)
	if (isDragging.value && dragSource.value !== targetKey) {
		event.preventDefault()
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move'
		}
		highlightedQuadrant.value = targetKey
	}
}

function onDragEnd() {
	console.log('🛑 拖拽结束')
	isDragging.value = false
	draggingTask.value = null
	dragSource.value = null
	highlightedQuadrant.value = null
}

// —— 触摸长按拖拽 ——
function onTouchStart(event, task, sourceKey) {
	const touch = event.touches[0]
	touchStartX.value = touch.clientX
	touchStartY.value = touch.clientY
	touchCurrentX.value = touch.clientX
	touchCurrentY.value = touch.clientY
	draggingTask.value = task
	dragSource.value = sourceKey
	isTouchDragging.value = false
	isLongPress.value = false
	highlightedQuadrant.value = null

	const target = event.currentTarget
	if (target && target.getBoundingClientRect) {
		const rect = target.getBoundingClientRect()
		touchOffsetX.value = touch.clientX - rect.left
		touchOffsetY.value = touch.clientY - rect.top
	} else {
		touchOffsetX.value = 100
		touchOffsetY.value = 25
	}

	longPressTimer.value = setTimeout(() => {
		isLongPress.value = true
		isTouchDragging.value = true
		isDragging.value = true
		dragMirrorVisible.value = true
		console.log('👆 长按拖拽开始:', draggingTask.value.name)
	}, 300)
}

function onTouchMove(event) {
	const touch = event.touches[0]
	touchCurrentX.value = touch.clientX
	touchCurrentY.value = touch.clientY

	const deltaX = Math.abs(touchCurrentX.value - touchStartX.value)
	const deltaY = Math.abs(touchCurrentY.value - touchStartY.value)

	if (longPressTimer.value && (deltaX > touchDragThreshold || deltaY > touchDragThreshold)) {
		clearTimeout(longPressTimer.value)
		longPressTimer.value = null
	}

	if (isTouchDragging.value) {
		event.preventDefault()
		dragMirrorStyle.value = {
			left: touchCurrentX.value - touchOffsetX.value + 'px',
			top: touchCurrentY.value - touchOffsetY.value + 'px'
		}

		const targetKey = getTargetQuadrantByPosition(touchCurrentX.value, touchCurrentY.value)
		highlightedQuadrant.value = (targetKey && targetKey !== dragSource.value) ? targetKey : null

		scrollPageByTouchPosition(touchCurrentY.value)
	}
}

function onTouchEnd() {
	if (longPressTimer.value) {
		clearTimeout(longPressTimer.value)
		longPressTimer.value = null
	}

	if (!isTouchDragging.value) {
		draggingTask.value = null
		dragSource.value = null
		highlightedQuadrant.value = null
		return
	}

	dragMirrorVisible.value = false
	isTouchDragging.value = false
	isLongPress.value = false

	const targetKey = getTargetQuadrantByPosition(touchCurrentX.value, touchCurrentY.value)

	if (targetKey && targetKey !== dragSource.value) {
		console.log('📦 触摸放置到:', targetKey)
		handleTaskMove(targetKey)
	} else {
		console.log('❌ 触摸放置无效或位置不变')
	}

	isDragging.value = false
	draggingTask.value = null
	dragSource.value = null
	highlightedQuadrant.value = null
}

function scrollPageByTouchPosition(touchY) {
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
}

function getTargetQuadrantByPosition(x, y) {
	try {
		const elements = document.elementsFromPoint(x, y)
		for (const el of elements) {
			if (el.classList && el.classList.contains('section')) {
				const sectionIndex = Array.from(document.querySelectorAll('.section')).indexOf(el)
				if (sectionIndex >= 0) {
					const filteredQuadrants = currentFilter.value === 'all'
						? ALL_QUADRANT_KEYS
						: [currentFilter.value]
					return filteredQuadrants[sectionIndex] || null
				}
			}
		}
	} catch (e) {
		console.error('获取目标象限失败:', e)
	}
	return null
}

function handleTaskMove(targetKey) {
	if (!draggingTask.value || !dragSource.value) return

	const defaults = addDefaults(targetKey) || { importance: null, urgency: null }
	const success = store.updateEvent(draggingTask.value.id, defaults)

	if (success) {
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
}

function onDrop(targetKey) {
	console.log('📦 放置到:', targetKey)
	if (!isDragging.value || !draggingTask.value || dragSource.value === targetKey) {
		console.log('❌ 条件不满足')
		highlightedQuadrant.value = null
		return
	}

	handleTaskMove(targetKey)

	isDragging.value = false
	draggingTask.value = null
	dragSource.value = null
	highlightedQuadrant.value = null
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

	.input-row {
		margin-top: 10rpx;
	}

	.empty-tip {
		text-align: center;
		padding: 40rpx;
		color: #999;
		font-size: 26rpx;
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
