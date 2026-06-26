<template>
	<view class="container">
		<view v-if="tooltip.show" class="tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
			{{ tooltip.text }}
		</view>
		<view class="header">
			<text class="title">四象限时间管理</text>
			<text class="subtitle">让你的时间更有序</text>
		</view>

		<view class="stats-card">
			<view class="stat-item">
				<text class="stat-value">{{ totalTasks }}</text>
				<text class="stat-label">总任务</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-value completed-value">{{ completedCount }}</text>
				<text class="stat-label">已完成</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-value pending-value">{{ pendingCount }}</text>
				<text class="stat-label">待处理</text>
			</view>
		</view>

		<view class="quadrant">
			<view class="axis-y">
				<text class="axis-label-y">重要</text>
			</view>
			<view class="axis-x">
				<text class="axis-label-x">紧急</text>
			</view>

			<view class="quadrant-grid">
				<view class="cell top-right" @click="goToDetail('importantUrgent')">
					<view class="cell-header">
						<text class="cell-title">重要紧急</text>
						<text class="cell-count">{{ quadrantData.importantUrgent.length }}</text>
					</view>
					<view class="dots" v-if="quadrantData.importantUrgent.length > 0">
						<image 
							v-for="(event, index) in quadrantData.importantUrgent.slice(0, 6)" 
							:key="event.id" 
							class="dot-icon"
							:class="{ completed: event.completed }"
							:src="event.completed ? '/static/index/紧急.png' : '/static/index/紧急1.png'"
							mode="aspectFit"
							:title="event.name"
							@click.stop="goToEventDetail(event.id)"
							@mouseenter="showTooltip($event, event.name)"
							@mouseleave="hideTooltip"
						></image>
					</view>
					<view class="empty-cell" v-else>
						<text>暂无任务</text>
					</view>
				</view>
				<view class="cell top-left" @click="goToDetail('importantNotUrgent')">
					<view class="cell-header">
						<text class="cell-title">重要不紧急</text>
						<text class="cell-count">{{ quadrantData.importantNotUrgent.length }}</text>
					</view>
					<view class="dots" v-if="quadrantData.importantNotUrgent.length > 0">
						<image 
							v-for="(event, index) in quadrantData.importantNotUrgent.slice(0, 6)" 
							:key="event.id" 
							class="dot-icon"
							:class="{ completed: event.completed }"
							:src="event.completed ? '/static/index/计划.png' : '/static/index/计划1.png'"
							mode="aspectFit"
							:title="event.name"
							@click.stop="goToEventDetail(event.id)"
							@mouseenter="showTooltip($event, event.name)"
							@mouseleave="hideTooltip"
						></image>
					</view>
					<view class="empty-cell" v-else>
						<text>暂无任务</text>
					</view>
				</view>
				<view class="cell bottom-right" @click="goToDetail('notImportantUrgent')">
					<view class="cell-header">
						<text class="cell-title">不紧急重要</text>
						<text class="cell-count">{{ quadrantData.notImportantUrgent.length }}</text>
					</view>
					<view class="dots" v-if="quadrantData.notImportantUrgent.length > 0">
						<image 
							v-for="(event, index) in quadrantData.notImportantUrgent.slice(0, 6)" 
							:key="event.id" 
							class="dot-icon"
							:class="{ completed: event.completed }"
							:src="event.completed ? '/static/index/干扰.png' : '/static/index/干扰1.png'"
							mode="aspectFit"
							:title="event.name"
							@click.stop="goToEventDetail(event.id)"
							@mouseenter="showTooltip($event, event.name)"
							@mouseleave="hideTooltip"
						></image>
					</view>
					<view class="empty-cell" v-else>
						<text>暂无任务</text>
					</view>
				</view>
				<view class="cell bottom-left" @click="goToDetail('notImportantNotUrgent')">
					<view class="cell-header">
						<text class="cell-title">不紧急不重要</text>
						<text class="cell-count">{{ quadrantData.notImportantNotUrgent.length }}</text>
					</view>
					<view class="dots" v-if="quadrantData.notImportantNotUrgent.length > 0">
						<image 
							v-for="(event, index) in quadrantData.notImportantNotUrgent.slice(0, 6)" 
							:key="event.id" 
							class="dot-icon"
							:class="{ completed: event.completed }"
							:src="event.completed ? '/static/index/娱乐.png' : '/static/index/娱乐1.png'"
							mode="aspectFit"
							:title="event.name"
							@click.stop="goToEventDetail(event.id)"
							@mouseenter="showTooltip($event, event.name)"
							@mouseleave="hideTooltip"
						></image>
					</view>
					<view class="empty-cell" v-else>
						<text>暂无任务</text>
					</view>
				</view>
			</view>
		</view>

		<view class="legend">
			<view class="legend-item">
				<image class="legend-icon" src="/static/index/方块1.png" mode="aspectFit" />
				<text>进行中</text>
			</view>
			<view class="legend-item">
				<image class="legend-icon completed" src="/static/index/方块.png" mode="aspectFit" />
				<text>已完成</text>
			</view>
		</view>

		<view class="uncategorized-section">
			<view class="section-header">
				<text class="section-title">待归类事件</text>
			</view>
			<view class="input-row">
				<input 
					class="add-input" 
					type="text" 
					placeholder="添加待归类事件"
					v-model="uncategorizedInput"
					@confirm="addUncategorizedEvent"
				/>
				<view class="add-btn" @click="addUncategorizedEvent">
					<text>添加</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getEventByQuadrant, getData, addEvent } from '@/utils/storage'

