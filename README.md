# Proyecto Final: Sitios para "Tirar Charco" en Antioquia
# Objetivo del Proyecto:
Este proyecto tiene como propósito ofrecer un portal interactivo y útil para los visitantes de Antioquia interesados en descubrir los mejores sitios para "tirar charco" (visitar piscinas naturales y ríos). La página mostrará un catálogo de estos sitios, con funcionalidades de búsqueda y filtrado, y permitirá la interacción y retroalimentación de los usuarios a través de opiniones, imágenes y calificaciones.

# Características Principales
- Página Principal:
Visualización de todos los charcos disponibles en Antioquia con un catálogo basado en la base de datos.
Barra de búsqueda para filtrar resultados, permitiendo al usuario buscar charcos por:
- Nombre del Pueblo: Encuentra los charcos disponibles en una ubicación específica.
- Nombre del Charco: Muestra detalles específicos del charco seleccionado.

Cada charco se presentara en diseño de tarjetas que muestran información relevante de cada charco como lo son:
- Nombre del Charco y Ubicación
- Opiniones de otros usuarios
- Costo de entrada o indicación si es público
- Videos del lugar (si aplica)

# Registro e Inicio de Sesión:
- Usuarios Comunes:
Pueden explorar charcos, opinar, subir imágenes, guardar sitios favoritos y visualizar los charcos en tendencia según las opiniones.
- Usuarios Administradores:
Tienen permisos adicionales, como supervisar y moderar la plataforma, convertir a usuarios comunes en administradores, subir charcos nuevos con sus imagenes, y eliminar lugares o comentarios inapropiados.
La constraseña para el usuario administrador por defecto será admin123

# Tecnologías Utilizadas
- HTML y CSS: Para la estructura y estilo del contenido, creando una interfaz atractiva y organizada.
- JavaScript: Para manejar la interacción del usuario y la carga dinámica de contenido en la página.
- Node.js: En el backend, gestionando las peticiones, la lógica del servidor y la conexión con la base de datos.
- MySQL: Para el almacenamiento y gestión de datos de los charcos, opiniones, usuarios, y tendencias.

# Despliegue y Contenedores en Docker
El proyecto se desplegará utilizando contenedores Docker. Se crearán los siguientes contenedores:
- Backend: Contenedor que ejecuta el servidor Node.js y gestiona las operaciones lógicas y conexiones de datos.
- Base de Datos: Contenedor de MySQL para almacenar información sobre los charcos, usuarios y opiniones.
- Frontend: Contenedor para el servidor web encargado de servir el contenido estático (HTML, CSS, JS).
Docker Compose se utilizará para simplificar la configuración y la comunicación entre estos contenedores.

# Expansión y Mejoras Futuras
Integración Completa con Google Maps: Permitir que los usuarios obtengan direcciones detalladas con un solo clic desde la página.
Sugerencias Basadas en Preferencias del Usuario: Proporcionar recomendaciones personalizadas de charcos en función de las interacciones previas y opiniones del usuario.
