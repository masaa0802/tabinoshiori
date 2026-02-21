"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { useGoogleMaps } from "@/components/GoogleMapsProvider";

interface ActivityImageProps {
  src: string;
  alt: string;
  placeId?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

const ActivityImage: React.FC<ActivityImageProps> = ({
  src,
  alt,
  placeId,
  fill,
  width,
  height,
  className,
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hidden, setHidden] = useState(false);
  const hasRetried = useRef(false);
  const { isLoaded } = useGoogleMaps();

  useEffect(() => {
    setImageSrc(src);
    setHidden(false);
    hasRetried.current = false;
  }, [src]);

  const handleError = useCallback(() => {
    if (hasRetried.current || !placeId || !isLoaded) {
      setHidden(true);
      return;
    }

    hasRetried.current = true;

    try {
      const mapDiv = document.createElement("div");
      const map = new window.google.maps.Map(mapDiv);
      const service = new window.google.maps.places.PlacesService(map);

      service.getDetails(
        { placeId, fields: ["photos"] },
        (place, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            place?.photos?.length
          ) {
            const newUrl = place.photos[0].getUrl({ maxWidth: 400 });
            setImageSrc(newUrl);
          } else {
            setHidden(true);
          }
        }
      );
    } catch {
      setHidden(true);
    }
  }, [placeId, isLoaded]);

  if (hidden) return null;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      className={className}
      onError={handleError}
    />
  );
};

export default ActivityImage;
