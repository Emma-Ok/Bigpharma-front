# Imagen de desarrollo: solo trae Node. El código entra como volumen, con
# node_modules dentro de la carpeta del proyecto para que el editor vea los tipos.
# Se instala siempre desde el contenedor (ver docker-compose.yml).
FROM node:24.22.2-bookworm-slim

ENV ASTRO_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false

# Certificados raíz: workerd (runtime de Cloudflare que usa el adaptador al compilar) los necesita.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# El punto de montaje de la caché de npm se crea aquí para que Docker lo
# inicialice con dueño node (uid 1000, el mismo usuario de WSL).
RUN mkdir -p /home/node/.npm \
 && chown -R node:node /app /home/node/.npm

USER node

EXPOSE 4321

# --ignore-lock: el contenedor tiene un solo servidor; el bloqueo de Astro quedaría obsoleto al recrearlo.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "4321", "--ignore-lock"]
