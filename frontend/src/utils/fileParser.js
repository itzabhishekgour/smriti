export const parseEnvFile = (text) => {
  const secrets = {}
  const lines = text.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (match) {
      let key = match[1].trim()
      let value = match[2].trim()
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
      secrets[key] = value
    }
  }
  return secrets
}

export const parseJsonFile = (text) => {
  try {
    const parsed = JSON.parse(text)
    const secrets = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        secrets[key] = String(value)
      }
    }
    return secrets
  } catch (e) {
    console.error("JSON parsing failed", e)
    return {}
  }
}

export const parseFileContent = (filename, text) => {
  if (filename.endsWith('.json')) return parseJsonFile(text)
  return parseEnvFile(text)
}
