const STORAGE_KEY = 'become_orderly_data'

const defaultData = {
  events: [],
  eventTypes: [
    { id: 'type1', name: '工作', color: '#4CAF50' },
    { id: 'type2', name: '生活', color: '#2196F3' },
    { id: 'type3', name: '学习', color: '#FF9800' },
    { id: 'type4', name: '健康', color: '#F44336' }
  ]
}

export function getData() {
  try {
    const data = uni.getStorageSync(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
    saveData(defaultData)
    return defaultData
  } catch (e) {
    console.error('读取数据失败:', e)
    return defaultData
  }
}

export function saveData(data) {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (e) {
    console.error('保存数据失败:', e)
    return false
  }
}

export function addEvent(event) {
  const data = getData()
  const newEvent = {
    id: Date.now().toString(),
    name: event.name,
    typeId: event.typeId || 'type1',
    importance: event.importance !== undefined ? event.importance : 'important',
    urgency: event.urgency !== undefined ? event.urgency : 'notUrgent',
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null
  }
  data.events.push(newEvent)
  saveData(data)
  return newEvent
}

export function toggleEvent(eventId) {
  const data = getData()
  const event = data.events.find(e => e.id === eventId)
  if (event) {
    event.completed = !event.completed
    event.completedAt = event.completed ? new Date().toISOString() : null
    saveData(data)
    return true
  }
  return false
}

export function deleteEvent(eventId) {
  const data = getData()
  data.events = data.events.filter(e => e.id !== eventId)
  saveData(data)
  return true
}

export function updateEvent(eventId, updates) {
  const data = getData()
  const event = data.events.find(e => e.id === eventId)
  if (event) {
    Object.assign(event, updates)
    saveData(data)
    return true
  }
  return false
}

export function addEventType(type) {
  const data = getData()
  const newType = {
    id: Date.now().toString(),
    name: type.name,
    color: type.color || '#9E9E9E'
  }
  data.eventTypes.push(newType)
  saveData(data)
  return newType
}

export function exportData() {
  const data = getData()
  return JSON.stringify(data, null, 2)
}

export function generateFileName() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}${hour}${minute}${second}todo.json`
}

export function downloadFile(content, fileName) {
  // #ifdef H5
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return true
  // #endif
  
  // #ifndef H5
  uni.setClipboardData({
    data: content,
    success: () => {
      uni.showToast({
        title: '数据已复制，可粘贴保存',
        icon: 'success'
      })
    },
    fail: () => {
      uni.showToast({
        title: '复制失败',
        icon: 'none'
      })
    }
  })
  return false
  // #endif
}

export function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (data.events && Array.isArray(data.events)) {
      saveData(data)
      return { success: true, message: '导入成功' }
    }
    return { success: false, message: '数据格式不正确' }
  } catch (e) {
    return { success: false, message: 'JSON解析失败: ' + e.message }
  }
}

export function clearAllData() {
  saveData(defaultData)
  return true
}

export function getEventByQuadrant() {
  const data = getData()
  return {
    importantUrgent: data.events.filter(e => e.importance === 'important' && e.urgency === 'urgent'),
    importantNotUrgent: data.events.filter(e => e.importance === 'important' && e.urgency === 'notUrgent'),
    notImportantUrgent: data.events.filter(e => e.importance === 'notImportant' && e.urgency === 'urgent'),
    notImportantNotUrgent: data.events.filter(e => e.importance === 'notImportant' && e.urgency === 'notUrgent')
  }
}