"use client";

import { useState } from "react";
import LocationPhotoBlock from "@/components/LocationPhotoBlock";
import TemperatureVoteButtons from "@/components/TemperatureVoteButtons";
import VoteButtons from "@/components/VoteButtons";
import type { LocationRecord } from "@/lib/types";

type Props = {
  initialLocation: LocationRecord;
};

export default function LocationDetailClient({ initialLocation }: Props) {
  const [location, setLocation] = useState<LocationRecord>(initialLocation);

  return (
    <>
      <LocationPhotoBlock variant="detail" location={location} onUpdated={setLocation} />
      <VoteButtons location={location} onVoted={setLocation} />
      <TemperatureVoteButtons location={location} onVoted={setLocation} />
    </>
  );
}
