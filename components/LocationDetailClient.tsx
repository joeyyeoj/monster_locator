"use client";

import { useState } from "react";
import NavAppButtons from "@/components/NavAppButtons";
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
      <NavAppButtons location={location} />
      <div style={{ marginTop: "0.8rem" }}>
        <TemperatureVoteButtons location={location} onVoted={setLocation} />
      </div>
      <div style={{ marginTop: "0.8rem" }}>
        <VoteButtons location={location} onVoted={setLocation} />
      </div>
    </>
  );
}
