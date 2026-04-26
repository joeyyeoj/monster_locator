import type {
  AvailabilityType,
  DisplayAvailabilityType,
  DuplicateCandidate,
  LocationRecord,
  NearbyLocation,
  ResolvedSubmissionPayload,
  VoteType
} from "@/lib/types";
import { prisma } from "@/lib/db/prisma";
import { seedLocations } from "@/lib/data/seedLocations";
import { haversineKm } from "@/lib/services/geo";
import { computeTrust } from "@/lib/services/trustService";

type VoteRecord = {
  locationId: string;
  voterHash: string;
  voteType: VoteType;
};

type TemperatureVoteRecord = {
  locationId: string;
  voterHash: string;
  availabilityType: "cold" | "shelf";
};

const memoryLocations: LocationRecord[] = seedLocations.map((seed, index) => {
  const now = new Date().toISOString();
  return {
    id: `seed-${index + 1}`,
    name: seed.name,
    address: seed.address,
    placeType: seed.placeType,
    lat: seed.lat,
    lng: seed.lng,
    availabilityType: seed.availabilityType,
    sourceType: "seeded",
    trustScore: 0,
    confirmCount: 0,
    denyCount: 0,
    createdAt: now,
    updatedAt: now
  };
});

const memoryVotes: VoteRecord[] = [];
const memoryTemperatureVotes: TemperatureVoteRecord[] = [];
const temperatureVoteNote = "temp_vote";

function normalizeAvailability(value: string): AvailabilityType {
  if (value === "cold" || value === "shelf" || value === "unknown") {
    return value;
  }
  return "unknown";
}

function hydrateTrust(location: LocationRecord): LocationRecord {
  const votes = memoryVotes.filter((vote) => vote.locationId === location.id);
  const confirmCount = votes.filter((vote) => vote.voteType === "confirm").length;
  const denyCount = votes.filter((vote) => vote.voteType === "deny").length;
  const temperatureVotes = memoryTemperatureVotes.filter((vote) => vote.locationId === location.id);
  const trust = computeTrust(confirmCount, denyCount);
  return {
    ...location,
    availabilityType: resolveAvailabilityType(
      normalizeAvailability(location.availabilityType),
      temperatureVotes.map((vote) => vote.availabilityType)
    ),
    confirmCount,
    denyCount,
    trustScore: trust.trustScore
  };
}

function resolveAvailabilityType(
  baseAvailability: AvailabilityType,
  temperatureVotes: AvailabilityType[]
): DisplayAvailabilityType {
  const counts: Record<AvailabilityType, number> = {
    cold: 0,
    shelf: 0,
    unknown: 0
  };

  counts[baseAvailability] += 1;
  for (const vote of temperatureVotes) {
    counts[vote] += 1;
  }

  if (
    counts.cold > 0 &&
    counts.shelf > 0 &&
    counts.cold + counts.shelf >= counts.unknown + 2
  ) {
    return "both";
  }

  const ordered: AvailabilityType[] = ["cold", "shelf", "unknown"];
  let winner = baseAvailability;
  let max = counts[baseAvailability];
  for (const candidate of ordered) {
    if (counts[candidate] > max) {
      winner = candidate;
      max = counts[candidate];
    }
  }
  return winner;
}

function extractTemperatureVotes(
  submissions: Array<{ availabilityType: string; note: string | null }>
): AvailabilityType[] {
  return submissions
    .filter((submission) => submission.note === temperatureVoteNote)
    .map((submission) => normalizeAvailability(submission.availabilityType));
}

type DuplicateCheckResult = {
  isHardDuplicate: boolean;
  isPotentialDuplicate: boolean;
  candidates: DuplicateCandidate[];
};

type LocationForDuplicateCheck = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value: string): Set<string> {
  return new Set(normalizeText(value).split(" ").filter((token) => token.length > 1));
}

function jaccardSimilarity(left: string, right: string): number {
  const leftTokens = tokenSet(left);
  const rightTokens = tokenSet(right);
  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  }
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union === 0 ? 0 : overlap / union;
}

