// Hardcoded admin credentials for development/testing
// In production, these should be moved to environment variables or a secure configuration

export const ADMIN_CREDENTIALS = {
  email: "admin@cloudchaperone.com",
  password: "admin123456",
  userId: "admin-user-12345", // Mock admin user ID
  fullName: "System Administrator"
} as const;

// Helper function to check if credentials match admin
export const isAdminCredentials = (email: string, password: string): boolean => {
  return email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
};

// Helper function to check if user ID is admin
export const isAdminUserId = (userId: string): boolean => {
  return userId === ADMIN_CREDENTIALS.userId;
};
