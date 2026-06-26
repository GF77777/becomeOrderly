<template>
	<view class="container" @touchstart.passive>
		<view class="user-card" @click="editProfile">
			<view class="avatar">
				<image v-if="userAvatar && userAvatar.startsWith('data:image/')" class="avatar-img" :src="userAvatar" mode="aspectFill" />
				<text v-else class="avatar-emoji">{{ userAvatar || '👤' }}</text>
			</view>
			<view class="user-info">
				<text class="user-name">{{ userName }}</text>
				<view class="user-tags" v-if="userTags">
					<text 
						v-for="(tag, index) in userTags.split(',').filter(t => t.trim())" 
						:key="index" 
						class="user-tag"
					>{{ tag.trim() }}</text>
				</view>
				<text class="user-desc" v-else>坚持有序，成就更好的自己</text>
			</view>
			<view class="user-arrow">›</view>
		</view>
		
		<view class="stats-card">
			<view class="stats-header">
				<text class="stats-title">📊 统计概览</text>
			</view>
			<view class="stats-grid">
				<view class="stat-item">
					<text class="stat-icon">📊</text>
					<text class="stat-value">{{ statistics.total }}</text>
					<text class="stat-label">总任务</text>
				</view>
				<view class="stat-item">
					<text class="stat-icon">✅</text>
					<text class="stat-value completed">{{ statistics.completed }}</text>
					<text class="stat-label">已完成</text>
				</view>
				<view class="stat-item">
					<text class="stat-icon">⏳</text>
					<text class="stat-value pending">{{ statistics.pending }}</text>
					<text class="stat-label">未完成</text>
				</view>
				<view class="stat-item rate-item">
					<text class="stat-value rate">{{ statistics.completionRate }}%</text>
					<text class="stat-label">完成率</text>
					<view class="progress-bar">
						<view class="progress" :style="{ width: statistics.completionRate + '%' }"></view>
					</view>
				</view>
			</view>
			<view class="quadrant-stats">
				<view class="quadrant-item" v-for="(item, key) in quadrantItems" :key="key" :class="item.colorClass" @click="goToDetail(item.symbol)">
					<image v-if="item.icon" class="quadrant-icon" :src="item.icon" mode="aspectFit" />
					<text v-else class="quadrant-symbol">{{ item.symbol }}</text>
					<text class="quadrant-name">{{ item.name }}</text>
					<text class="quadrant-count">{{ item.count }}</text>
					<text class="quadrant-arrow">›</text>
				</view>
			</view>
		</view>
		
		<view class="menu-list">
			<view class="menu-item" @click="viewTasks">
				<text class="menu-icon">📋</text>
				<text class="menu-text">我的任务</text>
				<view class="menu-badge" v-if="statistics.pending > 0">{{ statistics.pending }}</view>
				<text class="menu-arrow">›</text>
			</view>
			<view class="menu-item" @click="showImportExport">
				<text class="menu-icon">📤</text>
				<text class="menu-text">数据导入导出</text>
				<text class="menu-arrow">›</text>
			</view>

			<view class="menu-item" @click="showSettings">
				<text class="menu-icon">⚙️</text>
				<text class="menu-text">设置</text>
				<text class="menu-arrow">›</text>
			</view>
		</view>
		
		<view class="logout-btn" @click="logout">
			<text>退出登录</text>
		</view>

		<view v-if="showModal" class="modal-overlay" @click="closeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">数据导入导出</text>
					<text class="modal-close" @click="closeModal">✕</text>
				</view>
				<view class="modal-body">
					<view class="modal-btn" @click="handleExport">
						<text class="btn-icon">📥</text>
						<text class="btn-text">导出数据</text>
					</view>
					<view class="modal-btn" @click="handleImport">
						<text class="btn-icon">📤</text>
						<text class="btn-text">导入数据</text>
					</view>
					<view class="modal-btn danger" @click="handleClear">
						<text class="btn-icon">🗑️</text>
						<text class="btn-text">清空数据</text>
					</view>
				</view>
			</view>
		</view>

		<view v-if="showProfileModal" class="modal-overlay" @click="closeProfileModal">
			<view class="profile-modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">编辑资料</text>
					<text class="modal-close" @click="closeProfileModal">✕</text>
				</view>
				<view class="modal-body">
					<view class="form-item">
					<text class="form-label">头像</text>
					<view class="avatar-upload">
						<view class="avatar-preview" @click="uploadAvatar">
							<image v-if="editingProfile.avatar && editingProfile.avatar.startsWith('data:image/')" class="preview-img" :src="editingProfile.avatar" mode="aspectFill" />
							<text v-else class="upload-hint">点击上传头像</text>
						</view>
						<text class="upload-tip">支持PNG、JPG格式图片</text>
					</view>
				</view>
					<view class="form-item">
						<text class="form-label">用户名</text>
						<input 
							class="form-input" 
							type="text" 
							placeholder="请输入用户名"
							v-model="editingProfile.name"
						/>
					</view>
					<view class="form-item">
						<text class="form-label">个人标签</text>
						<input 
							class="form-input" 
							type="text" 
							placeholder="多个标签用逗号分隔"
							v-model="editingProfile.tags"
						/>
					</view>
				</view>
				<view class="modal-footer">
					<view class="modal-btn secondary" @click="closeProfileModal">
						<text>取消</text>
					</view>
					<view class="modal-btn primary" @click="saveProfile">
						<text>保存</text>
					</view>
				</view>
			</view>
		</view>

	</view>
