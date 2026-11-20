const balance = document.querySelector("#balance-materia");

if (balance) {
  const simulator = balance.querySelector(".dossier-simulator");
  const slider = balance.querySelector("#masa-vegetal");
  const selection = balance.querySelector("#masa-seleccionada");
  const massFields = balance.querySelectorAll("[data-mass-share]");

  function formatMass(grams) {
    const formatted = grams.toLocaleString("es-NI").replaceAll(",", "\u202f");
    return formatted + "\u00a0g";
  }

  function updateMassBalance() {
    const grams = slider.valueAsNumber;
    const selectedMass = formatMass(grams);

    selection.value = selectedMass;
    slider.setAttribute("aria-valuetext", selectedMass);

    for (const field of massFields) {
      const share = Number(field.dataset.massShare);
      field.textContent = formatMass(grams * share / 100);
    }
  }

  slider.addEventListener("input", updateMassBalance);
  updateMassBalance();
  simulator.hidden = false;
}
