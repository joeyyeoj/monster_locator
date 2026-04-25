import { SeedLocationPayload } from "@/lib/types";

export const seedLocations: SeedLocationPayload[] = [
  {
    name: "Albert Heijn Centraal",
    address: "Stationsplein 10, Amsterdam",
    placeType: "grocery",
    lat: 52.3791,
    lng: 4.8994,
    availabilityType: "unknown"
  },
  {
    name: "Jumbo City Utrecht",
    address: "Vredenburg 40, Utrecht",
    placeType: "grocery",
    lat: 52.0913,
    lng: 5.1175,
    availabilityType: "unknown"
  },
  {
    name: "PLUS Rotterdam Binnenrotte",
    address: "Binnenrotte 77, Rotterdam",
    placeType: "grocery",
    lat: 51.9226,
    lng: 4.4886,
    availabilityType: "unknown"
  },
  {
    name: "SPAR Eindhoven Centrum",
    address: "Demer 2, Eindhoven",
    placeType: "convenience",
    lat: 51.4418,
    lng: 5.4795,
    availabilityType: "unknown"
  }
];