function computeDuplicateScore(
  payload: ResolvedSubmissionPayload,
  existing: LocationForDuplicateCheck
): { distanceKm: number; duplicateScore: number; nameSimilarity: number; addressSimilarity: number } {
  const distanceKm = haversineKm(payload.lat, payload.lng, existing.lat, existing.lng);
  const nameSimilarity = jaccardSimilarity(payload.name, existing.name);
  const addressSimilarity = jaccardSimilarity(payload.address, existing.address);

  const distanceScore =
    distanceKm <= 0.03
      ? 1
      : distanceKm <= 0.08
        ? 0.8
        : distanceKm <= 0.15
          ? 0.55
          : distanceKm <= 0.3
            ? 0.25
            : 0;

  const duplicateScore = distanceScore * 0.55 + nameSimilarity * 0.3 + addressSimilarity * 0.15;
  return { distanceKm, duplicateScore, nameSimilarity, addressSimilarity };
}

function evaluateDuplicateCandidates(
  payload: ResolvedSubmissionPayload,
  locations: LocationForDuplicateCheck[]
): DuplicateCheckResult {
  const ranked = locations
    .map((location) => {
      const scored = computeDuplicateScore(payload, location);
      return {
        id: location.id,
        name: location.name,
        address: location.address,
        distanceKm: scored.distanceKm,
        duplicateScore: scored.duplicateScore,
        nameSimilarity: scored.nameSimilarity,
        addressSimilarity: scored.addressSimilarity
      };
    })
    .filter((entry) => entry.distanceKm <= 0.35)
    .sort((a, b) => {
      if (b.duplicateScore === a.duplicateScore) {
        return a.distanceKm - b.distanceKm;
      }
      return b.duplicateScore - a.duplicateScore;
    });

  const candidates: DuplicateCandidate[] = ranked.slice(0, 3).map((entry) => ({
    id: entry.id,
    name: entry.name,
    address: entry.address,
    distanceKm: entry.distanceKm,
    duplicateScore: Number(entry.duplicateScore.toFixed(3))
  }));

  const best = ranked[0];
  if (!best) {
    return { isHardDuplicate: false, isPotentialDuplicate: false, candidates: [] };
  }

  const sameAddressStrong =
    normalizeText(payload.address) === normalizeText(best.address) && best.distanceKm < 0.2;
  const isHardDuplicate =
    best.duplicateScore >= 0.9 ||
    sameAddressStrong ||
    (best.distanceKm <= 0.05 && best.nameSimilarity >= 0.55);
  const isPotentialDuplicate =
    !isHardDuplicate &&
    (best.duplicateScore >= 0.72 || (best.distanceKm <= 0.1 && best.nameSimilarity >= 0.35));

  return {
    isHardDuplicate,
    isPotentialDuplicate,
    candidates
  };
}

export async function ensureSeedData(): Promise<void> {
  try {
    const count = await prisma.location.count();
    if (count > 0) {
      return;
    }
    for (const seed of seedLocations) {
      await prisma.location.create({
        data: {
          name: seed.name,
          address: seed.address,
          placeType: seed.placeType,
          lat: seed.lat,
          lng: seed.lng,
          sourceType: "seeded",
          availabilityType: seed.availabilityType
        }
      });
    }
  } catch {
    // Fallback memory store already includes seeds.
  }
}

export async function getNearbyLocations(params: {
  lat: number;
  lng: number;
  radiusKm: number;
}): Promise<NearbyLocation[]> {
  await ensureSeedData();
  const { lat, lng, radiusKm } = params;

  try {
    const locations = await prisma.location.findMany({
      include: { votes: true, submissions: true },
      where: { moderationFlag: false }
    });

    return locations
      .map((location) => {
        const confirmCount = location.votes.filter((vote) => vote.voteType === "confirm").length;
        const denyCount = location.votes.filter((vote) => vote.voteType === "deny").length;
        const temperatureVotes = extractTemperatureVotes(location.submissions);
        const trust = computeTrust(confirmCount, denyCount);
        const distanceKm = haversineKm(lat, lng, location.lat, location.lng);

        return {
          id: location.id,
          name: location.name,
          address: location.address,
          placeType: location.placeType,
          lat: location.lat,
          lng: location.lng,
          photoUrl: location.photoUrl,
          availabilityType: resolveAvailabilityType(
            normalizeAvailability(location.availabilityType),
            temperatureVotes
          ),
          sourceType: location.sourceType,
          trustScore: trust.trustScore,
          confirmCount,
          denyCount,
          createdAt: location.createdAt.toISOString(),
          updatedAt: location.updatedAt.toISOString(),
          distanceKm
        } satisfies NearbyLocation;
      })
      .filter((location) => location.distanceKm <= radiusKm && location.trustScore > -3)
      .sort((a, b) => {
        if (a.distanceKm === b.distanceKm) {
          return b.trustScore - a.trustScore;
        }
        return a.distanceKm - b.distanceKm;
      });
  } catch {
    return memoryLocations
      .map((location) => hydrateTrust(location))
      .map((location) => ({
        ...location,
        distanceKm: haversineKm(lat, lng, location.lat, location.lng)
      }))
      .filter((location) => location.distanceKm <= radiusKm && location.trustScore > -3)
      .sort((a, b) => {
        if (a.distanceKm === b.distanceKm) {
          return b.trustScore - a.trustScore;
        }
        return a.distanceKm - b.distanceKm;
      });
  }
}

