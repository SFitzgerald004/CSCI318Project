import { useState } from 'react'

const CATEGORY_ICONS = {
  dining: '🍽️',
  sightseeing: '🏛️',
  transport: '✈️',
  accommodation: '🏨',
  activity: '🎯',
}

export default function ActivityItem({ activity, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(activity)

  const handleSave = () => {
    onUpdate(editData)
    setIsEditing(false)
  }

  return (
    <div className="border rounded-lg p-3 hover:border-gray-300 transition-colors">
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="time"
              value={editData.time}
              onChange={(e) => setEditData({ ...editData, time: e.target.value })}
              className="p-1 border rounded text-sm"
            />
            <select
              value={editData.category}
              onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              className="p-1 border rounded text-sm"
            >
              <option value="activity">🎯 Activity</option>
              <option value="dining">🍽️ Dining</option>
              <option value="sightseeing">🏛️ Sightseeing</option>
              <option value="transport">🚗 Transport</option>
              <option value="accommodation">🏨 Accommodation</option>
            </select>
          </div>
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className="w-full p-1 border rounded text-sm"
            placeholder="Title"
          />
          <input
            type="text"
            value={editData.location || ''}
            onChange={(e) => setEditData({ ...editData, location: e.target.value })}
            className="w-full p-1 border rounded text-sm"
            placeholder="Location"
          />
          <textarea
            value={editData.notes || ''}
            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            className="w-full p-1 border rounded text-sm"
            placeholder="Notes"
            rows={2}
          />
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 bg-[#0071e3] text-white py-1 rounded text-sm">
              Save
            </button>
            <button onClick={() => setIsEditing(false)} className="px-3 py-1 border rounded text-sm">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{CATEGORY_ICONS[activity.category] || '🎯'}</span>
              <span className="text-sm font-medium text-[#0071e3]">{activity.time}</span>
              <span className="font-medium text-[#1d1d1f]">{activity.title}</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-gray-600 text-sm">
                Edit
              </button>
              <button onClick={onDelete} className="text-gray-400 hover:text-red-500 text-sm">
                Delete
              </button>
            </div>
          </div>
          {activity.location && (
            <p className="text-sm text-gray-500 mt-1 ml-6">📍 {activity.location}</p>
          )}
          {activity.notes && (
            <p className="text-sm text-gray-400 mt-1 ml-6">{activity.notes}</p>
          )}
        </div>
      )}
    </div>
  )
}