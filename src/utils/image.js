const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('This image could not be opened. Please use a JPEG, PNG, or WebP file.'));
    };
    image.src = objectUrl;
  });
}

function canvasToDataUrl(canvas, quality) {
  return canvas.toDataURL('image/jpeg', quality);
}

export async function prepareProfilePhoto(file, options = {}) {
  const size = options.size || 320;
  if (!file) return '';
  if (!file.type?.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('The selected photo is too large. Please choose an image below 8 MB.');

  const image = await loadImage(file);
  const shortestSide = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - shortestSide) / 2;
  const sourceY = (image.naturalHeight - shortestSide) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser could not process the photo.');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, size, size);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, sourceX, sourceY, shortestSide, shortestSide, 0, 0, size, size);

  let quality = 0.82;
  let dataUrl = canvasToDataUrl(canvas, quality);
  while (dataUrl.length > 90000 && quality > 0.46) {
    quality -= 0.08;
    dataUrl = canvasToDataUrl(canvas, quality);
  }
  return dataUrl;
}
