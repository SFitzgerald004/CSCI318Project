// FlightCard.jsx

export default function FlightCard({ flight }) {
    const formatTime = (isoString) => {
        if (!isoString) return ''
        const date = new Date(isoString)
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    const formatDate = (isoString) => {
        if (!isoString) return ''
        const date = new Date(isoString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const outbound = flight.outbound
    const inbound = flight.inbound

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            {/* Price */}
            <div className="text-xl font-semibold text-[#1d1d1f] mb-4">
                {flight.currency} {flight.price}
            </div>

            {/* Outbound Flight */}
            <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                    <div className="text-lg font-semibold">{outbound?.segments[0]?.departure_airport}</div>
                    <div className="text-sm text-gray-500">{formatTime(outbound?.segments[0]?.departure_time)}</div>
                    <div className="text-xs text-gray-400">{formatDate(outbound?.segments[0]?.departure_time)}</div>
                </div>
                <div className="flex-1 px-4">
                    <div className="text-xs text-gray-400 text-center">{outbound?.duration}</div>
                    <div className="border-t border-gray-300 relative my-1">
                        <span className="absolute right-0 -top-1 bg-white text-xs">✈️</span>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                        {outbound?.segments.length} stop{outbound?.segments.length > 1 ? 's' : ''}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-lg font-semibold">{outbound?.segments[outbound?.segments.length - 1]?.arrival_airport}</div>
                    <div className="text-sm text-gray-500">{formatTime(outbound?.segments[outbound?.segments.length - 1]?.arrival_time)}</div>
                    <div className="text-xs text-gray-400">{formatDate(outbound?.segments[outbound?.segments.length - 1]?.arrival_time)}</div>
                </div>
            </div>

            {/* Return Flight */}
            {inbound && (
                <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                        <div className="text-lg font-semibold">{inbound?.segments[0]?.departure_airport}</div>
                        <div className="text-sm text-gray-500">{formatTime(inbound?.segments[0]?.departure_time)}</div>
                        <div className="text-xs text-gray-400">{formatDate(inbound?.segments[0]?.departure_time)}</div>
                    </div>
                    <div className="flex-1 px-4">
                        <div className="text-xs text-gray-400 text-center">{inbound?.duration}</div>
                        <div className="border-t border-gray-300 relative my-1">
                            <span className="absolute right-0 -top-1 bg-white text-xs">✈️</span>
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                            {inbound?.segments.length} stop{inbound?.segments.length > 1 ? 's' : ''}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-semibold">{inbound?.segments[inbound?.segments.length - 1]?.arrival_airport}</div>
                        <div className="text-sm text-gray-500">{formatTime(inbound?.segments[inbound?.segments.length - 1]?.arrival_time)}</div>
                        <div className="text-xs text-gray-400">{formatDate(inbound?.segments[inbound?.segments.length - 1]?.arrival_time)}</div>
                    </div>
                </div>
            )}
        </div>
    )
}