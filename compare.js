const sampleBoard = document.querySelector('#mesa-de-muestras .sample-board');

if (sampleBoard) {
  const samples = {
    zanahoria: {
      title: 'Ámbar-naranja',
      origin: 'Zanahoria · β-caroteno',
      observation: 'El equipo observó fluidez media y un secado de 3–4 min sobre papel bond.',
    },
    remolacha: {
      title: 'Carmín-violeta',
      origin: 'Remolacha · Betanina',
      observation: 'En la prueba preliminar, el trazo fue continuo y homogéneo, con un tono de rojo intenso a magenta.',
    },
    espinaca: {
      title: 'Verde bosque',
      origin: 'Espinaca · Clorofilas a y b',
      observation: 'La extracción en frío dio un tono de verde oliva a vegetal. El equipo recomienda proteger el extracto de la luz.',
    },
  };

  const panes = Array.from(sampleBoard.querySelectorAll('.sample-pane'), (element) => ({
    element,
    picker: element.querySelector('.sample-picker'),
    select: element.querySelector('select'),
    canvas: element.querySelector('canvas'),
    fallback: element.querySelector('.sample-stroke'),
    title: element.querySelector('h3'),
    origin: element.querySelector('.sample-origin'),
    observation: element.querySelector('.sample-observation'),
  }));

  function paintSample(canvas, color) {
    const context = canvas.getContext('2d');
    if (!context) return false;

    // Keep the same bristles and pools at every pigment setting.
    let seed = 2026;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const x = (t) => 61 + 604 * t;
    const center = (t) => 146 + 29 * Math.sin(4.75 * t) - 22 * t;
    const halfWidth = (t) => Math.min(12 * t, 1) * (3 + 38 * (1 - t) ** .48);

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.strokeStyle = color;
    context.lineCap = 'round';
    context.globalAlpha = .51;
    context.beginPath();
    context.moveTo(x(0), center(0));
    for (let i = 1; i <= 70; i++) {
      const t = i / 70;
      context.lineTo(x(t), center(t) + halfWidth(t) * (.87 + random() * .2));
    }
    for (let i = 70; i >= 0; i--) {
      const t = i / 70;
      context.lineTo(x(t), center(t) - halfWidth(t) * (.83 + random() * .24));
    }
    context.closePath();
    context.fill();

    for (let strand = 0; strand < 94; strand++) {
      const position = random() * 2.24 - 1.12;
      const start = random() ** 2 * .2;
      const end = 1 - random() ** 2 * .3;
      const waviness = random() * 2.7;
      context.lineWidth = .4 + random() * 2.6;
      context.globalAlpha = .075 + random() * .18;
      context.beginPath();
      for (let i = 0; i <= 32; i++) {
        const t = start + (end - start) * i / 32;
        context.lineTo(x(t), center(t) + position * halfWidth(t) + waviness * Math.sin(t * 15 + strand));
      }
      context.stroke();
    }

    for (let mark = 0; mark < 100; mark++) {
      const t = random();
      const offset = (random() - .5) * 3.1;
      context.globalAlpha = .08 + random() * .21;
      context.beginPath();
      context.ellipse(x(t), center(t) + halfWidth(t) * offset, .6 + random() * 3, .5 + random(), -.18, 0, 2 * Math.PI);
      context.fill();
    }
    context.globalAlpha = 1;
    return true;
  }

  function updatePane(pane) {
    const pigment = pane.select.value;
    const sample = samples[pigment];
    pane.element.dataset.samplePigment = pigment;
    pane.title.textContent = sample.title;
    pane.origin.textContent = sample.origin;
    pane.observation.textContent = sample.observation;
    const color = getComputedStyle(pane.element).getPropertyValue('--sample-ink').trim();
    if (paintSample(pane.canvas, color)) {
      pane.canvas.hidden = false;
      pane.fallback.hidden = true;
    }
  }

  function updateChoices() {
    for (const pane of panes) {
      const other = panes.find((item) => item !== pane);
      for (const option of pane.select.options) {
        option.disabled = option.value === other.select.value;
      }
    }
  }

  for (const pane of panes) {
    pane.picker.hidden = false;
    updatePane(pane);
    pane.select.addEventListener('change', () => {
      updatePane(pane);
      updateChoices();
    });
  }
  updateChoices();

  const zoom = sampleBoard.querySelector('[data-sample-zoom]');
  zoom.hidden = false;
  zoom.addEventListener('click', () => {
    const expanded = zoom.getAttribute('aria-pressed') !== 'true';
    zoom.setAttribute('aria-pressed', String(expanded));
    sampleBoard.dataset.expanded = String(expanded);
  });
}
