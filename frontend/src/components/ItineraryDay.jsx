import { useState } from 'react'
import ActivityItem from './ActivityItem'

const CATEGORY_ICONS = {
  dining: '🍽️',
  sightseeing: '🏛️',
  transport: '🚗',
  accommodation: '🏨',
  activity: '🎯',
}

export default function ItineraryDay({ day, dayIndex, onUpdateActivity, onDeleteActivitym, onAddActivity }) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newActivity, setNewActivity] = useState({ time: '', title: '', location: '', notes: '', categories: 'activity' })

    const handleAdd = () => {
        if (!newActivity.time || !newActivity.title) return
        onAddActivity(dayIndex, { ...newActivity, id: Date.now().toString() })
        setNewActivity({ time: '', title: '', location: '', notes: '', category: 'activity' })
        setShowAddForm(false)
    }

    const dateObj = new Date(day.date)
    const dayName = dateObj.toLocaleDateString('en-US', { weekdat: 'long' })
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div
                className="p-4 flex items-center justify-between cursor-pointer bg-gray-50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                        <h3 className="font-semibold text-[#1d1d1f]">Day {dayIndex+1}</h3>
                        <p className="text-sm text-gray-500">{dayName}, {dateStr}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{day.activities?.length || 0} activities planned</span>
                    <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                </div>
            </div>

            {isExpanded && (
                <div className="p-4">
                {day.activities?.length > 0 ? (
                    <div className="space-y-3">
                    {day.activities
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((activity, idx) => (
                        <ActivityItem
                            key={activity.id || idx}
                            activity={activity}
                            onUpdate={(updated) => onUpdateActivity(dayIndex, idx, updated)}
                            onDelete={() => onDeleteActivity(dayIndex, idx)}
                        />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No activities yet</p>
                )}

                {showAddForm ? (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                    <input
                        type="time"
                        value={newActivity.time}
                        onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                        className="w-full p-2 border rounded-lg text-sm"
                        placeholder="Time"
                    />
                    <input
                        type="text"
                        value={newActivity.title}
                        onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                        className="w-full p-2 border rounded-lg text-sm"
                        placeholder="Activity title"
                    />
                    <input
                        type="text"
                        value={newActivity.location}
                        onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                        className="w-full p-2 border rounded-lg text-sm"
                        placeholder="Location (optional)"
                    />
                    <select
                        value={newActivity.category}
                        onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value })}
                        className="w-full p-2 border rounded-lg text-sm"
                    >
                        <option value="activity">🎯 Activity</option>
                        <option value="dining">🍽️ Dining</option>
                        <option value="sightseeing">🏛️ Sightseeing</option>
                        <option value="transport">🚗 Transport</option>
                        <option value="accommodation">🏨 Accommodation</option>
                    </select>
                    <textarea
                        value={newActivity.notes}
                        onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })}
                        className="w-full p-2 border rounded-lg text-sm"
                        placeholder="Notes (optional)"
                        rows={2}
                    />
                    <div className="flex gap-2">
                        <button onClick={handleAdd} className="flex-1 bg-[#0071e3] text-white py-2 rounded-lg text-sm font-medium">
                        Add Activity
                        </button>
                        <button onClick={() => setShowAddForm(false)} className="px-4 py-2 border rounded-lg text-sm">
                        Cancel
                        </button>
                    </div>
                    </div>
                ) : (
                    <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400"
                    >
                    + Add Activity
                    </button>
                )}
                </div>
            )}
        </div>
    )
}