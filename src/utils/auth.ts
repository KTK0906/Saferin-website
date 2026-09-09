const usernamePattern = /^[a-z0-9_]{3,30}$/

export const normalizeUsername = (username: string) => username.trim().toLowerCase()

export const usernameToInternalEmail = (username: string) => {
  const normalizedUsername = normalizeUsername(username)

  if (!usernamePattern.test(normalizedUsername))
    throw new Error('Username must contain 3–30 lowercase letters, numbers, or underscores.')

  const projectRef = new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0]

  return `${normalizedUsername}@${projectRef}.invalid`
}
