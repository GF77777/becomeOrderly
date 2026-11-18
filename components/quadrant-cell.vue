<template>
	<view class="cell" :class="quadrant.gridClass" @click="emit('open-quadrant', quadrant.key)">
		<view v-if="tooltip.show" class="tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
			{{ tooltip.text }}
		</view>
		<view class="cell-header">
			<text class="cell-title">{{ quadrant.shortLabel }}</text>
			<text class="cell-count">{{ events.length }}</text>
		</view>
		<view v-if="events.length > 0" class="dots">
			<image
				v-for="event in events.slice(0, 6)"
				:key="event.id"
				class="dot-icon"
				:class="{ completed: event.completed }"
				:src="event.completed ? quadrant.icons.done : quadrant.icons.active"
				mode="aspectFit"
				:title="event.name"
				@click.stop="emit('open-event', event.id)"
				@mouseenter="showTooltip($event, event.name)"
				@mouseleave="hideTooltip"
			></image>
		</view>
		<view v-else class="empty-cell">
			<text>暂无任务</text>
		</view>
	</view>
</template>

<script setup>
import { reactive } from 'vue'

defineProps({
	quadrant: { type: Object, required: true },
	events: { type: Array, default: () => [] }
})

const emit = defineEmits(['open-quadrant', 'open-event'])

// 悬停任务名提示（原 index 页 tooltip 逻辑内聚到组件内）
const tooltip = reactive({ show: false, text: '', x: 0, y: 0 })

function showTooltip(event, text) {
	tooltip.show = true
	tooltip.text = text
	tooltip.x = event.clientX + 10
	tooltip.y = event.clientY + 10
}

function hideTooltip() {
	tooltip.show = false
}
</script>

<style scoped>
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
</style>
