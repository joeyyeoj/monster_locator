type TrustInfo = {
  confirmCount: number;
  denyCount: number;
  trustScore: number;
  badge: "verified" | "contested" | "new";
  hiddenByModeration: boolean;
};

export function computeTrust(confirmCount: number, denyCount: number): TrustInfo {
  const trustScore = confirmCount - denyCount;

  let badge: TrustInfo["badge"] = "new";
  if (trustScore >= 3) {
    badge = "verified";
  } else if (trustScore < 0) {
    badge = "contested";
  }

  return {
    confirmCount,
    denyCount,
    trustScore,
    badge,
    hiddenByModeration: trustScore <= -3
  };
}
