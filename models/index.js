export class Event {
  constructor(options) {
    this.id = options.id || Date.now().toString()
    this.name = options.name || ''
    this.typeId = options.typeId || 'type1'
    this.importance = options.importance || 'important'
    this.urgency = options.urgency || 'notUrgent'
    this.completed = options.completed || false
    this.createdAt = options.createdAt || new Date().toISOString()
    this.completedAt = options.completedAt || null
  }

  get quadrant() {
    if (this.importance === 'important' && this.urgency === 'urgent') {
      return 'importantUrgent'
    } else if (this.importance === 'important' && this.urgency === 'notUrgent') {
      return 'importantNotUrgent'
    } else if (this.importance === 'notImportant' && this.urgency === 'urgent') {
      return 'notImportantUrgent'
    } else {
      return 'notImportantNotUrgent'
    }
  }

  toggle() {
    this.completed = !this.completed
    this.completedAt = this.completed ? new Date().toISOString() : null
    return this
  }
}

export class EventType {
  constructor(options) {
    this.id = options.id || Date.now().toString()
    this.name = options.name || ''
    this.color = options.color || '#9E9E9E'
  }
}

export const QUADRANTS = {
  importantUrgent: {
    key: 'importantUrgent',
    label: '重要，紧急',
    description: '需要立即处理的任务',
    color: '#F44336'
  },
  importantNotUrgent: {
    key: 'importantNotUrgent',
    label: '重要，不紧急',
    description: '需要规划的长期任务',
    color: '#FF9800'
  },
  notImportantUrgent: {
    key: 'notImportantUrgent',
    label: '不重要，紧急',
    description: '可以委托他人的任务',
    color: '#2196F3'
  },
  notImportantNotUrgent: {
    key: 'notImportantNotUrgent',
    label: '不重要，不紧急',
    description: '可以推迟或删除的任务',
    color: '#9E9E9E'
  }
}