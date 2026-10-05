# Search Focus Guard para Chrome

Extensión de búsqueda local para Chrome. Carga la carpeta completa mediante `chrome://extensions` → **Modo de desarrollador** → **Cargar descomprimida**. La carpeta puede llamarse como quieras; conserva dentro los archivos de la extensión.

- Abrir la barra: botón de la extensión o `Ctrl + Shift + E`.
- En el menú de la extensión puedes guardar un texto de búsqueda predeterminado. Se carga automáticamente cada vez que abres la barra; deja el campo vacío para usar la búsqueda anterior.
- `Ctrl + V` dentro de la barra no pega el portapapeles: restaura el texto predeterminado (o la última búsqueda si no hay texto predeterminado).
- Buscar: escribe en la barra; el texto de búsqueda se conserva localmente.
- La búsqueda incluye texto visible en el DOM, Shadow DOM abierto e iframes accesibles del mismo origen.
- Con coincidencias, solicita la confirmación nativa de navegación/cierre de Chrome. Chrome puede no mostrarla hasta que haya interacción real con la página y siempre permite confirmar el cierre.
- El macro `Acttive Search Focus Guard.ahk` es opcional. Necesita AutoHotkey v2 y se ejecuta aparte; no forma parte de la extensión.

Chrome no permite que una extensión lea Shadow DOM cerrado, iframes de otros orígenes ni páginas internas protegidas, como `chrome://` y Chrome Web Store.

## Archivos para compartir

Para publicar el proyecto, sube la carpeta completa `chrome-search-guard`, incluidos `manifest.json`, los scripts, el CSS, `popup.html`, este README y el macro AHK. No incluyas datos privados ni carpetas de perfil de Chrome.
