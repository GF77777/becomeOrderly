<template>
	<view class="input-row">
		<input
			class="add-input"
			type="text"
			:placeholder="placeholder"
			:modelValue="modelValue"
			@input="emit('update:modelValue', $event.detail.value)"
			@confirm="emit('confirm')"
		/>
		<view class="add-btn" @click="emit('confirm')">
			<text>添加</text>
		</view>
	</view>
</template>

<script setup>
defineProps({
	modelValue: { type: String, default: '' },
	placeholder: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'confirm'])
</script>

<style scoped>
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
</style>
