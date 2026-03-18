import Int "mo:core/Int";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Nat32 "mo:core/Nat32";
import Set "mo:core/Set";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Authorization system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Types and Conversion
  type DateTime = {
    timestamp : Int;
    timeZone : Text;
  };

  type ExposureDetails = {
    duration : Float;
    units : Text;
    gain : Nat;
    filter : Text;
    stackingFrames : Nat;
  };

  type EnvironmentalConditions = {
    seeing : Nat;
    transparency : Nat;
    bortleClass : Nat;
    temperature : Float;
    humidity : Nat;
    windSpeed : Float;
  };

  type Location = {
    name : Text;
  };

  type Rating = {
    value : Nat;
    review : ?Text;
  };

  public type ObservingSession = {
    id : Nat32;
    title : Text;
    dateTime : DateTime;
    location : Location;
    targetName : Text;
    targetType : Text;
    exposureDetails : ExposureDetails;
    conditions : EnvironmentalConditions;
    notes : Text;
    rating : Rating;
    createdBy : Principal;
    createdAt : Int;
    updatedAt : Int;
  };

  module ObservingSession {
    public func compare(session1 : ObservingSession, session2 : ObservingSession) : Order.Order {
      Nat32.compare(session1.id, session2.id);
    };
  };

  public type SessionStats = {
    totalSessions : Nat;
    uniqueTargets : Nat;
    averageRating : Float;
  };

  // State and Storage
  var nextSessionId = 0;
  let observingSessions = Map.empty<Nat32, ObservingSession>();
  let userSessionsIndex = Map.empty<Principal, Set.Set<Nat32>>();

  func getSessionsForUserInternal(user : Principal) : Set.Set<Nat32> {
    switch (userSessionsIndex.get(user)) {
      case (?sessions) { sessions };
      case (null) {
        let newSet = Set.empty<Nat32>();
        userSessionsIndex.add(user, newSet);
        newSet;
      };
    };
  };

  // Core Operations
  func createSessionInternal(creator : Principal, session : ObservingSession) : Nat32 {
    let sessionId : Nat32 = Nat32.fromNat(nextSessionId);
    nextSessionId += 1;

    let newSession = {
      session with
      id = sessionId;
      createdBy = creator;
      createdAt = Time.now();
      updatedAt = Time.now();
    };

    observingSessions.add(sessionId, newSession);

    let sessions = getSessionsForUserInternal(creator);
    sessions.add(sessionId);

    sessionId;
  };

  func updateSessionInternal(updater : Principal, sessionId : Nat32, updatedSession : ObservingSession) {
    switch (observingSessions.get(sessionId)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?existingSession) {
        if (existingSession.createdBy != updater) {
          Runtime.trap("Unauthorized: Cannot modify session");
        };

        let mergedSession = {
          existingSession with
          title = updatedSession.title;
          dateTime = updatedSession.dateTime;
          location = updatedSession.location;
          targetName = updatedSession.targetName;
          targetType = updatedSession.targetType;
          exposureDetails = updatedSession.exposureDetails;
          conditions = updatedSession.conditions;
          notes = updatedSession.notes;
          rating = updatedSession.rating;
          updatedAt = Time.now();
        };

        observingSessions.add(sessionId, mergedSession);
      };
    };
  };

  func deleteSessionInternal(deleter : Principal, sessionId : Nat32) : Bool {
    switch (observingSessions.get(sessionId)) {
      case (null) { false };
      case (?session) {
        if (session.createdBy != deleter) {
          Runtime.trap("Unauthorized: Cannot delete session");
        };

        observingSessions.remove(sessionId);

        let sessions = getSessionsForUserInternal(deleter);
        sessions.remove(sessionId);
        true;
      };
    };
  };

  // Stats Calculation
  func calculateStats(forUser : Principal) : SessionStats {
    let sessionsIter = getSessionsForUserInternal(forUser).values();

    let sessionCount = getSessionsForUserInternal(forUser).size();

    let uniqueTargetsMap = Map.empty<Text, ()>();
    sessionsIter.forEach(
      func(sessionId) {
        switch (observingSessions.get(sessionId)) {
          case (?session) { uniqueTargetsMap.add(session.targetName, ()) };
          case (null) {};
        };
      }
    );

    // Calculate average rating
    var totalRating = 0.0;
    var ratedSessionCount = 0;

    let allSessionsIter = observingSessions.values();
    allSessionsIter.forEach(
      func(session) {
        if (session.createdBy == forUser and session.rating.value > 0) {
          totalRating += session.rating.value.toFloat();
          ratedSessionCount += 1;
        };
      }
    );

    let averageRating = if (ratedSessionCount > 0) {
      totalRating / ratedSessionCount.toFloat();
    } else {
      0.0;
    };

    {
      totalSessions = sessionCount;
      uniqueTargets = uniqueTargetsMap.size();
      averageRating;
    };
  };

  // Public API
  public shared ({ caller }) func createSession(session : ObservingSession) : async Nat32 {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create sessions");
    };
    createSessionInternal(caller, session);
  };

  public query ({ caller }) func getSessions() : async [ObservingSession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can retrieve sessions");
    };

    let sessionIds = switch (userSessionsIndex.get(caller)) {
      case (null) { Set.empty<Nat32>() };
      case (?sessions) { sessions };
    };

    sessionIds.toArray().map(
      func(sessionId) {
        switch (observingSessions.get(sessionId)) {
          case (null) { [] };
          case (?session) { [session] };
        };
      }
    ).flatten();
  };

  public query ({ caller }) func getSession(sessionId : Nat32) : async ?ObservingSession {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can retrieve sessions");
    };

    switch (observingSessions.get(sessionId)) {
      case (null) { null };
      case (?session) {
        if (session.createdBy != caller) {
          Runtime.trap("Unauthorized: Cannot view session");
        };
        ?session;
      };
    };
  };

  public shared ({ caller }) func updateSession(sessionId : Nat32, updatedSession : ObservingSession) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update sessions");
    };
    updateSessionInternal(caller, sessionId, updatedSession);
  };

  public shared ({ caller }) func deleteSession(sessionId : Nat32) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete sessions");
    };
    deleteSessionInternal(caller, sessionId);
  };

  public query ({ caller }) func getStats() : async SessionStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can retrieve stats");
    };
    calculateStats(caller);
  };
};
