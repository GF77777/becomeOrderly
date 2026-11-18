<template>
	<view class="container">
		<view class="header">
			<text class="title">四象限时间管理</text>
			<text class="subtitle">让你的时间更有序</text>
		</view>

		<stats-card
			:total="store.stats.total"
			:completed="store.stats.completed"
			:pending="store.stats.pending"
		/>

		<view class="quadrant">
			<view class="axis-y">
				<text class="axis-label-y">重要</text>
			</view>
			<view class="axis-x">
				<text class="axis-label-x">紧急</text>
			</view>

			<view class="quadrant-grid">
				<quadrant-cell
					v-for="quadrant in QUADRANTS"
					:key="quadrant.key"
					:quadrant="quadrant"
					:events="store.byQuadrant[quadrant.key] || []"
					@open-quadrant="goToDetail"
					@open-event="goToEventDetail"
				/>
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
			<add-task-input
				v-model="uncategorizedInput"
				placeholder="添加待归类事件"
				@confirm="addUncategorizedEvent"
			/>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { useEventStore } from '@/store/event'
import { QUADRANTS } from '@/constants/quadrants'
import StatsCard from '@/components/stats-card.vue'
import QuadrantCell from '@/components/quadrant-cell.vue'
import AddTaskInput from '@/components/add-task-input.vue'

const store = useEventStore()
const uncategorizedInput = ref('')

function goToEventDetail(eventId) {
	uni.navigateTo({
		url: `/pages/event-detail/event-detail?id=${eventId}`
	})
}

function goToDetail(quadrantKey) {
	// 原 selectedQuadrant storage 传参改为 store 内部信号，detail onShow 消费
	store.pendingQuadrant = quadrantKey
	uni.switchTab({
		url: '/pages/detail/detail'
	})
}

function addUncategorizedEvent() {
	if (!uncategorizedInput.value.trim()) return
	store.addEvent({
		name: uncategorizedInput.value.trim(),
		importance: null,
		urgency: null
	})
	uncategorizedInput.value = ''
	uni.showToast({ title: '添加成功', icon: 'success' })
}
</script>

<style>
	.container {
		padding: 40rpx;
		min-height: 100vh;
		background: #f5f5f5;
		position: relative;
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
</style>
