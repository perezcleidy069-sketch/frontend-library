# Campus Library

Interfaz web adaptable para explorar el catálogo de Campus Library. Está inspirada en la navegación, el tema oscuro y los acentos turquesa de [GreekRank](https://github.com/perezcleidy069-sketch/greekrank), y consume los datos de la [Campus Library API](https://github.com/perezcleidy069-sketch/campus_library).

## Funcionalidades

- Catálogo de libros conectado a la API REST.
- Búsqueda por título, autor y editorial.
- Filtros por categoría y vistas de catálogo, disponibilidad y categorías.
- Diseño adaptable a móviles y escritorio.
- Estados de carga, conexión y error con opción para volver a intentar.

## API

- Repositorio y documentación: [perezcleidy069-sketch/campus_library](https://github.com/perezcleidy069-sketch/campus_library)
- URL base local: `http://localhost:3000/api/v1`
- Estado del servicio: `http://localhost:3000/api/v1/health`
- Swagger UI: `http://localhost:3000/api-docs`
- Catálogo de libros: `http://localhost:3000/api/v1/books?limit=100`

La API no publica una URL de producción en su documentación. Para usar otro servidor, cambia el valor de `content` en la etiqueta `meta[name="api-base"]` de `index.html` por la URL base, incluyendo `/api/v1` (por ejemplo, `https://api.ejemplo.com/api/v1`). Configura también `CORS_ORIGINS` en la API para permitir el origen donde se publique esta web.

## Requisitos

- Navegador moderno.
- Node.js 20 o superior y MySQL 8 para ejecutar la API localmente.

## Ejecución local

1. Clona este repositorio y el de la [API](https://github.com/perezcleidy069-sketch/campus_library).
2. Sigue las instrucciones de configuración de MySQL y `.env` en el README de la API.
3. En la carpeta de la API, ejecuta `npm install` y luego `npm run dev`.
4. Inicia un servidor estático en otro puerto, por ejemplo `npx serve . -l 5173`, y abre la dirección que indique el comando.

El catálogo necesita que la API esté activa y que CORS permita el origen del frontend. El puerto `5173` está incluido en la configuración de ejemplo de la API. La web no requiere dependencias de npm ni un proceso de compilación.

## Estructura

```text
.
├── index.html   # Estructura y navegación de la aplicación
├── styles.css   # Estilos adaptables
├── app.js       # Integración con la API y comportamiento de la interfaz
└── README.md
```
# Backend
- https://github.com/perezcleidy069-sketch/campus_library