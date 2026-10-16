export function randomColor(random = Math.random) {
  return { r: Math.floor(random() * 256), g: Math.floor(random() * 256), b: Math.floor(random() * 256), a: Math.round((.35 + random() * .65) * 100) / 100 }
}

// Equal-weight, normalized Euclidean distance across the four RGBA channels.
export function rgbaAccuracy(target, guess) {
  const distance = Math.hypot(target.r - guess.r, target.g - guess.g, target.b - guess.b, (target.a - guess.a) * 255)
  return Math.round(Math.max(0, Math.min(100, (1 - distance / 510) * 100)) * 10) / 10
}

export function formatRGBA(color) { return `rgba(${color.r}, ${color.g}, ${color.b}, ${Number(color.a).toFixed(2)})` }
export function averageAccuracy(results) { return results.length ? Math.round(results.reduce((total, result) => total + result.accuracy, 0) / results.length * 10) / 10 : 0 }
