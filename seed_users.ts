/**
 * 🔐 TropicTech User Data Backup (seed_users.ts)
 * This file contains all current user credentials synced from the database.
 */

export const USERS_DATA = [
  {
    fullName: "System Admin",
    email: "admin@tropictech.online",
    username: "admin_sys",
    role: "ADMIN",
    password: "*HASHED_ONLY*"
  },
  {
    fullName: "Administrator",
    email: "admin@tropictech.com",
    username: "admin",
    role: "ADMIN",
    password: "*HASHED_ONLY*"
  },
  {
    fullName: "tropictechbali",
    email: "tropictechbali@gmail.com",
    username: "tropictechbali",
    role: "ADMIN",
    password: "*HASHED_ONLY*"
  },
  {
    fullName: "Bayu Damn",
    email: "damnbayu@gmail.com",
    username: "bayudamn483",
    role: "ADMIN",
    password: "*HASHED_ONLY*"
  },
  {
    fullName: "Jasper P Parson",
    email: "tropictechindo@gmail.com",
    username: "jasperadmin",
    role: "ADMIN",
    password: "*HASHED_ONLY*"
  },
  {
    fullName: "Test User",
    email: "user@testdomain.fun",
    username: "testuser",
    role: "USER",
    password: "*HASHED_ONLY*"
  },
  {
    fullName: "User Example",
    email: "user@tropictechbali.com",
    username: "user_tropictech",
    role: "USER",
    password: "*HASHED_ONLY*"
  },
  {
    fullName: "Indonesian Visas",
    email: "ceo@indonesianvisas.agency",
    username: "indonesian264",
    role: "USER",
    password: "*HASHED_ONLY*"
  },
  {
    fullName: "Tropic Tech Worker",
    email: "worker@tropictechbali.com",
    username: "worker_tropictech",
    role: "WORKER",
    password: "*HASHED_ONLY*"
  },
  {
    fullName: "Test Worker",
    email: "worker@testdomain.fun",
    username: "testworker",
    role: "WORKER",
    password: "*HASHED_ONLY*"
  },
];

console.log("✅ User data backup loaded successfully with 10 users.");
