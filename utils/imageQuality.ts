
export interface ImageQualityResult {
  quality: 'good' | 'poor' | 'unreadable';
  issue?: 'too_dark' | 'too_bright' | 'blurry';
}

export function assessImageQuality(canvas: HTMLCanvasElement): ImageQualityResult {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { quality: 'unreadable' };

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // 1. Brightness Calculation
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Relative luminance formula
    totalBrightness += (0.299 * r + 0.587 * g + 0.114 * b);
  }
  const avgBrightness = totalBrightness / (canvas.width * canvas.height);

  if (avgBrightness < 40) return { quality: 'poor', issue: 'too_dark' };
  if (avgBrightness > 240) return { quality: 'poor', issue: 'too_bright' };

  // 2. Simple Blur Detection (Laplacian Variance approximation)
  // We sample pixels and look for sharp gradients
  let variance = 0;
  const sampleStep = 4;
  let count = 0;
  for (let y = 1; y < canvas.height - 1; y += sampleStep) {
    for (let x = 1; x < canvas.width - 1; x += sampleStep) {
      const idx = (y * canvas.width + x) * 4;
      const left = ((y * canvas.width + (x - 1)) * 4);
      const right = ((y * canvas.width + (x + 1)) * 4);
      const top = (((y - 1) * canvas.width + x) * 4);
      const bottom = (((y + 1) * canvas.width + x) * 4);

      // Gradient intensity
      const val = data[idx];
      const laplace = Math.abs(data[left] + data[right] + data[top] + data[bottom] - 4 * val);
      variance += laplace;
      count++;
    }
  }
  
  const blurScore = variance / count;
  if (blurScore < 5) return { quality: 'poor', issue: 'blurry' };

  return { quality: 'good' };
}
