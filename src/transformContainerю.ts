interface Point {
  x: number;
  y: number;
}
export class TransformContainer {
  private container: HTMLElement;
  private content: HTMLElement;
  
  private scale: number = 1;
  private offset: Point = { x: 0, y: 0 };
  
  // Состояние для перемещения
  private isDragging: boolean = false;
  private startMousePos: Point = { x: 0, y: 0 };
  private startOffset: Point = { x: 0, y: 0 };
  
  // Состояние для Pinch-zoom (тачи)
  private initialPinchDistance: number = 0;
  private initialScale: number = 1;

  constructor(containerId: string, contentId: string) {
    this.container = document.getElementById(containerId) as HTMLElement;
    this.content = document.getElementById(contentId) as HTMLElement;

    this.initStyles();
    this.initEvents();
  }

  private initStyles(): void {
    this.container.style.overflow = 'hidden';
    this.container.style.touchAction = 'none'; // Отключает браузерный скролл
    this.content.style.transformOrigin = '0 0';
    this.content.style.willChange = 'transform';
  }

  private initEvents(): void {
    // Колесо мыши (Zoom)
    this.container.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

    // Мышь (Pan)
    this.container.addEventListener('mousedown', (e) => this.dragStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => this.dragMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => this.dragEnd());

    // Тачи (Pan & Zoom)
    this.container.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.container.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.container.addEventListener('touchend', () => this.handleTouchEnd());
  }

  private updateTransform(): void {
    this.content.style.transform = `translate(${this.offset.x}px, ${this.offset.y}px) scale(${this.scale})`;
  }

  // --- ЛОГИКА ZOOM ---
  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    const zoomSpeed = 0.001;
    const delta = -e.deltaY;
    const newScale = Math.min(Math.max(0.1, this.scale + delta * zoomSpeed), 10);
    
    this.applyZoom(newScale, e.clientX, e.clientY);
  }

  private applyZoom(newScale: number, centerX: number, centerY: number): void {
    const rect = this.container.getBoundingClientRect();
    
    // Координаты точки зума относительно контента
    const mouseX = (centerX - rect.left - this.offset.x) / this.scale;
    const mouseY = (centerY - rect.top - this.offset.y) / this.scale;

    // Сдвиг оффсета, чтобы точка под курсором осталась на месте
    this.offset.x -= mouseX * (newScale - this.scale);
    this.offset.y -= mouseY * (newScale - this.scale);
    
    this.scale = newScale;
    this.updateTransform();
  }

  // --- ЛОГИКА PAN (Мышь) ---
  private dragStart(x: number, y: number): void {
    this.isDragging = true;
    this.startMousePos = { x, y };
    this.startOffset = { ...this.offset };
  }

  private dragMove(x: number, y: number): void {
    if (!this.isDragging) return;
    this.offset.x = this.startOffset.x + (x - this.startMousePos.x);
    this.offset.y = this.startOffset.y + (y - this.startMousePos.y);
    this.updateTransform();
  }

  private dragEnd(): void {
    this.isDragging = false;
  }

  // --- ЛОГИКА ТАЧЕЙ ---
  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.dragStart(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      this.isDragging = false; // Прерываем обычный драг
      this.initialPinchDistance = this.getDistance(e.touches[0], e.touches[1]);
      this.initialScale = this.scale;
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.dragMove(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      const currentDist = this.getDistance(e.touches[0], e.touches[1]);
      const newScale = (currentDist / this.initialPinchDistance) * this.initialScale;
      
      // Центр между двумя пальцами для зума
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      this.applyZoom(Math.min(Math.max(0.1, newScale), 10), midX, midY);
    }
  }

  private handleTouchEnd(): void {
    this.dragEnd();
  }

  private getDistance(t1: Touch, t2: Touch): number {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  }
}