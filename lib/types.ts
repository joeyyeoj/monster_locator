export type AvailabilityType = "cold" | "shelf" | "unknown";
export type DisplayAvailabilityType = AvailabilityType | "both";
export type SourceType = "seeded" | "user_submitted";
export type SubmissionStatus = "pending" | "approved" | "rejected";
export type VoteType = "confirm" | "deny";

export type LocationRecord = {
  id: string;
  name: string;
  address: string;
  placeType: string;
  lat: number;
  lng: number;
  photoUrl?: string | null;
  availabilityType: DisplayAvailabilityType;
  sourceType: SourceType;
  trustScore: number;
  confirmCount: number;
  denyCount: number;
  createdAt: string;
  updatedAt: string;
};

export type NearbyLocation = LocationRecord & {
  distanceKm: number;
};

export type SubmissionPayload = {
  name: string;
  address: string;
  placeType: string;
  availabilityType: AvailabilityType;
  note?: string;
  /** Set by the API after optional blob upload; not sent from the browser as JSON. */
  photoUrl?: string | null;
};

export type ResolvedSubmissionPayload = SubmissionPayload & {
  lat: number;
  lng: number;
};

export type SeedLocationPayload = {
  name: string;
  address: string;
  placeType: string;
  lat: number;
  lng: number;
  availabilityType: AvailabilityType;
};

export type VotePayload = {
  locationId: string;
  voteType: VoteType;
};

export type TemperatureVotePayload = {
  locationId: string;
  availabilityType: "cold" | "shelf" | "both";
};

export type DuplicateCandidate = {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  duplicateScore: number;
};