</template>

<script>
import { exportData, importData, clearAllData, getData, generateFileName, downloadFile } from '@/utils/storage'

export default {
	data() {
		return {
			userName: '用户名',
			userAvatar: '👤',
			userTags: '',
			events: [],
			showModal: false,
			showProfileModal: false,
			editingProfile: {
				name: '',
				avatar: '',
				tags: ''
			}
		}
	},
	computed: {
		statistics() {
			const total = this.events.length
			const completed = this.events.filter(e => e.completed).length
			const pending = total - completed
			const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
			
			const quadrantCounts = {
				importantUrgent: this.events.filter(e => e.importance === 'important' && e.urgency === 'urgent').length,
				importantNotUrgent: this.events.filter(e => e.importance === 'important' && e.urgency === 'notUrgent').length,
				notImportantUrgent: this.events.filter(e => e.importance === 'notImportant' && e.urgency === 'urgent').length,
				notImportantNotUrgent: this.events.filter(e => e.importance === 'notImportant' && e.urgency === 'notUrgent').length
			}
			
			return {
				total,
				completed,
				pending,
				completionRate,
				quadrantCounts
			}
		},
		quadrantItems() {
			return [
				{
					symbol: 'Ⅰ',
					name: '重要紧急',
					count: this.statistics.quadrantCounts.importantUrgent,
					colorClass: 'red',
					icon: '/static/index/紧急1.png'
				},
				{
					symbol: 'Ⅱ',
					name: '重要不紧急',
					count: this.statistics.quadrantCounts.importantNotUrgent,
					colorClass: 'green',
					icon: '/static/index/紧急.png'
				},
				{
					symbol: 'Ⅲ',
					name: '不重要紧急',
					count: this.statistics.quadrantCounts.notImportantUrgent,
					colorClass: 'blue',
					icon: '/static/index/紧急1.png'
				},
				{
					symbol: 'Ⅳ',
					name: '不重要不紧急',
					count: this.statistics.quadrantCounts.notImportantNotUrgent,
					colorClass: 'gray',
					icon: '/static/index/紧急.png'
				}
			]
		}
	},
	onShow() {
		this.loadData()
	},
	methods: {
		loadData() {
			const data = getData()
			this.events = data.events
			const userInfo = uni.getStorageSync('userInfo')
			if (userInfo) {
				this.userName = userInfo.name || '用户名'
				this.userAvatar = userInfo.avatar || '👤'
				this.userTags = userInfo.tags || ''
			}
		},
		viewTasks() {
			uni.switchTab({
				url: '/pages/detail/detail'
			})
		},
		editProfile() {
			this.editingProfile = {
				name: this.userName,
				avatar: this.userAvatar,
				tags: this.userTags
			}
			this.showProfileModal = true
		},
		closeProfileModal() {
			this.showProfileModal = false
		},
		uploadAvatar() {
			// #ifdef H5
			const input = document.createElement('input')
			input.type = 'file'
			input.accept = 'image/png,image/jpg,image/jpeg'
			input.onchange = (e) => {
				const file = e.target.files[0]
				if (!file) return
				
				const fileName = file.name.toLowerCase()
				if (!fileName.endsWith('.png') && !fileName.endsWith('.jpg') && !fileName.endsWith('.jpeg')) {
					uni.showToast({ title: '请选择PNG或JPG格式图片', icon: 'none' })
					return
				}
				
				const reader = new FileReader()
				reader.onload = (event) => {
					this.editingProfile.avatar = event.target.result
				}
				reader.onerror = () => {
					uni.showToast({ title: '读取图片失败', icon: 'none' })
				}
				reader.readAsDataURL(file)
			}
			input.click()
			// #endif
			
			// #ifndef H5
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const tempFilePath = res.tempFilePaths[0]
					const lowerPath = tempFilePath.toLowerCase()
					let mimeType = ''
					
					if (lowerPath.endsWith('.png')) {
						mimeType = 'image/png'
					} else if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) {
						mimeType = 'image/jpeg'
					} else {
						uni.showToast({ title: '请选择PNG或JPG格式图片', icon: 'none' })
						return
					}
					
					uni.getFileSystemManager().readFile({
						filePath: tempFilePath,
						encoding: 'base64',
						success: (result) => {
							this.editingProfile.avatar = `data:${mimeType};base64,${result.data}`
						},
						fail: () => {
							uni.showToast({ title: '读取图片失败', icon: 'none' })
						}
					})
				},
				fail: () => {
					uni.showToast({ title: '选择图片失败', icon: 'none' })
				}
			})
			// #endif
		},
		saveProfile() {
			if (!this.editingProfile.name.trim()) {
				uni.showToast({
					title: '请输入用户名',
					icon: 'none'
				})
				return
			}
			this.userName = this.editingProfile.name.trim()
			this.userAvatar = this.editingProfile.avatar
			this.userTags = this.editingProfile.tags
			
			uni.setStorageSync('userInfo', {
				name: this.userName,
				avatar: this.userAvatar,
				tags: this.userTags
			})
			
			this.closeProfileModal()
			uni.showToast({
				title: '保存成功',
				icon: 'success'
			})
		},
		goToDetail(quadrant) {
			const quadrantMap = {
				'Ⅰ': 'importantUrgent',
				'Ⅱ': 'importantNotUrgent',
				'Ⅲ': 'notImportantUrgent',
				'Ⅳ': 'notImportantNotUrgent'
			}
			uni.setStorageSync('selectedQuadrant', quadrantMap[quadrant])
			uni.switchTab({
				url: '/pages/detail/detail'
			})
		},
		showImportExport() {
			this.showModal = true
		},
		closeModal() {
			this.showModal = false
		},
		showSettings() {
			uni.showToast({
				title: '设置功能开发中',
				icon: 'none'
			})
		},
		logout() {
			uni.showModal({
				title: '提示',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						uni.showToast({
							title: '已退出登录',
							icon: 'success'
						})
					}
				}
			})
		},
		handleExport() {
			const data = exportData()
			const fileName = generateFileName()
			
			this.closeModal()
			
			uni.showModal({
				title: '导出数据',
				content: `将数据导出为文件：${fileName}`,
				confirmText: '导出',
				success: (res) => {
					if (res.confirm) {
						const isDownloaded = downloadFile(data, fileName)
						if (!isDownloaded) {
							uni.showToast({
								title: '数据已复制，可粘贴保存',
								icon: 'success'
							})
						}
					}
				}
			})
		},
		handleImport() {
			this.closeModal()
			
			// #ifdef H5
			const fileInput = document.createElement('input')
			fileInput.type = 'file'
			fileInput.accept = '.json'
			fileInput.style.display = 'none'
			fileInput.onchange = (e) => {
				const file = e.target.files[0]
				if (!file) {
					uni.showToast({
						title: '未选择文件',
						icon: 'none'
					})
					return
				}
				
				uni.showLoading({ title: '读取文件中...' })
				const reader = new FileReader()
				reader.onload = (event) => {
					uni.hideLoading()
					const result = importData(event.target.result)
					if (result.success) {
						uni.showToast({
							title: result.message,
							icon: 'success'
						})
						this.loadData()
					} else {
						uni.showToast({
							title: result.message,
							icon: 'none'
						})
					}
				}
				reader.onerror = () => {
					uni.hideLoading()
					uni.showToast({
						title: '读取文件失败',
						icon: 'none'
					})
				}
				reader.readAsText(file, 'utf-8')
			}
			document.body.appendChild(fileInput)
			fileInput.click()
			document.body.removeChild(fileInput)
			// #endif
			
			// #ifndef H5
			uni.showModal({
				title: '导入数据',
				content: '请选择要导入的JSON文件',
				confirmText: '选择文件',
				success: (modalRes) => {
					if (modalRes.confirm) {
						uni.chooseFile({
							count: 1,
							extension: ['.json'],
							success: (res) => {
								const tempFilePath = res.tempFiles[0].path
								uni.showLoading({ title: '读取文件中...' })
								
								uni.getFileSystemManager().readFile({
									filePath: tempFilePath,
									encoding: 'utf-8',
									success: (fileRes) => {
										uni.hideLoading()
										const result = importData(fileRes.data)
										if (result.success) {
											uni.showToast({
												title: result.message,
												icon: 'success'
											})
											this.loadData()
										} else {
											uni.showToast({
												title: result.message,
												icon: 'none'
											})
										}
									},
									fail: (err) => {
										uni.hideLoading()
										uni.showToast({
											title: '读取文件失败: ' + err.errMsg,
											icon: 'none'
										})
									}
								})
							},
							fail: (err) => {
								uni.showToast({
									title: '选择文件失败: ' + err.errMsg,
									icon: 'none'
								})
							}
						})
					}
				}
			})
			// #endif
		},
		handleClear() {
			this.closeModal()
			
			uni.showModal({
				title: '确认清空',
				content: '确定要清空所有数据吗？此操作不可恢复！',
				success: (res) => {
					if (res.confirm) {
						clearAllData()
						this.loadData()
						uni.showToast({
							title: '数据已清空',
							icon: 'success'
						})
					}
				}
			})
		}
	}
}
</script>

