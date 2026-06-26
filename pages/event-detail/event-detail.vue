<template>
	<view class="container">
		<view class="header">
			<view class="back-btn" @click="goBack">
				<text>← 返回</text>
			</view>
			<text class="title">事件详情</text>
			<view class="placeholder"></view>
		</view>
		
		<view class="detail-card" v-if="event">
			<view class="detail-item">
				<text class="label">事件名称</text>
				<text class="value">{{ event.name }}</text>
			</view>
			
			<view class="detail-item">
				<text class="label">状态</text>
				<view class="status-badge" :class="{ completed: event.completed }">
					{{ event.completed ? '已完成' : '进行中' }}
				</view>
			</view>
			
			<view class="detail-item">
				<text class="label">分类</text>
				<text class="value">{{ getQuadrantLabel(event.importance, event.urgency) }}</text>
			</view>
			
			<view class="detail-item">
				<text class="label">创建时间</text>
				<text class="value">{{ formatDate(event.createdAt) }}</text>
			</view>
			
			<view class="detail-item">
				<text class="label">需完成时间</text>
				<text class="value">{{ event.dueDate ? formatDate(event.dueDate) : '未设置' }}</text>
			</view>
			
			<view class="detail-item">
				<text class="label">实际完成时间</text>
				<text class="value">{{ event.completedAt ? formatDate(event.completedAt) : '未完成' }}</text>
			</view>
			
			<view class="detail-item">
				<text class="label">备注</text>
				<text class="value">{{ event.remark || '无' }}</text>
			</view>
			
			<view class="actions">
				<view class="action-btn edit-btn" @click="showEditModal = true">
					<text>编辑</text>
				</view>
				<view class="action-btn delete-btn" @click="confirmDelete">
					<text>删除</text>
				</view>
			</view>
			<view class="status-action">
				<view class="action-btn status-btn" :class="{ completed: event.completed }" @click="toggleStatus">
					<text>{{ event.completed ? '标记为未完成' : '标记为已完成' }}</text>
				</view>
			</view>
		</view>
		
		<view class="edit-modal" v-if="showEditModal" @click="closeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">编辑事件</text>
					<view class="close-btn" @click="closeModal">×</view>
				</view>
				<view class="modal-body">
					<view class="form-item">
						<text class="form-label">事件名称</text>
						<input class="form-input" v-model="editForm.name" placeholder="请输入事件名称" />
					</view>
					<view class="form-item">
						<text class="form-label">需完成时间</text>
						<picker mode="date" :value="editForm.dueDate" @change="onDueDateChange">
							<view class="form-picker">
								{{ editForm.dueDate || '请选择日期' }}
							</view>
						</picker>
					</view>
					<view class="form-item">
						<text class="form-label">备注</text>
						<textarea class="form-textarea" v-model="editForm.remark" placeholder="请输入备注"></textarea>
					</view>
				</view>
				<view class="modal-footer">
					<view class="modal-btn cancel" @click="closeModal">取消</view>
					<view class="modal-btn confirm" @click="saveEdit">保存</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getData, deleteEvent, updateEvent } from '@/utils/storage'