export async function getLocationById(id: string): Promise<LocationRecord | null> {
  try {
    const location = await prisma.location.findUnique({
      where: { id },
      include: { votes: true, submissions: true }
    });
    if (!location) {
      return null;
    }
    const confirmCount = location.votes.filter((vote) => vote.voteType === "confirm").length;
    const denyCount = location.votes.filter((vote) => vote.voteType === "deny").length;
    const temperatureVotes = extractTemperatureVotes(location.submissions);
    const trust = computeTrust(confirmCount, denyCount);
    return {
      id: location.id,
      name: location.name,
      address: location.address,
      placeType: location.placeType,
      lat: location.lat,
      lng: location.lng,
      photoUrl: location.photoUrl,
      availabilityType: resolveAvailabilityType(
        normalizeAvailability(location.availabilityType),
        temperatureVotes
      ),
      sourceType: location.sourceType,
      trustScore: trust.trustScore,
      confirmCount,
      denyCount,
      createdAt: location.createdAt.toISOString(),
      updatedAt: location.updatedAt.toISOString()
    };
  } catch {
    const location = memoryLocations.find((entry) => entry.id === id);
    if (!location) {
      return null;
    }
    return hydrateTrust(location);
  }
}

export async function getIndexableLocations(): Promise<Array<{ id: string; updatedAt: string }>> {
  await ensureSeedData();

  try {
    const locations = await prisma.location.findMany({
      where: { moderationFlag: false },
      select: { id: true, updatedAt: true }
    });

    return locations.map((location) => ({
      id: location.id,
      updatedAt: location.updatedAt.toISOString()
    }));
  } catch {
    return memoryLocations.map((location) => ({
      id: location.id,
      updatedAt: location.updatedAt
    }));
  }
}

export async function createSubmission(
  payload: ResolvedSubmissionPayload,
  submitterHash: string,
  options?: { forceCreate?: boolean }
): Promise<
  | { status: "created"; locationId: string }
  | { status: "duplicate"; locationId?: string; candidates: DuplicateCandidate[] }
> {
  const shouldForceCreate = options?.forceCreate ?? false;

  try {
    const nearby = await prisma.location.findMany();
    const duplicateCheck = evaluateDuplicateCandidates(
      payload,
      nearby.map((location) => ({
        id: location.id,
        name: location.name,
        address: location.address,
        lat: location.lat,
        lng: location.lng
      }))
    );
    const bestCandidate = duplicateCheck.candidates[0];

    if (!shouldForceCreate && (duplicateCheck.isHardDuplicate || duplicateCheck.isPotentialDuplicate)) {
      await prisma.submission.create({
        data: {
          locationId: bestCandidate?.id,
          submitterHash,
          name: payload.name,
          address: payload.address,
          placeType: payload.placeType,
          lat: payload.lat,
          lng: payload.lng,
          photoUrl: payload.photoUrl ?? null,
          availabilityType: payload.availabilityType,
          status: "rejected",
          note: duplicateCheck.isHardDuplicate
            ? "Waarschijnlijk dubbele locatie"
            : "Mogelijk dubbele locatie - bevestiging nodig"
        }
      });
      return { status: "duplicate", locationId: bestCandidate?.id, candidates: duplicateCheck.candidates };
    }

    const location = await prisma.location.create({
      data: {
        name: payload.name,
        address: payload.address,
        placeType: payload.placeType,
        lat: payload.lat,
        lng: payload.lng,
        photoUrl: payload.photoUrl ?? null,
        availabilityType: payload.availabilityType,
        sourceType: "user_submitted"
      }
    });

    await prisma.submission.create({
      data: {
        locationId: location.id,
        submitterHash,
        name: payload.name,
        address: payload.address,
        placeType: payload.placeType,
        lat: payload.lat,
        lng: payload.lng,
        photoUrl: payload.photoUrl ?? null,
        availabilityType: payload.availabilityType,
        status: "approved",
        note: payload.note
      }
    });

    return { status: "created", locationId: location.id };
  } catch {
    const duplicateCheck = evaluateDuplicateCandidates(
      payload,
      memoryLocations.map((location) => ({
        id: location.id,
        name: location.name,
        address: location.address,
        lat: location.lat,
        lng: location.lng
      }))
    );
    const bestCandidate = duplicateCheck.candidates[0];
    if (!shouldForceCreate && (duplicateCheck.isHardDuplicate || duplicateCheck.isPotentialDuplicate)) {
      return {
        status: "duplicate",
        locationId: bestCandidate?.id,
        candidates: duplicateCheck.candidates
      };
    }

    const now = new Date().toISOString();
    const location: LocationRecord = {
      id: `user-${memoryLocations.length + 1}`,
      name: payload.name,
      address: payload.address,
      placeType: payload.placeType,
      lat: payload.lat,
      lng: payload.lng,
      photoUrl: payload.photoUrl ?? null,
      availabilityType: payload.availabilityType,
      sourceType: "user_submitted",
      trustScore: 0,
      confirmCount: 0,
      denyCount: 0,
      createdAt: now,
      updatedAt: now
    };
    memoryLocations.push(location);
    return { status: "created", locationId: location.id };
  }
}

