<template>
	<view class="stats-card">
		<view class="stat-item">
			<text class="stat-value">{{ total }}</text>
			<text class="stat-label">总任务</text>
		</view>
		<view class="stat-divider"></view>
		<view class="stat-item">
			<text class="stat-value completed-value">{{ completed }}</text>
			<text class="stat-label">已完成</text>
		</view>
		<view class="stat-divider"></view>
		<view class="stat-item">
			<text class="stat-value pending-value">{{ pending }}</text>
			<text class="stat-label">待处理</text>
		</view>
	</view>
</template>

<script setup>
defineProps({
	total: { type: Number, default: 0 },
	completed: { type: Number, default: 0 },
	pending: { type: Number, default: 0 }
})
</script>

<style scoped>
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
</style>