<style>
	.container {
		padding: 40rpx;
		min-height: 100vh;
	}

	.stats-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
	}

	.stats-header {
		margin-bottom: 24rpx;
	}

	.stats-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.stats-grid {
		display: flex;
		justify-content: space-between;
		padding-bottom: 24rpx;
		border-bottom: 1rpx solid #eee;
	}

	.stat-item {
		flex: 1;
		text-align: center;
	}

	.stat-icon {
		display: block;
		font-size: 32rpx;
		margin-bottom: 8rpx;
	}

	.stat-value {
		display: block;
		font-size: 40rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 8rpx;
	}

	.stat-value.completed {
		color: #4CAF50;
	}

	.stat-value.pending {
		color: #FF9800;
	}

	.stat-value.rate {
		color: #2196F3;
	}

	.stat-label {
		font-size: 24rpx;
		color: #999;
	}

	.rate-item {
		position: relative;
	}

	.progress-bar {
		width: 100%;
		height: 6rpx;
		background: #eee;
		border-radius: 3rpx;
		margin-top: 8rpx;
		overflow: hidden;
	}

	.progress {
		height: 100%;
		background: #4CAF50;
		border-radius: 3rpx;
		transition: width 0.3s ease;
	}

	.quadrant-stats {
		display: flex;
		justify-content: space-between;
		padding-top: 20rpx;
		gap: 16rpx;
	}

	.quadrant-item {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6rpx;
		padding: 16rpx 8rpx;
		border-radius: 12rpx;
		background: #f9f9f9;
		transition: all 0.2s ease;
	}

	.quadrant-item:active {
		transform: scale(0.96);
		opacity: 0.85;
	}

	.quadrant-item.red {
		background: #fff5f5;
		border: 1rpx solid #ffcccc;
	}

	.quadrant-item.green {
		background: #f0fff0;
		border: 1rpx solid #ccffcc;
	}

	.quadrant-item.blue {
		background: #f0f8ff;
		border: 1rpx solid #cce6ff;
	}

	.quadrant-item.gray {
		background: #f5f5f5;
		border: 1rpx solid #e0e0e0;
	}

	.quadrant-symbol {
		font-size: 24rpx;
		font-weight: bold;
	}

	.quadrant-icon {
		width: 36rpx;
		height: 36rpx;
	}

	.quadrant-name {
		font-size: 22rpx;
		color: #666;
	}

	.quadrant-count {
		font-size: 24rpx;
		font-weight: bold;
		color: #333;
	}

	.quadrant-arrow {
		font-size: 24rpx;
		color: #999;
		margin-left: 4rpx;
	}

	.user-card {
		display: flex;
		align-items: center;
		background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
		border-radius: 20rpx;
		padding: 40rpx;
		margin-bottom: 30rpx;
	}

	.avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 30rpx;
	}

	.avatar-text {
		font-size: 48rpx;
		color: #fff;
		font-weight: bold;
	}

	.avatar-emoji {
		font-size: 56rpx;
	}

	.user-info {
		flex: 1;
	}

	.user-name {
		display: block;
		font-size: 36rpx;
		color: #fff;
		font-weight: bold;
		margin-bottom: 10rpx;
	}

	.user-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8rpx;
	}

	.user-tag {
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.9);
		background: rgba(255, 255, 255, 0.2);
		padding: 4rpx 12rpx;
		border-radius: 16rpx;
	}

	.user-desc {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	.user-arrow {
		font-size: 48rpx;
		color: rgba(255, 255, 255, 0.6);
		font-weight: normal;
	}

	.menu-list {
		background: #fff;
		border-radius: 20rpx;
		overflow: hidden;
		margin-bottom: 30rpx;
	}

	.menu-item {
		display: flex;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #eee;
	}

	.menu-item:last-child {
		border-bottom: none;
	}

	.menu-icon {
		font-size: 36rpx;
		margin-right: 20rpx;
	}

	.menu-text {
		flex: 1;
		font-size: 30rpx;
		color: #333;
	}

	.menu-badge {
		background: #F44336;
		color: #fff;
		font-size: 22rpx;
		padding: 4rpx 12rpx;
		border-radius: 20rpx;
		margin-right: 16rpx;
	}

	.menu-arrow {
		font-size: 36rpx;
		color: #999;
	}

	.logout-btn {
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		text-align: center;
		color: #f44336;
		font-size: 30rpx;
		border: 1rpx solid #f44336;
	}

	.modal-overlay {
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
		width: 600rpx;
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

	.modal-close {
		font-size: 36rpx;
		color: #999;
		padding: 10rpx;
	}

	.modal-body {
		padding: 30rpx;
	}

	.modal-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24rpx;
		border-radius: 12rpx;
		background: #f5f5f5;
		margin-bottom: 16rpx;
	}

	.modal-btn:last-child {
		margin-bottom: 0;
	}

	.modal-btn.danger {
		background: #fff5f5;
	}

	.modal-btn.danger .btn-text {
		color: #F44336;
	}

	.modal-btn.secondary {
		background: #f5f5f5;
	}

	.modal-btn.primary {
		background: #4CAF50;
	}

	.modal-btn.primary .btn-text {
		color: #fff;
	}

	.modal-btn.small {
		padding: 16rpx;
	}

	.btn-icon {
		font-size: 32rpx;
		margin-right: 12rpx;
	}

	.btn-text {
		font-size: 28rpx;
		color: #333;
	}

	.profile-modal-content {
		width: 680rpx;
		max-height: 80vh;
		background: #fff;
		border-radius: 20rpx;
		overflow: hidden;
	}

	.form-item {
		margin-bottom: 30rpx;
	}

	.form-label {
		display: block;
		font-size: 28rpx;
		color: #666;
		margin-bottom: 16rpx;
	}

	.form-input {
		width: 100%;
		height: 80rpx;
		border: 2rpx solid #eee;
		border-radius: 8rpx;
		padding: 0 20rpx;
		font-size: 28rpx;
		box-sizing: border-box;
		background: #fafafa;
	}

	.avatar-upload {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.avatar-preview {
		width: 160rpx;
		height: 160rpx;
		border-radius: 50%;
		background: #f5f5f5;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2rpx dashed #ddd;
		transition: all 0.2s ease;
	}

	.avatar-preview:active {
		background: #eee;
	}

	.preview-img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.upload-hint {
		font-size: 24rpx;
		color: #999;
		text-align: center;
		padding: 20rpx;
	}

	.upload-tip {
		font-size: 22rpx;
		color: #999;
		margin-top: 12rpx;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.modal-footer {
		display: flex;
		border-top: 1rpx solid #eee;
	}

	.modal-footer .modal-btn {
		flex: 1;
		margin-bottom: 0;
		border-radius: 0;
	}

	.modal-footer .modal-btn.secondary {
		border-right: 1rpx solid #eee;
	}

	.modal-footer .modal-btn.primary {
		color: #fff;
	}
</style>