export default {
	data() {
		return {
			quadrantData: {},
			totalTasks: 0,
			completedCount: 0,
			pendingCount: 0,
			uncategorizedInput: '',
			tooltip: {
				show: false,
				text: '',
				x: 0,
				y: 0
			}
		}
	},
	onShow() {
		this.loadData()
	},
	methods: {
		loadData() {
			this.quadrantData = getEventByQuadrant()
			const allEvents = getData().events
			this.totalTasks = allEvents.length
			this.completedCount = allEvents.filter(e => e.completed).length
			this.pendingCount = this.totalTasks - this.completedCount
		},
		goToEventDetail(eventId) {
			uni.navigateTo({
				url: `/pages/event-detail/event-detail?id=${eventId}`
			})
		},
		goToDetail(quadrantKey) {
			uni.setStorageSync('selectedQuadrant', quadrantKey)
			uni.switchTab({
				url: '/pages/detail/detail'
			})
		},
		addUncategorizedEvent() {
			if (!this.uncategorizedInput.trim()) return
			addEvent({
				name: this.uncategorizedInput.trim(),
				importance: null,
				urgency: null
			})
			this.uncategorizedInput = ''
			this.loadData()
			uni.showToast({ title: '添加成功', icon: 'success' })
		},
		showTooltip(event, text) {
			this.tooltip = {
				show: true,
				text: text,
				x: event.clientX + 10,
				y: event.clientY + 10
			}
		},
		hideTooltip() {
			this.tooltip.show = false
		}
	}
}
</script>

<style>
	.container {
		padding: 40rpx;
		min-height: 100vh;
		background: #f5f5f5;
		position: relative;
	}

	.tooltip {
		position: fixed;
		background: rgba(0, 0, 0, 0.8);
		color: #fff;
		padding: 10rpx 20rpx;
		border-radius: 8rpx;
		font-size: 24rpx;
		z-index: 9999;
		white-space: nowrap;
		pointer-events: none;
	}

	.header {
		margin-bottom: 30rpx;
		text-align: center;
	}

	.title {
		display: block;
		font-size: 44rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 10rpx;
		text-align: center;
	}

	.subtitle {
		font-size: 28rpx;
		color: #666;
		text-align: center;
	}

	.stats-card {
		display: flex;
		align-items: center;
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}

	.stat-item {
		flex: 1;
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 48rpx;
		font-weight: bold;
		color: #333;
	}

	.completed-value {
		color: #4CAF50;
	}

	.pending-value {
		color: #FF9800;
	}

	.stat-label {
		font-size: 24rpx;
		color: #999;
	}

	.stat-divider {
		width: 2rpx;
		height: 60rpx;
		background: #eee;
	}

	.quadrant {
		position: relative;
		width: 100%;
		height: 500rpx;
		border: 2rpx solid #ddd;
		border-radius: 20rpx;
		background: #fff;
		overflow: hidden;
		margin-bottom: 30rpx;
	}

	.axis-y {
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 2rpx;
		background: #ccc;
		transform: translateX(-50%);
	}

	.axis-label-y {
		position: absolute;
		top: 20rpx;
		left: 50%;
		transform: translateX(-50%) rotate(-90deg);
		font-size: 24rpx;
		color: #666;
		white-space: nowrap;
	}

	.axis-x {
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 2rpx;
		background: #ccc;
		transform: translateY(-50%);
	}

	.axis-label-x {
		position: absolute;
		bottom: 20rpx;
		left: 20rpx;
		font-size: 24rpx;
		color: #666;
	}

	.quadrant-grid {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
	}

	.cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		position: relative;
		padding: 20rpx;
	}

	.top-right {
		background: rgba(244, 67, 54, 0.08);
	}

	.top-left {
		background: rgba(255, 152, 0, 0.08);
	}

	.bottom-right {
		background: rgba(33, 150, 243, 0.08);
	}

	.bottom-left {
		background: rgba(158, 158, 158, 0.08);
	}

	.cell-header {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.cell-title {
		font-size: 24rpx;
		color: #666;
	}

	.cell-count {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		margin-left: 10rpx;
	}

	.dots {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
		justify-content: center;
		padding: 0 20rpx;
	}

	.dot-icon {
		width: 36rpx;
		height: 36rpx;
	}

	.dot-icon.completed {
		opacity: 0.5;
	}

	.empty-cell {
		font-size: 24rpx;
		color: #999;
	}

	.legend {
		display: flex;
		justify-content: center;
		gap: 40rpx;
		padding: 20rpx;
		background: #fff;
		border-radius: 16rpx;
	}

	.legend-item {
		display: flex;
		align-items: center;
		font-size: 24rpx;
		color: #666;
	}

	.legend-icon {
		width: 32rpx;
		height: 32rpx;
		margin-right: 12rpx;
	}

	.legend-icon.completed {
		opacity: 0.5;
	}

	.uncategorized-section {
		margin-top: 30rpx;
		background: #fff;
		border-radius: 16rpx;
		padding: 20rpx;
	}

	.section-header {
		margin-bottom: 16rpx;
	}

	.section-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
	}

	.input-row {
		display: flex;
		gap: 16rpx;
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

	.uncategorized-list {
		margin-bottom: 10rpx;
	}

	.uncategorized-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.uncategorized-item:last-child {
		border-bottom: none;
	}

	.event-name {
		font-size: 28rpx;
		color: #333;
		flex: 1;
	}

	.event-actions {
		margin-left: 20rpx;
	}

	.delete-icon {
		font-size: 36rpx;
		color: #999;
		padding: 0 10rpx;
	}

	.empty-tip {
		font-size: 26rpx;
		color: #999;
		text-align: center;
		padding: 20rpx 0;
	}
</style>