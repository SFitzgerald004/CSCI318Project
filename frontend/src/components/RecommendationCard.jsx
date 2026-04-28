import { TrashIcon } from '@heroicons/react/24/outline';
import { Link, useParams } from 'react-router-dom';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';

// Strip common markdown artifacts (**bold**, *italic*) so AI-generated text
// reads cleanly. Lists, line breaks, and plain text pass through unchanged.
function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // **bold** → bold
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1');  // *italic* → italic
}

export default function RecommendationCard({ rec, onDelete }) {
  const { id: tripId } = useParams();

  return (
    <Card className="relative group">
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        aria-label="Delete recommendation"
        className="!absolute top-3 right-3 !p-1 opacity-0 group-hover:opacity-100 transition-opacity !text-gray-300 hover:!text-red-500"
      >
        <TrashIcon className="w-4 h-4" />
      </Button>

      <Link
        to={`/trips/${tripId}/recommendations/${rec.id}`}
        state={{ rec }}
        className="block"
      >
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant={rec.category === 'car_rental' ? 'car-rental' : rec.category}>{rec.category}</Badge>
        </div>                                                                                                                            
                                                                                                                                          
        <h3 className="type-body-emphasis">{rec.name}</h3>                                                                                
        {rec.description && (
          <p className="type-caption text-text-secondary mt-1 whitespace-pre-wrap">                                                       
            {stripMarkdown(rec.description)}                                                                                              
          </p>                                                                                                                            
        )}                                                                                                                                
                
        <div className="flex items-center gap-3 mt-3 type-caption text-text-tertiary">                                                    
          {rec.rating && <span>⭐ {rec.rating}</span>}
          {rec.price_level && <span>{rec.price_level}</span>}                                                                             
          {rec.address && <span className="truncate">{rec.address}</span>}                                                                
        </div>
      </Link>
    </Card>
  );
}
