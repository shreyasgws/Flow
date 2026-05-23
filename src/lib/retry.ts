export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelay = 1000,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt === maxRetries) throw err
      await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, attempt)))
    }
  }
  throw new Error('unreachable')
}
