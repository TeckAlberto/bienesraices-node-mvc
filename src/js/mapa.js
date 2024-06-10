(function () {
  const lat = document.querySelector('#lat').value || 20.67444163271174;
  const lng = document.querySelector("#lng").value || -103.38739216304566;
  const mapa = L.map("mapa").setView([lat, lng], 14);
  let marker;

  // Utilizar Provider y Geocoder
    const geocodeService = L.esri.Geocoding.geocodeService();

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(mapa);

  // El pin
  marker = new L.marker([lat, lng], {
    draggable: true,
    autoPan: true
  })
  .addTo(mapa);

  // Detectar el movimiento del pin
  marker.on('moveend', function(event) {
    marker = event.target;
    const posicion = marker.getLatLng();
    mapa.panTo(new L.LatLng(posicion.lat, posicion.lng));

    // Obtener la informacion de las calles
    geocodeService.reverse().latlng(posicion, 14).run(function(err, res) {
        
        marker.bindPopup(res.address.LongLabel)

        // Llenar los campos
        document.querySelector('.calle').textContent = res?.address?.Address ?? '';
        document.querySelector('#calle').value = res?.address?.Address ?? '';
        document.querySelector('#lat').value = res?.latlng?.lat ?? '';
        document.querySelector('#lng').value = res?.latlng?.lng ?? '';
    })

  })
})();
