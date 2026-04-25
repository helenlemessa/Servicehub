import { Link } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt } from 'react-icons/fa';

const ServiceCard = ({ service }) => {
  return (
    <Link to={`/services/${service._id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {service.images?.[0] && (
          <img
            src={service.images[0]}
            alt={service.title}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2 line-clamp-2">{service.title}</h3>
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{service.description}</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl font-bold text-blue-600">
              {service.price} ETB
            </span>
            <div className="flex items-center">
              <FaStar className="text-yellow-400 mr-1" />
              <span>{service.seller?.rating?.toFixed(1) || 'New'}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="capitalize">{service.category}</span>
            {service.seller?.location?.city && (
              <div className="flex items-center">
                <FaMapMarkerAlt className="mr-1 text-xs" />
                <span>{service.seller.location.city}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ServiceCard;