export async function castVote(
  locationId: string,
  voteType: VoteType,
  voterHash: string
): Promise<LocationRecord | null> {
  try {
    const vote = await prisma.vote.findUnique({
      where: { locationId_voterHash: { locationId, voterHash } }
    });

    if (!vote) {
      await prisma.vote.create({ data: { locationId, voteType, voterHash } });
    } else if (vote.voteType !== voteType) {
      await prisma.vote.update({
        where: { locationId_voterHash: { locationId, voterHash } },
        data: { voteType }
      });
    }

    const location = await getLocationById(locationId);
    if (!location) {
      return null;
    }

    const moderationFlag = location.trustScore <= -3;
    await prisma.location.update({
      where: { id: locationId },
      data: { trustScore: location.trustScore, moderationFlag }
    });
    return location;
  } catch {
    const location = memoryLocations.find((entry) => entry.id === locationId);
    if (!location) {
      return null;
    }
    const existing = memoryVotes.find(
      (entry) => entry.locationId === locationId && entry.voterHash === voterHash
    );
    if (!existing) {
      memoryVotes.push({ locationId, voterHash, voteType });
    } else {
      existing.voteType = voteType;
    }
    return hydrateTrust(location);
  }
}

export async function castTemperatureVote(
  locationId: string,
  availabilityType: "cold" | "shelf" | "both",
  voterHash: string
): Promise<LocationRecord | null> {
  try {
    const location = await prisma.location.findUnique({
      where: { id: locationId }
    });
    if (!location) {
      return null;
    }

    const existingVotes = await prisma.submission.findMany({
      where: {
        locationId,
        submitterHash: voterHash,
        note: temperatureVoteNote
      }
    });

    if (existingVotes.length > 0) {
      await prisma.submission.deleteMany({
        where: {
          locationId,
          submitterHash: voterHash,
          note: temperatureVoteNote
        }
      });
    }

    const voteValues: ("cold" | "shelf")[] =
      availabilityType === "both" ? ["cold", "shelf"] : [availabilityType];

    for (const voteValue of voteValues) {
      await prisma.submission.create({
        data: {
          locationId,
          submitterHash: voterHash,
          name: location.name,
          address: location.address,
          placeType: location.placeType,
          lat: location.lat,
          lng: location.lng,
          availabilityType: voteValue,
          status: "approved",
          note: temperatureVoteNote
        }
      });
    }

    return await getLocationById(locationId);
  } catch {
    const location = memoryLocations.find((entry) => entry.id === locationId);
    if (!location) {
      return null;
    }

    for (let index = memoryTemperatureVotes.length - 1; index >= 0; index -= 1) {
      const vote = memoryTemperatureVotes[index];
      if (vote.locationId === locationId && vote.voterHash === voterHash) {
        memoryTemperatureVotes.splice(index, 1);
      }
    }

    if (availabilityType === "both") {
      memoryTemperatureVotes.push(
        { locationId, voterHash, availabilityType: "cold" },
        { locationId, voterHash, availabilityType: "shelf" }
      );
    } else {
      memoryTemperatureVotes.push({ locationId, voterHash, availabilityType });
    }

    return hydrateTrust(location);
  }
}
