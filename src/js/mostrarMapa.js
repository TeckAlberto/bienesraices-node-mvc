(function () {
  const lat = parseFloat(document.querySelector("#lat").textContent);
  const lng = parseFloat(document.querySelector("#lng").textContent);
  const calle = document.querySelector("#calle").textContent;

  console.log(lat, lng);

  const mapa = L.map("mapa-propiedad").setView([lat, lng], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(mapa );

  // Agregar el pin
  L.marker([lat, lng]).addTo(mapa).bindPopup(calle);

})();