export default {
	data() {
		return {
			event: null,
			showEditModal: false,
			editForm: {
				name: '',
				dueDate: '',
				remark: ''
			}
		}
	},
	onLoad(options) {
		if (options && options.id) {
			this.loadEvent(options.id)
		}
	},
	methods: {
		loadEvent(eventId) {
			const data = getData()
			this.event = data.events.find(e => e.id === eventId)
			if (this.event) {
				this.editForm = {
					name: this.event.name,
					dueDate: this.event.dueDate ? this.formatDateStr(this.event.dueDate) : '',
					remark: this.event.remark || ''
				}
			}
		},
		goBack() {
			uni.navigateBack()
		},
		getQuadrantLabel(importance, urgency) {
			const labels = {
				important: {
					urgent: '重要紧急',
					notUrgent: '重要不紧急'
				},
				notImportant: {
					urgent: '不重要紧急',
					notUrgent: '不重要不紧急'
				}
			}
			return labels[importance] && labels[importance][urgency] ? labels[importance][urgency] : '未知'
		},
		formatDate(dateStr) {
			if (!dateStr) return '无'
			const date = new Date(dateStr)
			return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
		},
		formatDateStr(dateStr) {
			if (!dateStr) return ''
			const date = new Date(dateStr)
			return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
		},
		onDueDateChange(e) {
			this.editForm.dueDate = e.detail.value
		},
		closeModal() {
			this.showEditModal = false
		},
		saveEdit() {
			if (!this.editForm.name.trim()) {
				uni.showToast({ title: '请输入事件名称', icon: 'none' })
				return
			}
			updateEvent(this.event.id, {
				name: this.editForm.name.trim(),
				dueDate: this.editForm.dueDate ? new Date(this.editForm.dueDate).toISOString() : null,
				remark: this.editForm.remark.trim()
			})
			this.loadEvent(this.event.id)
			this.closeModal()
			uni.showToast({ title: '保存成功', icon: 'success' })
		},
		confirmDelete() {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这个事件吗？',
				success: (res) => {
					if (res.confirm) {
						deleteEvent(this.event.id)
						uni.showToast({ title: '删除成功', icon: 'success' })
						setTimeout(() => {
							uni.navigateBack()
						}, 1500)
					}
				}
			})
		},
		toggleStatus() {
			const newStatus = !this.event.completed
			updateEvent(this.event.id, { 
				completed: newStatus,
				completedAt: newStatus ? new Date().toISOString() : null
			})
			this.loadEvent(this.event.id)
			uni.showToast({ 
				title: newStatus ? '已标记为完成' : '已标记为未完成', 
				icon: 'success' 
			})
		}
	}
}
</script>

<style>
	.container {
		min-height: 100vh;
		background: #f5f5f5;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20rpx 30rpx;
		background: #fff;
	}

	.back-btn {
		font-size: 28rpx;
		color: #4CAF50;
	}

	.title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.placeholder {
		width: 100rpx;
	}

	.detail-card {
		margin: 20rpx;
		background: #fff;
		border-radius: 16rpx;
		padding: 30rpx;
	}

	.detail-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #eee;
	}

	.detail-item:last-of-type {
		border-bottom: none;
	}

	.label {
		font-size: 28rpx;
		color: #999;
		width: 150rpx;
		flex-shrink: 0;
	}

	.value {
		font-size: 28rpx;
		color: #333;
		flex: 1;
		text-align: right;
	}

	.status-badge {
		padding: 6rpx 20rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
		background: #FF9800;
		color: #fff;
	}

	.status-badge.completed {
		background: #4CAF50;
	}

	.actions {
		display: flex;
		gap: 20rpx;
		margin-top: 30rpx;
	}

	.action-btn {
		flex: 1;
		padding: 20rpx;
		text-align: center;
		border-radius: 24rpx;
		font-size: 28rpx;
	}

	.edit-btn {
		background: #4CAF50;
		color: #fff;
	}

	.delete-btn {
		background: #F44336;
		color: #fff;
	}

	.status-action {
		margin-top: 20rpx;
	}

	.status-btn {
		background: #FF9800;
		color: #fff;
	}

	.status-btn.completed {
		background: #9E9E9E;
	}

	.edit-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		width: 80%;
		background: #fff;
		border-radius: 20rpx;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 30rpx;
		border-bottom: 1rpx solid #eee;
	}

	.modal-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.close-btn {
		font-size: 40rpx;
		color: #999;
		padding: 0 10rpx;
	}

	.modal-body {
		padding: 30rpx;
	}

	.form-item {
		margin-bottom: 25rpx;
	}

	.form-label {
		display: block;
		font-size: 28rpx;
		color: #666;
		margin-bottom: 10rpx;
	}

	.form-input {
		width: 100%;
		padding: 20rpx;
		border: 1rpx solid #ddd;
		border-radius: 12rpx;
		font-size: 28rpx;
	}

	.form-picker {
		width: 100%;
		padding: 20rpx;
		border: 1rpx solid #ddd;
		border-radius: 12rpx;
		font-size: 28rpx;
		color: #666;
	}

	.form-textarea {
		width: 100%;
		height: 150rpx;
		padding: 20rpx;
		border: 1rpx solid #ddd;
		border-radius: 12rpx;
		font-size: 28rpx;
	}

	.modal-footer {
		display: flex;
		border-top: 1rpx solid #eee;
	}

	.modal-btn {
		flex: 1;
		padding: 25rpx;
		text-align: center;
		font-size: 30rpx;
	}

	.modal-btn.cancel {
		color: #666;
		border-right: 1rpx solid #eee;
	}

	.modal-btn.confirm {
		color: #4CAF50;
	}
</style>
