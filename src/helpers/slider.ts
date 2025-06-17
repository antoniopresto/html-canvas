import { invariant } from './invariant.ts';
import { loadImage } from './load-image.ts';

export type CanvasSliderParams = {
  canvasId: string;
  images: { src: string }[];
};

type Slide = {
  promise: Promise<HTMLImageElement>;
  status: 'loaded' | 'loading' | 'failed';
  image: HTMLImageElement | null;
};

export function createSlider(params: CanvasSliderParams) {
  const { canvasId, images: _images } = params;
  const imageSources = [..._images];
  const maxIndex = imageSources.length - 1;

  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  invariant(canvas, `Canvas with id ${canvasId} not found.`);

  const canvasContext = canvas.getContext('2d');
  invariant(canvasContext, 'Failed to generate canvas context');

  const slides: Slide[] = [];

  let activeSlideIndex = 0;
  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let previousTranslate = 0;
  let slideWidth = canvas.width;
  canvas.style.cursor = 'grab';

  const fetchSlide = async (index: number) => {
    if (slides[index]) return slides[index].promise;
    const entry = imageSources[index];
    if (!entry) return;

    const { src } = entry;

    const slide: Slide = {
      image: null,
      promise: loadImage(src)
        .then((result) => {
          slide.status = 'loaded';
          slide.image = result;
          return result;
        })
        .catch((error) => {
          slide.status = 'failed';
          throw error;
        }),
      status: 'loading',
    };

    slides.push(slide);
    return slide.promise;
  };

  const render = () => {
    fetchSlide(activeSlideIndex)
      .then(() => updateCanvas())
      .catch(console.error);

    fetchSlide(activeSlideIndex + 1)
      .then(() => updateCanvas())
      .catch(console.error);
  };

  const updateCanvas = () => {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    canvasContext.save();
    canvasContext.translate(currentTranslate, 0);

    slides.forEach((slide, index) => {
      if (!slide?.image) return;
      const image = slide.image;

      const scale = Math.min(
        canvas.width / image.width,
        canvas.height / image.height,
      );
      const scaledWidth = image.width * scale;
      const scaledHeight = image.height * scale;
      const slotX = index * slideWidth;
      const drawX = slotX + (slideWidth - scaledWidth) / 2;
      const drawY = (canvas.height - scaledHeight) / 2;
      canvasContext.drawImage(image, drawX, drawY, scaledWidth, scaledHeight);
    });

    canvasContext.restore();
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    canvas.style.cursor = 'grab';

    let targetSlide = Math.round(-currentTranslate / slideWidth);
    activeSlideIndex = Math.max(0, Math.min(targetSlide, maxIndex));
    // currentTranslate = -activeSlideIndex * slideWidth;
    render();
  };

  const onMouseDown = (event: MouseEvent): void => {
    isDragging = true;
    startX = event.clientX;
    canvas.style.cursor = 'grabbing';
    previousTranslate = currentTranslate;
  };

  const onMouseMove = (event: MouseEvent) => {
    if (!isDragging) return;
    const currentX = event.clientX;
    const dragDistance = currentX - startX;
    const newTranslate = previousTranslate + dragDistance;
    const maxTranslate = 0;
    const minTranslate = -(slides.length - 1) * slideWidth;
    currentTranslate = Math.max(
      minTranslate,
      Math.min(maxTranslate, newTranslate),
    );
    render();
  };

  const onTouchStart = (event: TouchEvent): void => {
    event.preventDefault();
    isDragging = true;
    startX = event.touches[0].clientX;
    previousTranslate = currentTranslate;
  };

  const onTouchEnd = (event: TouchEvent): void => {
    event.preventDefault();
    onMouseUp();
  };

  const onTouchMove = async (event: TouchEvent) => {
    event.preventDefault();
    if (!isDragging) return;
    const currentX = event.touches[0].clientX;
    const dragDistance = currentX - startX;
    const newTranslate = previousTranslate + dragDistance;
    const maxTranslate = 0;
    const minTranslate = -(slides.length - 1) * slideWidth;
    currentTranslate = Math.max(
      minTranslate,
      Math.min(maxTranslate, newTranslate),
    );
    render();
  };

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('touchstart', onTouchStart);
  canvas.addEventListener('touchend', onTouchEnd);
  canvas.addEventListener('touchmove', onTouchMove);

  render();
}
