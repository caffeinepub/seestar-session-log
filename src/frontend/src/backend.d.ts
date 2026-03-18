import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Location {
    name: string;
}
export interface DateTime {
    timestamp: bigint;
    timeZone: string;
}
export interface Rating {
    review?: string;
    value: bigint;
}
export interface SessionStats {
    uniqueTargets: bigint;
    averageRating: number;
    totalSessions: bigint;
}
export interface EnvironmentalConditions {
    temperature: number;
    transparency: bigint;
    bortleClass: bigint;
    seeing: bigint;
    windSpeed: number;
    humidity: bigint;
}
export interface ObservingSession {
    id: number;
    title: string;
    createdAt: bigint;
    createdBy: Principal;
    updatedAt: bigint;
    notes: string;
    targetName: string;
    targetType: string;
    conditions: EnvironmentalConditions;
    rating: Rating;
    exposureDetails: ExposureDetails;
    dateTime: DateTime;
    location: Location;
}
export interface UserProfile {
    name: string;
}
export interface ExposureDetails {
    duration: number;
    gain: bigint;
    filter: string;
    units: string;
    stackingFrames: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createSession(session: ObservingSession): Promise<number>;
    deleteSession(sessionId: number): Promise<boolean>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSession(sessionId: number): Promise<ObservingSession | null>;
    getSessions(): Promise<Array<ObservingSession>>;
    getStats(): Promise<SessionStats>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateSession(sessionId: number, updatedSession: ObservingSession): Promise<void>;
}
