
const admin = (req, res) => {
    res.render('propiedades/admin', {
        pagina: "Mis propiedades",
        barra: true,
    });
}

// Formulario para crear un registro de propiedad
const crear = (req, res) => {
    res.render("propiedades/crear", {
      pagina: "Crear Propiedad",
      barra: true,
    });
}

export {
    admin,
    crear,
}