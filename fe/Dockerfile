FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY *.json ./
COPY next.config.ts ./
COPY postcss.config.mjs ./

# Install dependencies
RUN npm install --verbose

RUN npx shadcn@latest add badge button calendar card checkbox \
    command dialog dropdown-menu input label popover select separator \
    sheet slider switch table tooltip "https://greenk.dev/r/monthpicker.json"