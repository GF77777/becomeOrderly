<template>
	<view
		class="task-item"
		:class="{ completed: task.completed, dragging: dragging }"
		draggable="true"
		@click="emit('open', task.id)"
		@dragstart="emit('drag-start', $event)"
		@dragend="emit('drag-end')"
		@touchstart="emit('touch-start', $event)"
		@touchmove="emit('touch-move', $event)"
		@touchend="emit('touch-end', $event)"
	>
		<view class="checkbox" @click.stop="emit('toggle', task)" @touchstart.stop>
			<text v-if="task.completed">✓</text>
		</view>
		<text class="task-text">{{ task.name }}</text>
		<view class="task-actions">
			<view class="delete-btn" @click.stop="emit('delete', task)" @touchstart.stop>
				<text>删除</text>
			</view>
			<text class="drag-icon">⋮⋮</text>
		</view>
	</view>
</template>

<script setup>
defineProps({
	task: { type: Object, required: true },
	dragging: { type: Boolean, default: false }
})

const emit = defineEmits([
	'toggle',
	'delete',
	'open',
	'drag-start',
	'drag-end',
	'touch-start',
	'touch-move',
	'touch-end'
])
</script>

<style scoped>
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
</style>
