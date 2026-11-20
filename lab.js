(() => {
  const lab = document.querySelector('#laboratorio');
  if (!lab) return;

  const pigments = {
    zanahoria: {
      name: 'Ámbar-naranja',
      color: '#c46023',
      description: 'Zanahoria · β-caroteno. En el ensayo preliminar secó en 3–4 min sobre papel bond.'
    },
    remolacha: {
      name: 'Carmín-violeta',
      color: '#a33c61',
      description: 'Remolacha · Betanina. En las pruebas dejó un trazo continuo entre rojo intenso y magenta.'
    },
    espinaca: {
      name: 'Verde bosque',
      color: '#4b672f',
      description: 'Espinaca · Clorofilas a y b. La extracción en frío produjo un tono de verde oliva a verde vegetal.'
    }
  };
  const pigmentButtons = [...lab.querySelectorAll('button[data-pigment]')]
    .filter(button => Object.hasOwn(pigments, button.dataset.pigment));
  const surface = lab.querySelector('#superficie');
  const canvas = lab.querySelector('#lienzo');
  const canvasArea = canvas?.closest('.canvas-area');
  const widthControl = lab.querySelector('#trazo');
  const widthLabel = lab.querySelector('#valor-trazo');
  const sampleName = lab.querySelector('#muestra-nombre');
  const sampleDescription = lab.querySelector('#muestra-descripcion');
  const status = lab.querySelector('#estado-lienzo');
  const undo = lab.querySelector('#deshacer-trazo');
  const clear = lab.querySelector('#limpiar-lienzo');
  const download = lab.querySelector('#descargar-muestra');

  if (!canvasArea || !surface || !widthControl || !undo || !clear || !download || !pigmentButtons.length) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  const strokes = [];
  const cursor = { x: 0.5, y: 0.5, visible: false };
  let activePointer = null;
  let keyboardStroke = null;
  let inkColor;
  let size = { width: 0, height: 0 };
  let paperColor;
  let paperPattern = null;

  const announce = message => {
    if (status) status.textContent = message;
  };

  const pixelDensity = () => Math.min(window.devicePixelRatio || 1, 3);

  function selectPigment(selectedButton, shouldAnnounce) {
    pigmentButtons.forEach(button => button.setAttribute('aria-pressed', String(button === selectedButton)));
    const pigment = pigments[selectedButton.dataset.pigment];
    const swatchColor = getComputedStyle(selectedButton).getPropertyValue('--ink-color').trim();
    inkColor = swatchColor || pigment.color;
    canvasArea.style.setProperty('--current-ink', inkColor);
    if (sampleName) sampleName.textContent = pigment.name;
    if (sampleDescription) sampleDescription.textContent = pigment.description;
    if (shouldAnnounce) announce(`Tinta ${pigment.name} seleccionada.`);
    if (cursor.visible) repaint();
  }

  function selectSurface(shouldAnnounce) {
    canvasArea.dataset.surface = surface.value;
    updatePaper();
    repaint();
    if (shouldAnnounce) announce(`Puedes dibujar sobre ${surface.selectedOptions[0].textContent.trim().toLowerCase()}.`);
  }

  function updatePaper() {
    const style = getComputedStyle(canvasArea);
    paperColor = style.getPropertyValue('--paper-color').trim() || '#fffbf2';
    paperPattern = null;
    const dotColor = style.getPropertyValue('--paper-dot-color').trim();
    if (!dotColor) return;

    const spacing = parseFloat(style.getPropertyValue('--paper-dot-spacing'));
    const core = parseFloat(style.getPropertyValue('--paper-dot-core'));
    const edge = parseFloat(style.getPropertyValue('--paper-dot-edge'));
    const tile = document.createElement('canvas');
    tile.width = tile.height = Math.ceil(spacing * pixelDensity());
    const tileContext = tile.getContext('2d');
    if (!tileContext) return;
    const scale = tile.width / spacing;
    const center = spacing / 2;
    tileContext.scale(scale, scale);
    const dot = tileContext.createRadialGradient(center, center, core, center, center, edge);
    dot.addColorStop(0, dotColor);
    dot.addColorStop(1, 'transparent');
    tileContext.fillStyle = dot;
    tileContext.fillRect(0, 0, spacing, spacing);
    const pattern = context.createPattern(tile, 'repeat');
    if (pattern) {
      pattern.setTransform(new DOMMatrix().scale(1 / scale));
      paperPattern = pattern;
    }
  }

  function paintPaper(target) {
    target.fillStyle = paperColor;
    target.fillRect(0, 0, size.width, size.height);
    if (paperPattern) {
      target.fillStyle = paperPattern;
      target.fillRect(0, 0, size.width, size.height);
    }
  }

  function updateBrushWidth() {
    const widthText = `${widthControl.value} píxeles`;
    widthControl.setAttribute('aria-valuetext', widthText);
    if (widthLabel) widthLabel.textContent = `${widthControl.value} px`;
  }

  function drawSegment(target, stroke, point, previous) {
    const x = point.x * size.width;
    const y = point.y * size.height;
    target.beginPath();
    if (previous) {
      target.lineWidth = stroke.width;
      target.lineCap = 'round';
      target.strokeStyle = stroke.color;
      target.moveTo(previous.x * size.width, previous.y * size.height);
      target.lineTo(x, y);
      target.stroke();
    } else {
      target.fillStyle = stroke.color;
      target.arc(x, y, stroke.width / 2, 0, Math.PI * 2);
      target.fill();
    }
  }

  function paintStrokes(target) {
    for (const stroke of strokes) {
      stroke.points.forEach((point, index) => drawSegment(target, stroke, point, stroke.points[index - 1]));
    }
  }

  function repaint() {
    paintPaper(context);
    paintStrokes(context);
    if (!cursor.visible) return;

    const x = cursor.x * size.width;
    const y = cursor.y * size.height;
    context.beginPath();
    context.arc(x, y, 9, 0, Math.PI * 2);
    context.strokeStyle = '#fff';
    context.lineWidth = 4;
    context.stroke();
    context.strokeStyle = inkColor;
    context.lineWidth = 2;
    context.stroke();
  }

  function resizeCanvas() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;

    const density = pixelDensity();
    const pixelWidth = Math.max(1, Math.round(width * density));
    const pixelHeight = Math.max(1, Math.round(height * density));
    if (width === size.width && height === size.height && canvas.width === pixelWidth && canvas.height === pixelHeight) return;

    size = { width, height };
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    context.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
    updatePaper();
    repaint();
  }

  function updateActions() {
    const hasInk = strokes.length > 0;
    undo.disabled = !hasInk;
    clear.disabled = !hasInk;
    download.disabled = !hasInk;
    if (hasInk) canvasArea.dataset.hasInk = 'true';
    else delete canvasArea.dataset.hasInk;
  }

  function startStroke(point) {
    const stroke = { color: inkColor, width: widthControl.valueAsNumber, points: [point] };
    strokes.push(stroke);
    drawSegment(context, stroke, point);
    updateActions();
    return stroke;
  }

  function addPoint(stroke, point) {
    const previous = stroke.points.at(-1);
    if (point.x === previous.x && point.y === previous.y) return;
    stroke.points.push(point);
    drawSegment(context, stroke, point, previous);
  }

  const clamp = value => Math.max(0, Math.min(1, value));

  function pointerPosition(event, rectangle) {
    return {
      x: clamp((event.clientX - rectangle.left) / rectangle.width),
      y: clamp((event.clientY - rectangle.top) / rectangle.height)
    };
  }

  function stopDrawing() {
    keyboardStroke = null;
    if (!activePointer) return;
    const { id } = activePointer;
    activePointer = null;
    if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  }

  canvas.addEventListener('pointerdown', event => {
    if (activePointer || !event.isPrimary || event.button !== 0) return;
    resizeCanvas();
    if (!size.width || !size.height) return;

    event.preventDefault();
    keyboardStroke = null;
    if (cursor.visible) {
      cursor.visible = false;
      repaint();
    }
    const position = pointerPosition(event, canvas.getBoundingClientRect());
    activePointer = { id: event.pointerId, stroke: startStroke(position) };
    Object.assign(cursor, position);
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', event => {
    if (event.pointerId !== activePointer?.id) return;
    const rectangle = canvas.getBoundingClientRect();
    if (!rectangle.width || !rectangle.height) return;
    const samples = event.getCoalescedEvents?.();
    for (const sample of samples?.length ? samples : [event]) {
      const position = pointerPosition(sample, rectangle);
      addPoint(activePointer.stroke, position);
      Object.assign(cursor, position);
    }
  });

  canvas.addEventListener('pointerup', event => {
    if (event.pointerId !== activePointer?.id) return;
    const rectangle = canvas.getBoundingClientRect();
    if (rectangle.width && rectangle.height) {
      const position = pointerPosition(event, rectangle);
      addPoint(activePointer.stroke, position);
      Object.assign(cursor, position);
    }
    activePointer = null;
  });

  for (const type of ['pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(type, event => {
      if (event.pointerId === activePointer?.id) activePointer = null;
    });
  }

  const keyboardDirections = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1]
  };

  canvas.addEventListener('focus', () => {
    if (!canvas.matches(':focus-visible')) return;
    cursor.visible = true;
    repaint();
  });

  canvas.addEventListener('blur', () => {
    keyboardStroke = null;
    cursor.visible = false;
    repaint();
  });

  canvas.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const direction = keyboardDirections[event.key];
    const paintDot = event.key === ' ' || event.key === 'Enter';
    if ((!direction && !paintDot) || activePointer || !size.width || !size.height) return;

    event.preventDefault();
    cursor.visible = true;
    if (direction) {
      const next = {
        x: clamp(cursor.x + (direction[0] * 12) / size.width),
        y: clamp(cursor.y + (direction[1] * 12) / size.height)
      };
      if (!event.shiftKey) keyboardStroke = null;
      else if (next.x !== cursor.x || next.y !== cursor.y) {
        keyboardStroke ??= startStroke({ x: cursor.x, y: cursor.y });
        addPoint(keyboardStroke, next);
      }
      Object.assign(cursor, next);
    } else if (!event.repeat) {
      keyboardStroke = null;
      startStroke({ x: cursor.x, y: cursor.y });
    }
    repaint();
  });

  canvas.addEventListener('keyup', event => {
    if (event.key === 'Shift') keyboardStroke = null;
  });

  function undoStroke() {
    if (!strokes.length) return;
    stopDrawing();
    strokes.pop();
    repaint();
    if (!strokes.length && document.activeElement === undo) canvas.focus({ preventScroll: true });
    updateActions();
    announce('Último trazo deshecho.');
  }

  undo.addEventListener('click', undoStroke);
  lab.addEventListener('keydown', event => {
    if (!event.ctrlKey && !event.metaKey) return;
    if (event.altKey || event.shiftKey || event.key.toLowerCase() !== 'z' || !strokes.length) return;
    event.preventDefault();
    undoStroke();
  });

  clear.addEventListener('click', () => {
    stopDrawing();
    strokes.length = 0;
    repaint();
    canvas.focus({ preventScroll: true });
    updateActions();
    announce('Lienzo limpio.');
  });

  download.addEventListener('click', () => {
    if (!strokes.length || !size.width || !size.height) return;

    const image = document.createElement('canvas');
    image.width = canvas.width;
    image.height = canvas.height;
    const exportContext = image.getContext('2d');
    if (!exportContext) return;

    exportContext.setTransform(image.width / size.width, 0, 0, image.height / size.height, 0, 0);
    paintPaper(exportContext);
    paintStrokes(exportContext);
    image.toBlob(blob => {
      if (!blob) {
        announce('La descarga no pudo generarse.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mi-muestra-tintanova.png';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      announce('Descarga de la muestra iniciada.');
    });
  });

  const initialPigment = pigmentButtons.find(button => button.getAttribute('aria-pressed') === 'true');
  selectPigment(initialPigment || pigmentButtons[0], false);
  selectSurface(false);
  updateBrushWidth();
  updateActions();
  resizeCanvas();

  pigmentButtons.forEach(button => button.addEventListener('click', () => selectPigment(button, true)));
  document.querySelectorAll('[data-select-pigment]').forEach(link => {
    const button = pigmentButtons.find(option => option.dataset.pigment === link.dataset.selectPigment);
    if (button) link.addEventListener('click', () => selectPigment(button, true));
  });
  surface.addEventListener('change', () => selectSurface(true));
  widthControl.addEventListener('input', updateBrushWidth);
  window.addEventListener('resize', resizeCanvas);
  if ('ResizeObserver' in window) new ResizeObserver(resizeCanvas).observe(canvas);
})();
