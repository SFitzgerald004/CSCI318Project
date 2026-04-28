import { Link } from 'react-router-dom';
import Card from './ui/Card';

const PURPOSE_EMOJI = {
  vacation: '🌴',
  business: '💼',
  family: '👨‍👩‍👧‍👦',
  adventure: '🏔️',
};

function getDestinationImage(destination) {
  // Using picsum.photos for reliable placeholder images
  // Seed ensures the same destination always gets the same image
  const seed = encodeURIComponent(destination);
  return `https://picsum.photos/seed/${seed}/400/300`;
}

export default function TripCard({ trip }) {
  const departure = new Date(trip.departure_date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  const returnDate = new Date(trip.return_date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  const bgImage = trip.image_url || getDestinationImage(trip.destination);

  return (
    <Link to={`/trips/${trip.id}`} className="block">
      <Card hover className="h-full" backgroundImage={bgImage}>
        <div className="text-2xl mb-2">{PURPOSE_EMOJI[trip.trip_purpose] || '✈️'}</div>
        <h3
        className="type-body-emphasis"
        style={{
          textShadow: '1px 0 2px gray, -2px 0 2px gray, 0 2px 2px gray, 0 -2px 2px gray'
        }}
        >{trip.destination}</h3>
        <p className="type-caption text-text-secondary mt-1 capitalize">
          {trip.trip_purpose} · {trip.num_travelers} traveler{trip.num_travelers > 1 ? 's' : ''}
        </p>
        <p className="type-caption text-text-tertiary">{departure} – {returnDate}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="type-body-emphasis">${trip.total_budget.toLocaleString()}</span>
          <span className="type-caption text-apple-blue">View →</span>
        </div>
      </Card>
    </Link>
  );
}
